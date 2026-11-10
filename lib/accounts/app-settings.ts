import "server-only";
import { normalizeName } from "@/lib/commissions/names";
import { readJson, writeJson } from "@/lib/commissions/storage";

const APP_SETTINGS = "ns-sales-rep-commissions/app-settings.json";

export type AppSettings = {
  /** Usernames chosen by an administrator for sheet reps who have no account yet (normalized name → username). */
  usernames?: Record<string, string>;
  /** Display names for individual commission cards (normalized sheet name → display name). */
  sellerDisplayNames?: Record<string, string>;
};

export async function loadAppSettings(): Promise<AppSettings> {
  const data = await readJson<Partial<AppSettings>>(APP_SETTINGS);
  const sellerDisplayNames: Record<string, string> = {};
  for (const [name, value] of Object.entries(data?.sellerDisplayNames ?? {})) {
    if (typeof value !== "string") continue;
    const displayName = value.trim().slice(0, 120);
    const key = normalizeName(name);
    if (key && displayName) sellerDisplayNames[key] = displayName;
  }
  return {
    usernames: data?.usernames ?? {},
    sellerDisplayNames,
  };
}

export async function saveAppSettings(settings: AppSettings) {
  await writeJson(APP_SETTINGS, settings);
}
