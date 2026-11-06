import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isDemoMode } from "@/lib/dev";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { readSessionUser } from "./dal";
import { loadAppUser } from "./profile";
import type { AppUser } from "./types";

/**
 * Session read for the native Android app, which signs in with Supabase Auth directly and sends
 * `Authorization: Bearer <access token>` instead of cookies. The token is verified with getClaims, and the
 * profile is read as that user (RLS applies), exactly like readSessionUser does for the website.
 */
export async function readBearerUser(request: Request): Promise<AppUser | null> {
  if (isDemoMode()) return readSessionUser();
  if (!isSupabaseConfigured()) return null;
  const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return null;

  const env = publicEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;

  const user = await loadAppUser(supabase, data.claims);
  if (!user.mustChangePassword && user.branchFilterType === "sales_rep" && user.permissionType !== "super_admin") {
    const { data: fresh } = await supabase.auth.getUser(token);
    if (fresh?.user?.app_metadata?.must_change_password) return { ...user, mustChangePassword: true };
  }
  return user;
}
