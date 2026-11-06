import type { NextRequest } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { emailForSellerName } from "@/lib/accounts/lookup";
import { directLoginEmail } from "@/lib/accounts/usernames";
import { describeDevice, recordLogin, sessionIdOf } from "@/lib/app/logins";
import { clearFailures, isLocked, recordFailure } from "@/lib/auth/rate-limit";
import { noStoreJson as json, sessionTokens as tokens, supabaseForApp } from "@/lib/app/session";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Sign-in for the native Android app. Same rules as the website's sign-in form (lib/auth/actions.ts):
 * email, seller username or sheet name; 5 failures → 10-minute pause; activity log; sign-in alert on the
 * user's other devices. Returns the Supabase session tokens; the app sends the access token as a Bearer token.
 */
const credentials = z.object({
  identifier: z.string().trim().min(2).max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const parsed = credentials.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  if (!isSupabaseConfigured()) return json({ error: "not_configured" }, 503);

  const email = directLoginEmail(parsed.data.identifier) ?? (await emailForSellerName(parsed.data.identifier));
  if (!email) return json({ error: "invalid_credentials" }, 401);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limitKeys = [`email:${email}`, `ip:${ip}`];
  if (isLocked(limitKeys)) return json({ error: "locked" }, 429);

  const { data, error } = await supabaseForApp().auth.signInWithPassword({ email, password: parsed.data.password });
  if (error || !data.user || !data.session) {
    recordFailure(limitKeys);
    after(() => logActivity({ action: "sign_in_failed", email, details: { ip, reason: error?.code ?? "unknown", client: "android" } }));
    const isCredentials = !error || error.code === "invalid_credentials" || error.status === 400;
    if (!isCredentials) console.error("[app session] Supabase sign-in failed:", error);
    return json({ error: isCredentials ? "invalid_credentials" : "error" }, isCredentials ? 401 : 502);
  }

  clearFailures(limitKeys);
  const user = data.user;
  const session = data.session;
  after(() => logActivity({ action: "sign_in", userId: user.id, email, details: { ip, client: "android" } }));
  const device = describeDevice(request.headers.get("user-agent"));
  after(() => recordLogin(user.id, { at: new Date().toISOString(), sessionId: sessionIdOf(session.access_token), device }));
  return json(tokens(session));
}
