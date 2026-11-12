import "server-only";
import { isAdminConfigured, adminEnv } from "@/lib/env";
import { isDemoMode } from "@/lib/dev";
import type { RateChange } from "./changes";
import { readJson, writeJson } from "./storage";

/**
 * Rate-change notifications, kept in Supabase Storage (ns-sales-rep-commissions/notifications.json).
 * Delivery is real time: after saving, the server sends an empty "ping" on the Supabase Realtime channel
 * below; every open page that hears it fetches its own notifications (the ping carries no data, so nothing
 * leaks to other listeners). Pages also check every 30 seconds in case Realtime is unavailable.
 */
const FILE = "ns-sales-rep-commissions/notifications.json";
/** Read markers in their own file, so marking as read never races with a new notification being written. */
const READS = "ns-sales-rep-commissions/notifications-read.json";
export const REALTIME_CHANNEL = "ns-commissions-notify";
const KEEP = 300;

export type Recipients = { mode: "all" } | { mode: "users"; userIds: string[] };

export type CommissionNotification = {
  id: string;
  at: string;
  /** Missing on older stored notifications, which are rate-change alerts. */
  kind?: "message";
  month: string;
  by: string;
  recipients: Recipients;
  changes: RateChange[];
  note: string | null;
};

type Store = { items: CommissionNotification[] };

async function load(): Promise<Store> {
  const data = await readJson<Partial<Store>>(FILE);
  return { items: data?.items ?? [] };
}
async function loadReads(): Promise<Record<string, string>> {
  return (await readJson<Record<string, string>>(READS)) ?? {};
}

export async function addNotification(item: Omit<CommissionNotification, "id" | "at">) {
  const store = await load();
  const entry: CommissionNotification = { ...item, id: crypto.randomUUID(), at: new Date().toISOString() };
  store.items = [entry, ...store.items].slice(0, KEEP);
  await writeJson(FILE, store);
  await ping();
  return entry;
}

const isFor = (item: CommissionNotification, userId: string) => item.recipients.mode === "all" || item.recipients.userIds.includes(userId);

/** A user's notifications (newest first) and how many are unread. */
export async function notificationsFor(userId: string, { everything = false } = {}) {
  const [store, reads] = await Promise.all([load(), loadReads()]);
  const items = everything ? store.items : store.items.filter((item) => isFor(item, userId));
  const lastRead = reads[userId] ?? "";
  return { items: items.slice(0, 30), unread: items.filter((item) => item.at > lastRead).length, lastRead };
}

/** All retained rate-change notifications for the administrator settings page. */
export async function allNotifications(): Promise<CommissionNotification[]> {
  return (await load()).items;
}

/** Removes a rate-change notification from every user's in-app notification list. */
export async function deleteNotification(id: string): Promise<boolean> {
  const store = await load();
  const items = store.items.filter((item) => item.id !== id);
  if (items.length === store.items.length) return false;
  await writeJson(FILE, { items });
  await ping();
  return true;
}

export async function markRead(userId: string) {
  const reads = await loadReads();
  reads[userId] = new Date().toISOString();
  await writeJson(READS, reads);
}

/** Empty broadcast on the Realtime channel: "something new — fetch yours". Never throws. */
export async function ping() {
  if (isDemoMode() || !isAdminConfigured()) return;
  try {
    const env = adminEnv();
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ messages: [{ topic: REALTIME_CHANNEL, event: "ping", payload: {} }] }),
    });
    if (!response.ok) console.error("[notify] realtime broadcast failed:", response.status, await response.text());
  } catch (error) {
    console.error("[notify] realtime broadcast failed:", error);
  }
}
