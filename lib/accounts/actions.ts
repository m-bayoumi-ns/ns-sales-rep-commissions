"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { isLocale, routing } from "@/i18n/routing";
import { logActivity } from "@/lib/activity";
import { readSessionUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/permissions";
import { clearFailures, isLocked, recordFailure } from "@/lib/auth/rate-limit";
import { isDemoMode } from "@/lib/dev";
import { isAdminConfigured, publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type CreateResult,
  createSheetAccounts,
  loadAppSettings,
  registerSeller,
  saveAppSettings,
  setMustChangePassword,
  setSellerActive,
  setSellerUsername,
  type UsernameResult,
} from "./server";

const password = z.string().min(8).max(72);

// ---------------------------------------------------------------- register
export type RegisterState = {
  status: "idle" | "invalid" | "mismatch" | "unknown" | "exists" | "emailTaken" | "noSheet" | "pending" | "locked" | "error";
  values?: { name: string; email: string };
};

const registerSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  password,
  confirm: z.string(),
});

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const localeField = String(formData.get("locale") ?? "");
  const locale = isLocale(localeField) ? localeField : routing.defaultLocale;
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", values };
  if (parsed.data.password !== parsed.data.confirm) return { status: "mismatch", values };
  if (!isAdminConfigured() && !isDemoMode()) return { status: "error", values };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const keys = [`register:${ip}`];
  if (isLocked(keys)) return { status: "locked", values };

  const result = await registerSeller(parsed.data);
  after(() => logActivity({ action: "register", email: parsed.data.email, details: { ip, name: parsed.data.name, result: result.status } }));
  if (result.status !== "created") {
    // Unknown names count toward the same throttle as failed sign-ins (stops name guessing).
    if (result.status === "unknown") recordFailure(keys);
    return { status: result.status, values };
  }
  clearFailures(keys);
  if (!result.active) return { status: "pending", values };

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  redirect(`/${locale}/commissions`);
}

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

export async function setAutoApprove(value: boolean): Promise<AccountResult> {
  await requireAdmin();
  try {
    await saveAppSettings({ ...(await loadAppSettings()), autoApprove: value });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[accounts] auto-approve failed:", error);
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
