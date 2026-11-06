import { type NextRequest, NextResponse } from "next/server";
import { ANDROID_APPS, downloadInfo } from "@/lib/android-app";
import { chosenAndroidVariant } from "@/lib/app/download";

/**
 * The website's "Download for Android" link. Public (the download page is open to everyone).
 *   GET /api/app/download         → redirects to the APK chosen in Settings (native or WebView app)
 *   GET /api/app/download?info=1  → { variant, package, version, bytes, publishedAt } for the page's buttons
 */
export async function GET(request: NextRequest) {
  const variant = await chosenAndroidVariant();
  const headers = { "Cache-Control": "no-store" };
  if (request.nextUrl.searchParams.has("info")) return NextResponse.json(downloadInfo(variant), { headers });
  return NextResponse.redirect(new URL(ANDROID_APPS[variant].file, request.url), { status: 302, headers });
}
