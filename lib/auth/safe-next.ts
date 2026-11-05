/**
 * Where to go after signing in. Only same-site paths under a locale are allowed
 * (no "//evil.com", no backslashes); anything else falls back to the dashboard.
 */
export function safeNextPath(next: string | null | undefined, locale: string) {
  if (next && /^\/(en|ar)(\/[^/\\]|$)/.test(next) && !next.includes("//") && !next.includes("\\")) {
    return next;
  }
  return `/${locale}/commissions`;
}
