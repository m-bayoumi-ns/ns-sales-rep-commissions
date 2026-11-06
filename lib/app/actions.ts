"use server";

import { readSessionUser } from "@/lib/auth/dal";
import { devicesFor, requestTest } from "./devices";

export type TestState = { status: "idle" | "sent" | "error" };

/** My account → "Send a test notification to my phone". */
export async function sendTestNotification(): Promise<TestState> {
  const user = await readSessionUser();
  if (!user) return { status: "error" };
  try {
    await requestTest(user.id);
    return { status: "sent" };
  } catch (error) {
    console.error("[app] test notification failed:", error);
    return { status: "error" };
  }
}

/**
 * Does the signed-in user have the Android app on a phone? (A phone of theirs checked in during the last 30 days.)
 * Chrome can't always tell whether an app installed from an APK is on the phone, so the phone banner also asks the
 * server. The "Open" link falls back to the download page if the app isn't on this particular phone.
 */
export async function hasAppInstalled(): Promise<boolean> {
  const user = await readSessionUser();
  if (!user) return false;
  try {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return (await devicesFor(user.id)).some((device) => device.lastSeenAt != null && Date.parse(device.lastSeenAt) > cutoff);
  } catch {
    return false;
  }
}
