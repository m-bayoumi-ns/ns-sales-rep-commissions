import "server-only";
import { isDemoMode } from "@/lib/dev";
import { PROFILE_TABLE } from "@/lib/auth/profile";
import { addMonths, currentMonth } from "@/lib/finance/core";
import { findSheetName } from "@/lib/commissions/names";
import { readTargetSheet } from "@/lib/commissions/storage";
import { readJson, writeJson } from "@/lib/commissions/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Sales-rep accounts. They live in the same Supabase Auth + `profiles` table as ns-home:
 *   permission_type = specific_branches, branch_filter_type = sales_rep, sales_reps = [the rep's sheet name],
 *   allowed_pages = ["sales-commissions"]  →  the rep sees only their own commission.
 * "Must change password" is a flag in the Auth user's app_metadata, cleared when the password is changed.
 */
export const SELLER_PAGE = "sales-commissions";
const APP_SETTINGS = "ns-sales-rep-commissions/app-settings.json";

export type AppSettings = { autoApprove: boolean };
export async function loadAppSettings(): Promise<AppSettings> {
  const data = await readJson<Partial<AppSettings>>(APP_SETTINGS);
  return { autoApprove: data?.autoApprove ?? false };
}
export async function saveAppSettings(settings: AppSettings) {
  await writeJson(APP_SETTINGS, settings);
}

export type SellerAccount = {
  id: string;
  email: string;
  name: string;
  rep: string | null;
  active: boolean;
  mustChangePassword: boolean;
  lastSignIn: string | null;
  createdAt: string | null;
};

type ProfileRow = { id: string; email: string | null; full_name: string | null; sales_reps: string[] | null; is_active: boolean | null; permission_type: string | null; branch_filter_type: string | null };

const DEMO_ACCOUNTS: SellerAccount[] = [
  { id: "demo-seller-1", email: "seller1@example.com", name: "محمود احمد مرسي", rep: "محمود احمد مرسي", active: true, mustChangePassword: false, lastSignIn: null, createdAt: null },
  { id: "demo-seller-2", email: "seller2@example.com", name: "كريم محمد محسن", rep: "كريم محمد محسن", active: false, mustChangePassword: true, lastSignIn: null, createdAt: null },
];

/** Every sales-rep account (administrators only). */
export async function listSellerAccounts(): Promise<SellerAccount[]> {
  if (isDemoMode()) return DEMO_ACCOUNTS;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from(PROFILE_TABLE)
    .select("id, email, full_name, sales_reps, is_active, permission_type, branch_filter_type")
    .eq("branch_filter_type", "sales_rep")
    .neq("permission_type", "super_admin");
  if (error) throw new Error(`profiles: ${error.message}`);
  const rows = (data ?? []) as ProfileRow[];
  const users = new Map<string, { app_metadata?: Record<string, unknown>; last_sign_in_at?: string; created_at?: string; email?: string }>();
  for (let page = 1; page <= 20; page++) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) throw new Error(`auth users: ${listError.message}`);
    for (const user of list.users) users.set(user.id, user);
    if (list.users.length < 1000) break;
  }
  return rows
    .map((row) => {
      const auth = users.get(row.id);
      return {
        id: row.id,
        email: row.email ?? auth?.email ?? "",
        name: row.full_name ?? row.email ?? "",
        rep: row.sales_reps?.[0] ?? null,
        active: row.is_active ?? true,
        mustChangePassword: Boolean(auth?.app_metadata?.must_change_password),
        lastSignIn: auth?.last_sign_in_at ?? null,
        createdAt: auth?.created_at ?? null,
      };
    })
    .sort((a, b) => Number(a.active) - Number(b.active) || a.name.localeCompare(b.name, "ar"));
}

/** Only sales-rep accounts can be changed from this site (never managers or administrators). */
async function assertSeller(userId: string) {
  if (isDemoMode()) return;
  const { data } = await createSupabaseAdminClient().from(PROFILE_TABLE).select("branch_filter_type, permission_type").eq("id", userId).maybeSingle();
  if (!data || data.branch_filter_type !== "sales_rep" || data.permission_type === "super_admin" || data.permission_type === "all_branches") {
    throw new Error("Not a sales-rep account");
  }
}

export async function setSellerActive(userId: string, active: boolean) {
  await assertSeller(userId);
  if (isDemoMode()) return;
  const { error } = await createSupabaseAdminClient().from(PROFILE_TABLE).update({ is_active: active }).eq("id", userId);
  if (error) throw new Error(error.message);
}

/** Turns the "change password at next sign-in" flag on or off. It clears itself when the user changes the password. */
export async function setMustChangePassword(userId: string, value: boolean, { checkSeller = true } = {}) {
  if (checkSeller) await assertSeller(userId);
  if (isDemoMode()) return;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new Error(error?.message ?? "User not found");
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { app_metadata: { ...data.user.app_metadata, must_change_password: value } });
  if (updateError) throw new Error(updateError.message);
}

// ---------------------------------------------------------------- registration
export type RegisterResult =
  | { status: "created"; active: boolean }
  | { status: "unknown" }
  | { status: "exists" }
  | { status: "emailTaken" }
  | { status: "noSheet" }
  | { status: "error" };

/** The latest target sheet that exists (this month, else up to three months back). */
export async function latestSheet() {
  let month = currentMonth();
  for (let step = 0; step < 4; step++, month = addMonths(month, -1)) {
    const sheet = await readTargetSheet(month);
    if (sheet.found && sheet.reps.length) return { month, sheet };
  }
  return null;
}

export async function registerSeller(input: { name: string; email: string; password: string }): Promise<RegisterResult> {
  const latest = await latestSheet();
  if (!latest) return { status: "noSheet" };
  const repName = findSheetName(input.name, latest.sheet.reps.map((rep) => rep.name));
  if (!repName) return { status: "unknown" };
  if (isDemoMode()) return { status: "created", active: false };

  const admin = createSupabaseAdminClient();
  // One account per sales rep.
  const { data: existing, error: existingError } = await admin.from(PROFILE_TABLE).select("id").contains("sales_reps", [repName]).limit(1);
  if (existingError) {
    console.error("[register] profiles lookup failed:", existingError.message);
    return { status: "error" };
  }
  if (existing?.length) return { status: "exists" };

  const { autoApprove } = await loadAppSettings();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: repName },
    app_metadata: { must_change_password: false, source: "ns-sales-rep-commissions" },
  });
  if (createError || !created.user) {
    if (createError && /already|registered|exists/i.test(createError.message)) return { status: "emailTaken" };
    console.error("[register] create user failed:", createError?.message);
    return { status: "error" };
  }
  const { error: profileError } = await admin.from(PROFILE_TABLE).upsert(
    {
      id: created.user.id,
      email: input.email,
      full_name: repName,
      job_title: "Sales representative",
      permission_type: "specific_branches",
      branch_filter_type: "sales_rep",
      branches: [],
      sales_reps: [repName],
      allowed_pages: [SELLER_PAGE],
      is_active: autoApprove,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    console.error("[register] profile insert failed:", profileError.message);
    await admin.auth.admin.deleteUser(created.user.id);
    return { status: "error" };
  }
  return { status: "created", active: autoApprove };
}
