import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import webpush from "web-push";
import { isLocale, type Locale, routing } from "@/i18n/routing";
import { loadAppUser } from "@/lib/auth/profile";
import { listFiles, listFolders, readJson, removeFile, writeJson } from "@/lib/commissions/storage";
import { isDemoMode } from "@/lib/dev";
import { adminEnv, isAdminConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildFeed } from "./feed";
import { safeId } from "./devices";

/**
 * Web push: notifications for the iPhone web app (Add to Home Screen, iOS 16.4+) and any browser that allows them.
 * The Android app pulls its news (GET /api/app/feed); a browser can't run in the background, so the server pushes:
 * it runs the same feed (lib/app/feed.ts) for each subscribed browser and sends every new item.
 * When: right after a sign-in, a settings save or a test request, and on a schedule (POST /api/app/push-tick) for
 * commission and bonus changes.
 *
 * Storage (Supabase, same bucket):
 *   ns-sales-rep-commissions/app/vapid.json                    the VAPID key pair (made on first use)
 *   ns-sales-rep-commissions/app/push/<userId>/<id>.json       one browser subscription
 */
const ROOT = "ns-sales-rep-commissions/app";
const PUSH_FOLDER = `${ROOT}/push`;
const VAPID_FILE = `${ROOT}/vapid.json`;
const SUBJECT = "mailto:it@naguibselim.com";

type Vapid = { publicKey: string; privateKey: string };
export type StoredSubscription = {
  subscription: webpush.PushSubscription;
  locale: Locale;
  device: string;
  createdAt: string;
};

let vapidCache: Vapid | null = null;

/** The VAPID keys, created and saved the first time they are needed. */
export async function vapidKeys(): Promise<Vapid> {
  if (vapidCache) return vapidCache;
  const stored = await readJson<Vapid>(VAPID_FILE);
  if (stored?.publicKey && stored.privateKey) return (vapidCache = stored);
  const fresh = webpush.generateVAPIDKeys();
  await writeJson(VAPID_FILE, fresh);
  // Re-read: if two requests raced, everyone uses the copy that was saved last.
  return (vapidCache = (await readJson<Vapid>(VAPID_FILE)) ?? fresh);
}

const subscriptionId = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex").slice(0, 24);
const subscriptionFile = (userId: string, endpoint: string) => `${PUSH_FOLDER}/${safeId(userId)}/${subscriptionId(endpoint)}.json`;

export async function saveSubscription(userId: string, subscription: webpush.PushSubscription, locale: Locale, device: string) {
  await writeJson(subscriptionFile(userId, subscription.endpoint), {
    subscription,
    locale,
    device,
    createdAt: new Date().toISOString(),
  } satisfies StoredSubscription);
}

export async function removeSubscription(userId: string, endpoint: string) {
  await removeFile(subscriptionFile(userId, endpoint));
}

async function subscriptionsOf(userId: string) {
  const folder = `${PUSH_FOLDER}/${safeId(userId)}`;
  const names = (await listFiles(folder)).filter((name) => name.endsWith(".json"));
  const rows = await Promise.all(names.map(async (name) => ({ id: name.replace(/\.json$/, ""), data: await readJson<StoredSubscription>(`${folder}/${name}`) })));
  return rows.filter((row): row is { id: string; data: StoredSubscription } => Boolean(row.data?.subscription?.endpoint));
}

/** The user's profile, read with the service role (no session in a scheduled run). */
async function loadUserById(userId: string) {
  if (isDemoMode()) {
    const { readSessionUser } = await import("@/lib/auth/dal");
    return readSessionUser();
  }
  const admin = createSupabaseAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  if (!data?.user) return null;
  return loadAppUser(admin, { sub: userId, email: data.user.email, app_metadata: data.user.app_metadata } as never);
}

/** Runs the feed for each of this user's subscribed browsers and pushes what's new. Never throws. */
export async function pushFeedFor(userId: string): Promise<number> {
  let sent = 0;
  try {
    const subs = await subscriptionsOf(userId);
    if (!subs.length) return 0;
    const user = await loadUserById(userId);
    if (!user || !user.active) return 0;
    const vapid = await vapidKeys();
    for (const { id, data } of subs) {
      const locale = isLocale(data.locale) ? data.locale : routing.defaultLocale;
      const items = await buildFeed(user, { installId: `web-${id}`, sessionId: null, appVersion: null, device: data.device }, locale);
      for (const item of items) {
        try {
          await webpush.sendNotification(
            data.subscription,
            JSON.stringify({ title: item.title, body: item.body, url: `/${locale}${item.path}`, tag: item.id }),
            { vapidDetails: { subject: SUBJECT, publicKey: vapid.publicKey, privateKey: vapid.privateKey }, TTL: 24 * 60 * 60, urgency: "high" },
          );
          sent += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          // 404 / 410: the browser dropped the subscription (app removed, permission revoked).
          if (status === 404 || status === 410) {
            await removeSubscription(userId, data.subscription.endpoint);
            await removeFile(`${ROOT}/devices/${safeId(userId)}/web-${id}.json`);
            break;
          }
          console.error("[push] send failed:", status, (error as Error).message);
        }
      }
    }
  } catch (error) {
    console.error("[push] feed for user failed:", error);
  }
  return sent;
}

/** Every user with at least one subscribed browser (used by the schedule and by settings saves). */
export async function pushFeedForAll(): Promise<{ users: number; sent: number }> {
  const users = await listFolders(PUSH_FOLDER);
  let sent = 0;
  for (const userId of users) sent += await pushFeedFor(userId);
  return { users: users.length, sent };
}

/**
 * Key for the scheduled call (GitHub Actions → POST /api/app/push-tick): derived from the service-role key,
 * so no extra setting is needed on Vercel. The same value is stored as the PUSH_CRON_KEY GitHub secret.
 */
export function cronKey(): string | null {
  if (!isAdminConfigured()) return null;
  return createHmac("sha256", adminEnv().SUPABASE_SERVICE_ROLE_KEY).update("ns-commissions-push-tick").digest("hex");
}

export function isValidCronKey(given: string | null): boolean {
  const expected = cronKey();
  if (!expected || !given || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
