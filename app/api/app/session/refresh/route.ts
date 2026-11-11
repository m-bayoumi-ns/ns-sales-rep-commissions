import { type NextRequest } from "next/server";
import { z } from "zod";
import { noStoreJson as json, sessionTokens as tokens, supabaseForApp } from "@/lib/app/session";
import { isSupabaseConfigured } from "@/lib/env";

const bodySchema = z.object({ refreshToken: z.string().min(10).max(2048) });

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  if (!isSupabaseConfigured()) return json({ error: "not_configured" }, 503);

  const { data, error } = await supabaseForApp().auth.refreshSession({ refresh_token: parsed.data.refreshToken });
  if (error || !data.session) return json({ error: "expired" }, 401);
  return json(tokens(data.session));
}
