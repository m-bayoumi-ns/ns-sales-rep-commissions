import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { isLocale, routing } from "@/i18n/routing";
import { buildFeed } from "@/lib/app/feed";
import { describeDevice, sessionIdOf } from "@/lib/app/logins";
import { readBearerUser } from "@/lib/auth/bearer";
import { readSessionUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Phone notifications for the Android app (see lib/app/feed.ts).
 * WebView app: authenticated with the same session cookies its web view uses; refreshed cookies are sent back
 * in Set-Cookie and the app stores them, so the session keeps working in the background.
 * Native app (android-native/): `Authorization: Bearer <access token>`, refreshed by the app itself.
 */
export async function GET(request: NextRequest) {
  const installId = request.headers.get("x-ns-install") ?? "";
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(installId)) {
    return NextResponse.json({ error: "missing install id" }, { status: 400 });
  }

  const bearer = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  const user = bearer ? await readBearerUser(request) : await readSessionUser();
  if (!user || !user.active) return NextResponse.json({ error: "signed_out" }, { status: 401 });

  let sessionId: string | null = null;
  if (bearer) {
    sessionId = sessionIdOf(bearer);
  } else if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    sessionId = typeof data?.claims?.session_id === "string" ? data.claims.session_id : null;
  }

  const cookieLocale = (await cookies()).get("NS_LOCALE")?.value;
  const queryLocale = request.nextUrl.searchParams.get("locale") ?? undefined;
  const locale = isLocale(cookieLocale) ? cookieLocale : isLocale(queryLocale) ? queryLocale : routing.defaultLocale;

  const userAgent = request.headers.get("user-agent");
  const appVersion = userAgent?.match(/NSCommissionsApp\/([\d.]+)/)?.[1] ?? null;
  const items = await buildFeed(user, { installId, sessionId, appVersion, device: describeDevice(userAgent) }, locale);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
