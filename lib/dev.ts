/**
 * Demo mode for local development only: synthetic sales data (the parity-test
 * fixture) and a signed-in demo administrator, so the dashboard can be worked on
 * before Supabase is connected.
 *
 * Enabled ONLY when both are true:
 *   - `next dev` (NODE_ENV === "development"; `next build` / `next start` set "production")
 *   - NS_DEMO_DATA=1 in .env.development.local
 */
export function isDemoMode() {
  return process.env.NODE_ENV === "development" && process.env.NS_DEMO_DATA === "1";
}
