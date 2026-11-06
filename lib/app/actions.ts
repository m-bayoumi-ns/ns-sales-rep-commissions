"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import type { PushSubscription } from "web-push";
import { isLocale, routing } from "@/i18n/routing";
import { readSessionUser } from "@/lib/auth/dal";
import { devicesFor, requestTest } from "./devices";
import { describeDevice } from "./logins";
import { pushFeedFor, removeSubscription, saveSubscription, vapidKeys } from "./push";

export type TestState = { status: "idle" | "sent" | "error" };

/** My account → "Send a test notification to my phone". */
export async function sendTestNotification(): Promise<TestState> {
  const user = await readSessionUser();
  if (!user) return { status: "error" };
  try {
    await requestTest(user.id);
    // Browsers / iPhone web app get it pushed now; the Android app is pinged over realtime.
    after(() => pushFeedFor(user.id));
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
    return (await devicesFor(user.id)).some(
      (device) => !device.installId.startsWith("web-") && device.lastSeenAt != null && Date.parse(device.lastSeenAt) > cutoff,
    );
  } catch {
    return false;
  }
}

/** Public VAPID key for the browser's push subscription. */
export async function getPushPublicKey(): Promise<string | null> {
  try {
    return (await vapidKeys()).publicKey;
  } catch (error) {
    console.error("[push] keys unavailable:", error);
    return null;
  }
}

/** Saves this browser's push subscription and sends the "notifications are on" confirmation right away. */
export async function subscribePush(subscription: PushSubscription, localeRaw: string): Promise<boolean> {
  const user = await readSessionUser();
  if (!user || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return false;
  const locale = isLocale(localeRaw) ? localeRaw : routing.defaultLocale;
  const device = describeDevice((await headers()).get("user-agent"));
  try {
    await saveSubscription(user.id, { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } }, locale, device);
    after(() => pushFeedFor(user.id));
    return true;
  } catch (error) {
    console.error("[push] subscribe failed:", error);
    return false;
  }
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  const user = await readSessionUser();
  if (!user || !endpoint) return;
  await removeSubscription(user.id, endpoint).catch(() => {});
}
