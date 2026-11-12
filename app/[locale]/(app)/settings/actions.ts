"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { loadAppSettings, saveAppSettings } from "@/lib/accounts/app-settings";
import { searchProducts, type ProductSearchResult } from "@/lib/commissions/odoo";
import { settingsSchema } from "@/lib/commissions/schema";
import { loadSettings, saveSettings } from "@/lib/commissions/storage";
import { rateChanges } from "@/lib/commissions/changes";
import { addNotification, deleteNotification } from "@/lib/commissions/notifications";
import { after } from "next/server";
import { logActivity } from "@/lib/activity";
import { pushFeedFor, pushFeedForAll } from "@/lib/app/push";

export type SaveResult = { ok: true; savedAt: string; notified: number } | { ok: false; reason: "invalid" | "forbidden" | "storage"; detail?: string };
export type ExportAccessSaveResult = { ok: true } | { ok: false; reason: "invalid" | "forbidden" | "storage" };
export type MonthVisibilitySaveResult = { ok: true } | { ok: false; reason: "invalid" | "forbidden" | "storage" };
export type DeleteNotificationResult = { ok: true } | { ok: false; reason: "invalid" | "forbidden" | "not_found" | "storage" };
export type SendCommissionMessageResult = { ok: true; notified: number } | { ok: false; reason: "invalid" | "forbidden" | "no_recipients" | "storage" };

const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const monthVisibilitySchema = z.object({
  from: monthKeySchema,
  to: z.union([monthKeySchema, z.literal("")]),
}).refine(({ from, to }) => !to || from <= to, { path: ["to"] });
const notificationIdSchema = z.string().uuid();
const commissionMessageSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  mode: z.enum(["all", "users"]),
  userIds: z.array(z.string().min(1).max(64)).max(500).default([]),
  note: z.string().trim().min(1).max(500),
});

const notifySchema = z.object({
  mode: z.enum(["none", "all", "users"]),
  userIds: z.array(z.string().min(1).max(64)).max(500).default([]),
  note: z.string().trim().max(500).optional(),
});
export type NotifyChoice = z.infer<typeof notifySchema>;

/** Updates the global visibility setting for commission Excel exports. */
export async function saveExcelExportAccess(raw: unknown): Promise<ExportAccessSaveResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { ok: false, reason: "forbidden" };
  const parsed = z.enum(["admins_only", "report_access"]).safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  try {
    const settings = await loadAppSettings();
    await saveAppSettings({ ...settings, excelExportAccess: parsed.data });
  } catch (error) {
    console.error("[settings] Excel export access save failed:", error);
    return { ok: false, reason: "storage" };
  }
  revalidatePath("/[locale]/(app)/settings", "page");
  revalidatePath("/[locale]/(app)/commissions", "page");
  return { ok: true };
}

/** Updates which commission months are available in reports. */
export async function saveCommissionMonthVisibility(raw: unknown): Promise<MonthVisibilitySaveResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { ok: false, reason: "forbidden" };
  const parsed = monthVisibilitySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  try {
    const settings = await loadAppSettings();
    await saveAppSettings({
      ...settings,
      commissionMonthsFrom: parsed.data.from,
      commissionMonthsTo: parsed.data.to || undefined,
    });
  } catch (error) {
    console.error("[settings] commission month visibility save failed:", error);
    return { ok: false, reason: "storage" };
  }
  revalidatePath("/[locale]/(app)/settings", "page");
  revalidatePath("/[locale]/(app)/commissions", "page");
  return { ok: true };
}

/** Deletes one shared commission-rate notification (administrators only). */
export async function deleteCommissionNotification(rawId: unknown): Promise<DeleteNotificationResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { ok: false, reason: "forbidden" };
  const parsed = notificationIdSchema.safeParse(rawId);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  try {
    const deleted = await deleteNotification(parsed.data);
    if (!deleted) return { ok: false, reason: "not_found" };
  } catch (error) {
    console.error("[settings] commission notification delete failed:", error);
    return { ok: false, reason: "storage" };
  }
  revalidatePath("/[locale]/(app)/settings", "page");
  return { ok: true };
}

/** Sends a standalone message to selected sellers without saving monthly commission settings. */
export async function sendCommissionMessage(raw: unknown): Promise<SendCommissionMessageResult> {
  const user = await requireUser();
  if (!isAdmin(user)) return { ok: false, reason: "forbidden" };
  const parsed = commissionMessageSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  if (parsed.data.mode === "users" && !parsed.data.userIds.length) return { ok: false, reason: "no_recipients" };

  const recipients = parsed.data.mode === "all"
    ? { mode: "all" as const }
    : { mode: "users" as const, userIds: [...new Set(parsed.data.userIds)] };
  try {
    await addNotification({
      kind: "message",
      month: parsed.data.month,
      by: user.name,
      recipients,
      changes: [],
      note: parsed.data.note,
    });
  } catch (error) {
    console.error("[settings] commission message send failed:", error);
    return { ok: false, reason: "storage" };
  }

  const notified = recipients.mode === "all" ? -1 : recipients.userIds.length;
  after(async () => {
    if (recipients.mode === "all") await pushFeedForAll();
    else for (const id of recipients.userIds) await pushFeedFor(id);
  });
  after(() => logActivity({
    action: "notify",
    userId: user.id,
    email: user.email,
    details: { month: parsed.data.month, changes: 0, recipients, type: "message" },
  }));
  revalidatePath("/[locale]/(app)/settings", "page");
  return { ok: true, notified };
}

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
