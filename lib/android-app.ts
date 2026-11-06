import release from "@/lib/android-release.json";

/** Served by Vercel from public/downloads; CI replaces the APK and android-release.json with every Android build. */
export const ANDROID_APK_URL = "/downloads/ns-commissions.apk";
export const ANDROID_RELEASE: { version: string; bytes: number; publishedAt: string } = release;

export function sizeMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
