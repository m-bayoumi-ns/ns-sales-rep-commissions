import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { isLocale, routing } from "@/i18n/routing";
import { buildFeed } from "@/lib/app/feed";
import { describeDevice, sessionIdOf } from "@/lib/app/logins";
import { readBearerToken, readBearerUser } from "@/lib/auth/bearer";
import { readSessionUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Phone notifications for the Android apps (native Bearer token or WebView session cookies).
 */
export async function GET(request: NextRequest) {
  const installId = request.headers.get("x-ns-install") ?? "";
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(installId)) {
    return NextResponse.json({ error: "missing install id" }, { status: 400 });
  }

  const bearerToken = await readBearerToken(request);
  const user = bearerToken ? await readBearerUser(request) : await readSessionUser();
  if (!user || !user.active) return NextResponse.json({ error: "signed_out" }, { status: 401 });

  let sessionId: string | null = bearerToken ? sessionIdOf(bearerToken) : null;
  if (!bearerToken && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    sessionId = typeof data?.claims?.session_id === "string" ? data.claims.session_id : null;
  }

  const cookieLocale = (await cookies()).get("NS_LOCALE")?.value;
  const queryLocale = request.nextUrl.searchParams.get("locale") ?? undefined;
  const locale = isLocale(queryLocale) ? queryLocale : isLocale(cookieLocale) ? cookieLocale : routing.defaultLocale;

  const userAgent = request.headers.get("user-agent");
  const appVersion = userAgent?.match(/NSCommissions(?:Native|App)\/([\d.]+)/)?.[1] ?? null;
  const items = await buildFeed(user, { installId, sessionId, appVersion, device: describeDevice(userAgent) }, locale);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
