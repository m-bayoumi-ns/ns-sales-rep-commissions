import webRelease from "@/lib/android-release-web.json";

/**
 * The Android WebView app offered by the website. CI publishes its APK under public/downloads.
 */
export type AndroidRelease = { version: string; bytes: number; publishedAt: string };

export const ANDROID_APP = {
  file: "/downloads/ns-commissions-web.apk",
  package: "com.naguibselim.commissions",
  release: webRelease,
};

/** The download button's link: redirects to the Android WebView APK. */
export const ANDROID_APK_URL = "/api/app/download";

/** What the browser needs to know about the app (GET /api/app/download?info=1). */
export type AndroidDownloadInfo = { package: string } & AndroidRelease;

export function downloadInfo(): AndroidDownloadInfo {
  return { package: ANDROID_APP.package, ...ANDROID_APP.release };
}

export function sizeMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
