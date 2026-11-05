import { createBrowserClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "./cookie-options";

/** Browser Supabase client (anon key only). Used for sign-in / sign-out. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: supabaseCookieOptions(typeof window === "undefined" ? null : window.location.hostname) },
  );
}
