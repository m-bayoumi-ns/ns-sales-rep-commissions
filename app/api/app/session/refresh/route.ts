import type { NextRequest } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { noStoreJson as json, sessionTokens as tokens, supabaseForApp } from "@/lib/app/session";

/** Exchanges the Android app's refresh token for a new session (Supabase rotates the refresh token). */
const body = z.object({ refreshToken: z.string().min(10).max(2000) });

export async function POST(request: NextRequest) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  if (!isSupabaseConfigured()) return json({ error: "not_configured" }, 503);
  const { data, error } = await supabaseForApp().auth.refreshSession({ refresh_token: parsed.data.refreshToken });
  if (error || !data.session) return json({ error: "signed_out" }, 401);
  return json(tokens(data.session));
}
