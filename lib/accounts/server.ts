import "server-only";
import { isDemoMode } from "@/lib/dev";
import { PROFILE_TABLE } from "@/lib/auth/profile";
import { addMonths, currentMonth } from "@/lib/finance/core";
import { findSheetName, normalizeName } from "@/lib/commissions/names";
import { loadMonthSetup } from "@/lib/commissions/view";
import { usernameFor, usernameOf, loginEmail } from "./usernames";
import { readTargetSheet } from "@/lib/commissions/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadAppSettings, saveAppSettings } from "./app-settings";

export { loadAppSettings, saveAppSettings } from "./app-settings";
export type { AppSettings } from "./app-settings";

/**
 * Sales-rep accounts. They live in the same Supabase Auth + `profiles` table as ns-home:
 *   permission_type = specific_branches, branch_filter_type = sales_rep, sales_reps = [the rep's sheet name],
 *   allowed_pages = ["sales-commissions"]  →  the rep sees only their own commission.
 * "Must change password" is a flag in the Auth user's app_metadata, cleared when the password is changed.
 */
export const SELLER_PAGE = "sales-commissions";

export type SellerAccount = {
  id: string;
  email: string;
  /** Sign-in username for accounts created from the target sheet (null for a real email). */
  username: string | null;
  name: string;
  rep: string | null;
  active: boolean;
  mustChangePassword: boolean;
  lastSignIn: string | null;
  createdAt: string | null;
};

type ProfileRow = { id: string; email: string | null; full_name: string | null; sales_reps: string[] | null; allowed_pages?: string[] | null; is_active: boolean | null; permission_type: string | null; branch_filter_type: string | null };

/**
 * A seller account of this site: created here (registration / target sheet), or a sales-rep profile whose only page
 * is the commissions page. ns-home users who merely filter by sales rep (managers, analysts…) are not shown or changed.
 */
function isSellerAccount(row: ProfileRow, appMetadata: Record<string, unknown> | undefined) {
  if (row.branch_filter_type !== "sales_rep" || row.permission_type === "super_admin" || row.permission_type === "all_branches") return false;
  if (appMetadata?.source === "ns-sales-rep-commissions") return true;
  const pages = (row.allowed_pages ?? []).filter(Boolean);
  return pages.length > 0 && pages.every((page) => page === SELLER_PAGE);
}

const DEMO_ACCOUNTS: SellerAccount[] = [
  { id: "demo-seller-1", email: "seller1@example.com", name: "محمود احمد مرسي", rep: "محمود احمد مرسي", username: null, active: true, mustChangePassword: false, lastSignIn: null, createdAt: null },
  { id: "demo-seller-2", email: "seller2@example.com", name: "كريم محمد محسن", rep: "كريم محمد محسن", username: "nsr2916", active: false, mustChangePassword: true, lastSignIn: null, createdAt: null },
];

/** Every sales-rep account (administrators only). */
export async function listSellerAccounts(): Promise<SellerAccount[]> {
  if (isDemoMode()) return DEMO_ACCOUNTS;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from(PROFILE_TABLE)
    .select("id, email, full_name, sales_reps, allowed_pages, is_active, permission_type, branch_filter_type")
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
    .filter((row) => isSellerAccount(row, users.get(row.id)?.app_metadata))
    .map((row) => {
      const auth = users.get(row.id);
      return {
        id: row.id,
        email: row.email ?? auth?.email ?? "",
        username: usernameOf(row.email ?? auth?.email ?? ""),
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
  const admin = createSupabaseAdminClient();
  const [{ data }, { data: auth }] = await Promise.all([
    admin.from(PROFILE_TABLE).select("id, email, full_name, sales_reps, allowed_pages, is_active, branch_filter_type, permission_type").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);
  if (!data || !isSellerAccount(data as ProfileRow, auth?.user?.app_metadata)) {
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

// ---------------------------------------------------------------- accounts from the target sheet
/** Default password for accounts created from the sheet; the seller must change it at first sign-in. */
export const DEFAULT_PASSWORD = "00000000";

export type SheetRepAccount = { name: string; displayName: string; odooUserId: number | null; account: SellerAccount | null; username: string };

/** Reps of the latest target sheet, each with their account (if any) and the username a new account would get. */
export async function sheetRepAccounts(accounts: SellerAccount[]): Promise<{ month: string; reps: SheetRepAccount[] } | null> {
  const latest = await latestSheet();
  if (!latest) return null;
  const setup = await loadMonthSetup(latest.month);
  const byRep = new Map(accounts.filter((account) => account.rep).map((account) => [normalizeName(account.rep!), account]));
  const taken = new Set(accounts.map((account) => account.username).filter((name): name is string => name != null));
  const appSettings = await loadAppSettings();
  const chosen = appSettings.usernames ?? {};
  for (const name of Object.values(chosen)) taken.add(name);
  const reps = setup.reps.map((rep) => {
    const account = byRep.get(normalizeName(rep.name)) ?? null;
    const preset = chosen[normalizeName(rep.name)];
    return {
      name: rep.name,
      displayName: appSettings.sellerDisplayNames?.[normalizeName(rep.name)] ?? rep.name,
      odooUserId: rep.odooUserId,
      account,
      username: account?.username ?? preset ?? usernameFor(rep.name, rep.odooUserId, taken),
    };
  });
  return { month: latest.month, reps };
}

export type CreateResult = { name: string; username: string; status: "created" | "exists" | "error"; detail?: string };

/**
 * Creates accounts for the given sheet reps (all missing ones when `names` is empty): username + default password,
 * active at once, and "must change password" on so the seller picks their own password at first sign-in.
 */
export async function createSheetAccounts(names: string[]): Promise<CreateResult[]> {
  const accounts = await listSellerAccounts();
  const sheet = await sheetRepAccounts(accounts);
  if (!sheet) return [];
  const wanted = names.length ? new Set(names.map(normalizeName)) : null;
  const todo = sheet.reps.filter((rep) => (wanted ? wanted.has(normalizeName(rep.name)) : true));
  const out: CreateResult[] = [];
  for (const rep of todo) {
    if (rep.account) {
      out.push({ name: rep.name, username: rep.account.username ?? rep.account.email, status: "exists" });
      continue;
    }
    if (isDemoMode()) {
      out.push({ name: rep.name, username: rep.username, status: "created" });
      continue;
    }
    const admin = createSupabaseAdminClient();
    const email = loginEmail(rep.username);
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: rep.name, username: rep.username },
      app_metadata: { must_change_password: true, source: "ns-sales-rep-commissions" },
    });
    if (error || !data.user) {
      out.push({ name: rep.name, username: rep.username, status: /already|registered|exists/i.test(error?.message ?? "") ? "exists" : "error", detail: error?.message });
      continue;
    }
    const { error: profileError } = await admin.from(PROFILE_TABLE).upsert(
      {
        id: data.user.id,
        email,
        full_name: rep.name,
        job_title: "Sales representative",
        permission_type: "specific_branches",
        branch_filter_type: "sales_rep",
        branches: [],
        sales_reps: [rep.name],
        allowed_pages: [SELLER_PAGE],
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      out.push({ name: rep.name, username: rep.username, status: "error", detail: profileError.message });
      continue;
    }
    out.push({ name: rep.name, username: rep.username, status: "created" });
  }
  return out;
}

// ---------------------------------------------------------------- usernames
export type UsernameResult = { ok: true; username: string } | { ok: false; reason: "invalid" | "taken" | "notSeller" | "error"; detail?: string };

/** 3–32 characters: lowercase letters, digits, dot, dash, underscore; starts with a letter or digit. */
export function cleanUsername(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value) ? value : null;
}

/** True when some account already signs in with this email (any account in `profiles`, not only sellers). */
export async function accountEmailExists(email: string, exceptUserId?: string): Promise<boolean> {
  if (isDemoMode()) return DEMO_ACCOUNTS.some((account) => account.email === email || loginEmail(account.username ?? "") === email);
  // Case-insensitive exact match (escape the LIKE wildcards "_" and "%" that usernames may contain).
  const pattern = email.replace(/[\\%_]/g, (char) => `\\${char}`);
  const { data, error } = await createSupabaseAdminClient().from(PROFILE_TABLE).select("id").ilike("email", pattern).limit(2);
  if (error) throw new Error(error.message);
  return (data ?? []).some((row) => row.id !== exceptUserId);
}

/**
 * Changes a rep's username. With an account: its sign-in email becomes <username>@reps.naguibselim.local (the password
 * is unchanged). Without one yet: the username is remembered and used when the account is created.
 */
export async function setSellerUsername(input: { repName: string; userId: string | null; username: string }): Promise<UsernameResult> {
  const username = cleanUsername(input.username);
  if (!username) return { ok: false, reason: "invalid" };
  const email = loginEmail(username);
  const settings = await loadAppSettings();
  const chosen = { ...(settings.usernames ?? {}) };
  const key = normalizeName(input.repName);
  // Not already used by another account, nor reserved for another rep.
  if (Object.entries(chosen).some(([name, value]) => value === username && name !== key)) return { ok: false, reason: "taken" };
  if (await accountEmailExists(email, input.userId ?? undefined)) return { ok: false, reason: "taken" };

  if (!input.userId) {
    chosen[key] = username;
    await saveAppSettings({ ...settings, usernames: chosen });
    return { ok: true, username };
  }

  const accounts = await listSellerAccounts();
  const account = accounts.find((row) => row.id === input.userId);
  if (!account) return { ok: false, reason: "notSeller" };
  if (isDemoMode()) return { ok: true, username };
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin.auth.admin.getUserById(account.id);
  const { error } = await admin.auth.admin.updateUserById(account.id, {
    email,
    email_confirm: true,
    user_metadata: { ...(current?.user?.user_metadata ?? {}), username },
  });
  if (error) return { ok: false, reason: /already|registered|exists/i.test(error.message) ? "taken" : "error", detail: error.message };
  const { error: profileError } = await admin.from(PROFILE_TABLE).update({ email }).eq("id", account.id);
  if (profileError) return { ok: false, reason: "error", detail: profileError.message };
  if (chosen[key]) {
    delete chosen[key];
    await saveAppSettings({ ...settings, usernames: chosen });
  }
  return { ok: true, username };
}
