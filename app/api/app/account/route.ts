import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { setMustChangePassword } from "@/lib/accounts/server";
import { devicesFor, requestTest } from "@/lib/app/devices";
import { loginsFor, sessionIdOf } from "@/lib/app/logins";
import { pushFeedFor } from "@/lib/app/push";
import { sessionTokens } from "@/lib/app/session";
import { readBearerToken, readBearerUser } from "@/lib/auth/bearer";
import { isAdmin, isSeller } from "@/lib/auth/permissions";
import { normalizeName } from "@/lib/commissions/names";
import { isDemoMode } from "@/lib/dev";
import { publicEnv } from "@/lib/env";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Native Android app: My Account & security (GET profile + devices + logins; POST password change or test notification).
 */
export async function GET(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user || !user.active) return json({ error: "signed_out" }, 401);
  const token = await readBearerToken(request);
  const sessionId = sessionIdOf(token ?? undefined);

  const [devices, logins, appSettings] = await Promise.all([
    devicesFor(user.id).catch(() => []),
    loginsFor(user.id).catch(() => []),
    isSeller(user) ? loadAppSettings().catch(() => null) : Promise.resolve(null),
  ]);
  const sellerRep = user.salesReps[0] ?? null;
  const displayName = sellerRep ? (appSettings?.sellerDisplayNames?.[normalizeName(sellerRep)] ?? sellerRep) : user.name;

  return json({
    user: {
      id: user.id,
      name: user.name,
      displayName,
      email: user.email,
      role: isAdmin(user) ? "admin" : isSeller(user) ? "seller" : "manager",
      mustChangePassword: user.mustChangePassword,
      linkedRep: sellerRep,
    },
    sessionId,
    devices,
    logins: logins.slice(0, 8),
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("changePassword"),
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal("testNotification"),
  }),
]);

export async function POST(request: NextRequest) {
  const user = await readBearerUser(request);
  if (!user || !user.active) return json({ error: "signed_out" }, 401);

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, reason: "invalid" }, 400);
  const body = parsed.data;

  if (body.action === "testNotification") {
    try {
      await requestTest(user.id);
      after(() => pushFeedFor(user.id));
      return json({ ok: true });
    } catch (error) {
      console.error("[app account] test notification failed:", error);
      return json({ ok: false, reason: "error" }, 502);
    }
  }

  if (body.newPassword !== body.confirmPassword) return json({ ok: false, reason: "mismatch" }, 400);
  if (body.newPassword === body.currentPassword) return json({ ok: false, reason: "same" }, 400);
  if (isDemoMode()) return json({ ok: true });

  const env = publicEnv();
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: signedIn, error: wrong } = await client.auth.signInWithPassword({
    email: user.email,
    password: body.currentPassword,
  });
  if (wrong || !signedIn.session) return json({ ok: false, reason: "wrongCurrent" }, 400);

  const authed = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${signedIn.session.access_token}` } },
  });
  const { error: updateErr } = await authed.auth.updateUser({ password: body.newPassword });
  if (updateErr) {
    console.error("[app account] password update failed:", updateErr.message);
    return json({ ok: false, reason: "error" }, 502);
  }

  await setMustChangePassword(user.id, false, { checkSeller: false }).catch((err) =>
    console.error("[app account] clear mustChangePassword failed:", err),
  );
  after(() => logActivity({ action: "change_password", userId: user.id, email: user.email, details: { forced: user.mustChangePassword, client: "android" } }));

  const { data: refreshed } = await client.auth.signInWithPassword({
    email: user.email,
    password: body.newPassword,
  });

  return json({
    ok: true,
    session: refreshed?.session ? sessionTokens(refreshed.session) : null,
  });
}
