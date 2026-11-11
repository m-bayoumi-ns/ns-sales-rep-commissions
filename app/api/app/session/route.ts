import { after } from "next/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { emailForSellerName } from "@/lib/accounts/lookup";
import { accountEmailExists } from "@/lib/accounts/server";
import { directLoginEmail } from "@/lib/accounts/usernames";
import { describeDevice, recordLogin, sessionIdOf } from "@/lib/app/logins";
import { pushFeedFor } from "@/lib/app/push";
import { noStoreJson as json, sessionTokens as tokens, supabaseForApp } from "@/lib/app/session";
import { clearFailures, isLocked, recordFailure } from "@/lib/auth/rate-limit";
import { isAdminConfigured, isSupabaseConfigured } from "@/lib/env";

/**
 * Native Android app sign-in: accepts an email, seller username ("nsr305") or sheet name, applies the same
 * rate limit and activity log as the website form, and returns the Supabase session tokens.
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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limitKeys = [`email:${email ?? parsed.data.identifier.toLowerCase()}`, `ip:${ip}`];
  if (isLocked(limitKeys)) return json({ error: "locked" }, 429);

  let exists = email != null;
  if (email && isAdminConfigured()) {
    try {
      exists = await accountEmailExists(email);
    } catch (error) {
      console.error("[app session] account lookup failed:", error);
    }
  }
  if (!email || !exists) {
    recordFailure(limitKeys);
    return json({ error: "unknown_user" }, 401);
  }

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
  after(async () => {
    await recordLogin(user.id, { at: new Date().toISOString(), sessionId: sessionIdOf(session.access_token), device });
    await pushFeedFor(user.id);
  });
  return json(tokens(session));
}
