import nativeRelease from "@/lib/android-release.json";
import webRelease from "@/lib/android-release-web.json";

/**
 * The two Android apps the website can offer. Settings → "Android app download" picks which one the download
 * button serves (lib/app/download.ts, /api/app/download). Vercel serves both files from public/downloads; CI replaces
 * each APK and its release file with every build (android-native-apk.yml, android-apk.yml).
 */
export const ANDROID_VARIANTS = ["native", "web"] as const;
export type AndroidVariant = (typeof ANDROID_VARIANTS)[number];

export type AndroidRelease = { version: string; bytes: number; publishedAt: string };

export const ANDROID_APPS: Record<AndroidVariant, { file: string; package: string; release: AndroidRelease }> = {
  /** Native Kotlin app (android-native/). */
  native: { file: "/downloads/ns-commissions.apk", package: "com.naguibselim.commissionsapp", release: nativeRelease },
  /** WebView app (android/): the website inside an app. */
  web: { file: "/downloads/ns-commissions-web.apk", package: "com.naguibselim.commissions", release: webRelease },
};

export const DEFAULT_ANDROID_VARIANT: AndroidVariant = "native";

/** The download button's link: redirects to the APK chosen in Settings. */
export const ANDROID_APK_URL = "/api/app/download";

/** What the browser needs to know about the chosen app (GET /api/app/download?info=1). */
export type AndroidDownloadInfo = { variant: AndroidVariant; package: string } & AndroidRelease;

export function downloadInfo(variant: AndroidVariant): AndroidDownloadInfo {
  const app = ANDROID_APPS[variant];
  return { variant, package: app.package, ...app.release };
}

export function sizeMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
