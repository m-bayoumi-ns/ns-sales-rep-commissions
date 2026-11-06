import "server-only";
import { ping } from "@/lib/commissions/notifications";
import { listFiles, readJson, writeJson } from "@/lib/commissions/storage";

/**
 * Phones running the Android app, per user. Each phone keeps a state file that the feed (lib/app/feed.ts)
 * rewrites on every check, so "last check" here tells whether the phone is really reaching the server.
 */
export const DEVICES_FOLDER = "ns-sales-rep-commissions/app/devices";
const TESTS_FOLDER = "ns-sales-rep-commissions/app/tests";

export const safeId = (value: string) => value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
export const deviceFile = (userId: string, installId: string) => `${DEVICES_FOLDER}/${safeId(userId)}/${safeId(installId)}.json`;

export type DeviceInfo = {
  installId: string;
  lastSeenAt: string | null;
  appVersion: string | null;
  device: string | null;
  lastItems: number | null;
};

export async function devicesFor(userId: string): Promise<DeviceInfo[]> {
  const names = (await listFiles(`${DEVICES_FOLDER}/${safeId(userId)}`)).filter((name) => name.endsWith(".json"));
  const rows = await Promise.all(
    names.map(async (name) => {
      const state = await readJson<{ lastSeenAt?: string; appVersion?: string; device?: string; lastItems?: number }>(`${DEVICES_FOLDER}/${safeId(userId)}/${name}`);
      return {
        installId: name.replace(/\.json$/, ""),
        lastSeenAt: state?.lastSeenAt ?? null,
        appVersion: state?.appVersion ?? null,
        device: state?.device ?? null,
        lastItems: state?.lastItems ?? null,
      };
    }),
  );
  return rows.sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""));
}

/** "Send a test notification to my phones": every phone shows it on its next check (open apps check at once). */
export async function requestTest(userId: string) {
  await writeJson(`${TESTS_FOLDER}/${safeId(userId)}.json`, { at: new Date().toISOString() });
  await ping();
}

export async function lastTestRequest(userId: string): Promise<string | null> {
  return (await readJson<{ at?: string }>(`${TESTS_FOLDER}/${safeId(userId)}.json`))?.at ?? null;
}
