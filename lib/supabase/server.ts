import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { adminEnv, publicEnv } from "@/lib/env";
import { supabaseCookieOptions } from "./cookie-options";

/** Supabase client acting as the signed-in user (RLS applies). Server Components, actions, route handlers. */
export async function createSupabaseServerClient() {
  const env = publicEnv();
  const cookieStore = await cookies();
  const host = (await headers()).get("host");

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: supabaseCookieOptions(host),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes the session cookie instead.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS. Server-only, for reading sales files and
 * writing activity logs. Never pass its results to the browser unfiltered.
 */
export function createSupabaseAdminClient() {
  const env = adminEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
