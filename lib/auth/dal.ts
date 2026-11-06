import "server-only";
import { cacheLife } from "next/cache";
import { locale as rootLocale } from "next/root-params";
import { redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { isDemoMode } from "@/lib/dev";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAppUser } from "./profile";
import type { AppUser } from "./types";

/**
 * Data Access Layer: the only place that reads the session.
 * Verifies the Supabase JWT (getClaims) and loads the user's permissions.
 * Returns null when nobody is signed in.
 *
 * `use cache: private` keeps the result in the browser's router cache only (never on
 * the server), so navigations stay instant; every server request re-verifies.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  "use cache: private";
  cacheLife({ stale: 60, revalidate: 300, expire: 300 });
  return readSessionUser();
}

/** Uncached session read — for Route Handlers (exports), which re-check on every request. */
export async function readSessionUser(): Promise<AppUser | null> {
  if (isDemoMode()) return DEMO_USER;
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const user = await loadAppUser(supabase, data.claims);
  // The session token may predate an administrator switching "must change password" on (or a sheet-created account's
  // first sign-in may carry a token without it), so for sales-rep accounts read the flag from the Auth user itself.
  if (!user.mustChangePassword && user.branchFilterType === "sales_rep" && user.permissionType !== "super_admin") {
    const { data: fresh } = await supabase.auth.getUser();
    if (fresh?.user?.app_metadata?.must_change_password) return { ...user, mustChangePassword: true };
  }
  return user;
}

/** For Server Components: the signed-in user, or a redirect to the login page. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    const segment = await rootLocale();
    const locale = isLocale(segment) ? segment : routing.defaultLocale;
    redirect({ href: { pathname: "/login", query: { reason: "expired" } }, locale });
  }
  return user!;
}

/** requireUser, plus: a user who must change their password is sent to the account page first. */
export async function requireReadyUser(): Promise<AppUser> {
  const user = await requireUser();
  if (user.mustChangePassword) {
    const segment = await rootLocale();
    const locale = isLocale(segment) ? segment : routing.defaultLocale;
    redirect({ href: { pathname: "/account", query: { force: "1" } }, locale });
  }
  return user;
}

/** Local development only (lib/dev.ts). */
const DEMO_USER: AppUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo@localhost",
  name: "Demo Admin",
  jobTitle: null,
  permissionType: "super_admin",
  branchFilterType: "branch",
  branches: [],
  salesReps: [],
  allowedPages: [],
  active: true,
  mustChangePassword: false,
};
