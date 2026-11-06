"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { searchProducts, type ProductSearchResult } from "@/lib/commissions/odoo";
import { settingsSchema } from "@/lib/commissions/schema";
import { loadSettings, saveSettings } from "@/lib/commissions/storage";
import { rateChanges } from "@/lib/commissions/changes";
import { addNotification } from "@/lib/commissions/notifications";
import { after } from "next/server";
import { logActivity } from "@/lib/activity";
import { pushFeedFor, pushFeedForAll } from "@/lib/app/push";

export type SaveResult = { ok: true; savedAt: string; notified: number } | { ok: false; reason: "invalid" | "forbidden" | "storage"; detail?: string };

const notifySchema = z.object({
  mode: z.enum(["none", "all", "users"]),
  userIds: z.array(z.string().min(1).max(64)).max(500).default([]),
  note: z.string().trim().max(500).optional(),
});
export type NotifyChoice = z.infer<typeof notifySchema>;

/** Saves one month's commission settings as JSON in Supabase Storage (administrators only). */
export async function saveCommissionSettings(raw: unknown, notifyRaw?: unknown): Promise<SaveResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { ok: false, reason: "forbidden" };
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid", detail: parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" · ") };
  const notify = notifySchema.safeParse(notifyRaw ?? { mode: "none" });
  const savedAt = new Date().toISOString();
  let notified = 0;
  try {
    const before = (await loadSettings(parsed.data.month)).settings;
    await saveSettings({ ...parsed.data, updatedAt: savedAt, updatedBy: user.email });
    // Rate changes → a notification to the chosen sellers (all of them, or the accounts picked).
    const changes = rateChanges(before, parsed.data);
    if (notify.success && notify.data.mode !== "none" && (changes.length || notify.data.note)) {
      const recipients = notify.data.mode === "all" ? { mode: "all" as const } : { mode: "users" as const, userIds: notify.data.userIds };
      if (recipients.mode === "all" || recipients.userIds.length) {
        await addNotification({ month: parsed.data.month, by: user.name, recipients, changes, note: notify.data.note || null });
        notified = recipients.mode === "all" ? -1 : recipients.userIds.length;
        after(() => logActivity({ action: "notify", userId: user.id, email: user.email, details: { month: parsed.data.month, changes: changes.length, recipients } }));
        // Browsers / iPhone web apps: push the rate change now (the Android app hears the realtime ping).
        after(async () => {
          if (recipients.mode === "all") await pushFeedForAll();
          else for (const id of recipients.userIds) await pushFeedFor(id);
        });
      }
    }
  } catch (error) {
    console.error("[settings] save failed:", error);
    return { ok: false, reason: "storage", detail: error instanceof Error ? error.message : undefined };
  }
  revalidatePath("/", "layout");
  return { ok: true, savedAt, notified };
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
