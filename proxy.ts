import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isLocale, routing } from "./i18n/routing";
import { safeNextPath } from "./lib/auth/safe-next";
import { supabaseCookieOptions } from "./lib/supabase/cookie-options";

const intl = createMiddleware(routing);

/**
 * Runs before every page:
 *  1. next-intl adds the /en or /ar prefix (and remembers the choice).
 *  2. The Supabase session cookie is refreshed when it is about to expire.
 *  3. Optimistic redirects: signed-out users → /login, signed-in users off /login.
 *
 * This is only a first gate. Pages and data endpoints check the session and the
 * user's permissions again on the server (lib/auth/dal.ts).
 */
export default async function proxy(request: NextRequest) {
  const response = intl(request);
  // Locale redirects (e.g. "/" → "/en/…") go out as they are.
  if (response.headers.has("location")) return response;

  const [, segment, ...rest] = request.nextUrl.pathname.split("/");
  const locale = isLocale(segment) ? segment : routing.defaultLocale;
  const isLoginPage = rest[0] === "login";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Local demo mode (lib/dev.ts): a demo admin is always signed in.
  let signedIn = process.env.NODE_ENV === "development" && process.env.NS_DEMO_DATA === "1";
  if (!signedIn && url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookieOptions: supabaseCookieOptions(request.nextUrl.hostname),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    // getClaims() verifies the JWT and refreshes the session if needed.
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  }

  if (!signedIn && !isLoginPage) {
    const login = new URL(`/${locale}/login`, request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    // A Supabase auth cookie that no longer verifies = the session expired.
    if (request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"))) {
      login.searchParams.set("reason", "expired");
    }
    return redirectWithCookies(login, response);
  }

  if (signedIn && isLoginPage) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"), locale);
    return redirectWithCookies(new URL(next, request.url), response);
  }

  return response;
}

/** Keeps any refreshed session cookies when redirecting. */
function redirectWithCookies(target: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(target);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  // Skip API routes, Next internals and files with an extension (logos, favicon…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
