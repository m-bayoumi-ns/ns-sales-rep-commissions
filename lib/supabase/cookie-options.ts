/**
 * Session cookie settings.
 *
 * On *.bayoumi.dev the cookie is shared across subdomains (one sign-in for ns-home and this app).
 * On any other host — a *.vercel.app deployment, a preview link, localhost — the cookie stays on that
 * host only: a browser rejects a cookie whose domain does not match the site, which would leave the
 * user without a stored session (pages kept working through the proxy, API calls got 401).
 */
const SHARED_DOMAIN = "bayoumi.dev";

export function supabaseCookieOptions(host?: string | null) {
  const isProduction = process.env.NODE_ENV === "production";
  const hostname = (host ?? "").split(":")[0].trim().toLowerCase();
  const shared = isProduction && (hostname === SHARED_DOMAIN || hostname.endsWith(`.${SHARED_DOMAIN}`));
  return {
    ...(shared ? { domain: `.${SHARED_DOMAIN}` } : {}),
    path: "/",
    sameSite: "lax" as const,
    secure: isProduction,
  };
}
