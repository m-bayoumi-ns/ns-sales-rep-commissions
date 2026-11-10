import { type NextRequest, NextResponse } from "next/server";
import { ANDROID_APP, downloadInfo } from "@/lib/android-app";

/**
 * The website's "Download for Android" link. Public (the download page is open to everyone).
 *   GET /api/app/download         → redirects to the Android WebView APK
 *   GET /api/app/download?info=1  → { package, version, bytes, publishedAt } for the page's buttons
 */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.nextUrl.searchParams.has("info")) return NextResponse.json(downloadInfo(), { headers });
  return NextResponse.redirect(new URL(ANDROID_APP.file, request.url), { status: 302, headers });
}
