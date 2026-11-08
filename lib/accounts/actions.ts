"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { readSessionUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { normalizeName } from "@/lib/commissions/names";
import { isDemoMode } from "@/lib/dev";
import { ANDROID_VARIANTS } from "@/lib/android-app";
import { publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type CreateResult,
  createSheetAccounts,
  loadAppSettings,
  saveAppSettings,
  setMustChangePassword,
  setSellerActive,
  setSellerUsername,
  type UsernameResult,
} from "./server";

const password = z.string().min(8).max(72);

// ---------------------------------------------------------------- change own password
export type PasswordState = { status: "idle" | "invalid" | "mismatch" | "same" | "wrongCurrent" | "saved" | "error" };

const passwordSchema = z.object({ current: z.string().min(1).max(200), next: password, confirm: z.string() });

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await readSessionUser();
  if (!user) return { status: "error" };
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid" };
  if (parsed.data.next !== parsed.data.confirm) return { status: "mismatch" };
  if (parsed.data.next === parsed.data.current) return { status: "same" };
  if (isDemoMode()) return { status: "saved" };

  // Check the current password on a throw-away client, so the signed-in session is untouched.
  const env = publicEnv();
  const check = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: wrong } = await check.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (wrong) return { status: "wrongCurrent" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) {
    console.error("[account] password update failed:", error.message);
    return { status: "error" };
  }
  const { data: fresh } = await supabase.auth.getUser();
  if (user.mustChangePassword || fresh?.user?.app_metadata?.must_change_password) {
    // The forced change is done: the flag switches itself off until an administrator turns it on again.
    await setMustChangePassword(user.id, false, { checkSeller: false });
  }
  await supabase.auth.refreshSession();
  after(() => logActivity({ action: "change_password", userId: user.id, email: user.email, details: { forced: user.mustChangePassword } }));
  revalidatePath("/", "layout");
  return { status: "saved" };
}

// ---------------------------------------------------------------- administrator: seller accounts
export type AccountResult = { ok: boolean };

async function requireAdmin() {
  const user = await readSessionUser();
  if (!user || !isAdmin(user)) throw new Error("forbidden");
  return user;
}

export async function setAccountActive(userId: string, active: boolean): Promise<AccountResult> {
  const admin = await requireAdmin();
  try {
    await setSellerActive(z.string().min(1).parse(userId), active);
    after(() => logActivity({ action: active ? "approve_account" : "disable_account", userId: admin.id, email: admin.email, details: { target: userId } }));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[accounts] set active failed:", error);
    return { ok: false };
  }
}

export async function setForcePassword(userId: string, value: boolean): Promise<AccountResult> {
  const admin = await requireAdmin();
  try {
    await setMustChangePassword(z.string().min(1).parse(userId), value);
    after(() => logActivity({ action: "force_password_change", userId: admin.id, email: admin.email, details: { target: userId, value } }));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[accounts] force password failed:", error);
    return { ok: false };
  }
}

/** Settings → Android app download: which app the website's download button serves (administrators only). */
export async function setAndroidDownload(value: string): Promise<AccountResult> {
  const admin = await requireAdmin();
  const parsed = z.enum(ANDROID_VARIANTS).safeParse(value);
  if (!parsed.success) return { ok: false };
  try {
    await saveAppSettings({ ...(await loadAppSettings()), androidDownload: parsed.data });
    after(() => logActivity({ action: "android_download_changed", userId: admin.id, email: admin.email, details: { value: parsed.data } }));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[accounts] android download setting failed:", error);
    return { ok: false };
  }
}

/** Creates accounts (username + default password) for reps of the latest target sheet; empty list = every rep without one. */
export async function createAccountsFromSheet(names: string[]): Promise<{ ok: boolean; results: CreateResult[] }> {
  const admin = await requireAdmin();
  try {
    const results = await createSheetAccounts(z.array(z.string().max(200)).max(500).parse(names));
    after(() => logActivity({ action: "approve_account", userId: admin.id, email: admin.email, details: { created: results.filter((row) => row.status === "created").map((row) => row.username) } }));
    revalidatePath("/", "layout");
    return { ok: true, results };
  } catch (error) {
    console.error("[accounts] create from sheet failed:", error);
    return { ok: false, results: [] };
  }
}

/** Administrator: change a rep's username (renames the account's sign-in, or reserves it for the account to be created). */
export async function changeSellerUsername(repName: string, userId: string | null, username: string): Promise<UsernameResult> {
  const admin = await requireAdmin();
  try {
    const result = await setSellerUsername({ repName: String(repName).slice(0, 200), userId: userId ? String(userId) : null, username: String(username) });
    if (result.ok) {
      after(() => logActivity({ action: "username_changed", userId: admin.id, email: admin.email, details: { repName, userId, username: result.username } }));
      revalidatePath("/", "layout");
    }
    return result;
  } catch (error) {
    console.error("[accounts] username change failed:", error);
    return { ok: false, reason: "error" };
  }
}

/** Administrator: choose the label shown on this seller's commission detail card. Empty restores the sheet name. */
export async function setSellerDisplayName(repName: string, displayName: string): Promise<AccountResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ repName: z.string().trim().min(1).max(200), displayName: z.string().trim().max(120) }).safeParse({ repName, displayName });
  if (!parsed.success) return { ok: false };

  try {
    const settings = await loadAppSettings();
    const sellerDisplayNames = { ...(settings.sellerDisplayNames ?? {}) };
    const key = normalizeName(parsed.data.repName);
    if (parsed.data.displayName) sellerDisplayNames[key] = parsed.data.displayName;
    else delete sellerDisplayNames[key];
    await saveAppSettings({ ...settings, sellerDisplayNames });
    after(() => logActivity({ action: "seller_display_name_changed", userId: admin.id, email: admin.email, details: { repName: parsed.data.repName, displayName: parsed.data.displayName || null } }));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[accounts] display name change failed:", error);
    return { ok: false };
  }
}
