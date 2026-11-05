"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { searchProducts, type ProductSearchResult } from "@/lib/commissions/odoo";
import { settingsSchema } from "@/lib/commissions/schema";
import { saveSettings } from "@/lib/commissions/storage";

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: "invalid" | "forbidden" | "storage"; detail?: string };

/** Saves one month's commission settings as JSON in Supabase Storage (administrators only). */
export async function saveCommissionSettings(raw: unknown): Promise<SaveResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { ok: false, reason: "forbidden" };
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid", detail: parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" · ") };
  const savedAt = new Date().toISOString();
  try {
    await saveSettings({ ...parsed.data, updatedAt: savedAt, updatedBy: user.email });
  } catch (error) {
    console.error("[settings] save failed:", error);
    return { ok: false, reason: "storage", detail: error instanceof Error ? error.message : undefined };
  }
  revalidatePath("/", "layout");
  return { ok: true, savedAt };
}

/** Product search for the product list (read-only Odoo). */
export async function findProducts(query: unknown): Promise<ProductSearchResult[]> {
  const user = await requireUser();
  if (!isAdmin(user)) return [];
  const text = z.string().max(80).safeParse(query);
  if (!text.success) return [];
  try {
    return await searchProducts(text.data);
  } catch (error) {
    console.error("[settings] product search failed:", error);
    return [];
  }
}
