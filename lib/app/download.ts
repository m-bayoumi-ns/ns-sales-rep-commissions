import "server-only";
import { loadAppSettings } from "@/lib/accounts/app-settings";
import { type AndroidVariant, DEFAULT_ANDROID_VARIANT } from "@/lib/android-app";

/** The Android app chosen in Settings → Android app download (native by default, also when storage is unreachable). */
export async function chosenAndroidVariant(): Promise<AndroidVariant> {
  try {
    return (await loadAppSettings()).androidDownload ?? DEFAULT_ANDROID_VARIANT;
  } catch (error) {
    console.error("[download] app settings unavailable:", error);
    return DEFAULT_ANDROID_VARIANT;
  }
}
