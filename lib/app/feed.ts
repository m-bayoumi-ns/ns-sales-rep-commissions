import "server-only";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { isSeller } from "@/lib/auth/permissions";
import type { AppUser } from "@/lib/auth/types";
import type { Adjustment, RepResult } from "@/lib/commissions/engine";
import { notificationsFor } from "@/lib/commissions/notifications";
import { readJson, writeJson } from "@/lib/commissions/storage";
import { getCommissionsView, resolveMonth } from "@/lib/commissions/view";
import { deviceFile, lastTestRequest } from "./devices";
import { loginsFor } from "./logins";

/**
 * What the Android WebView app shows as phone notifications. It calls GET /api/app/feed every ~15 minutes
 * (and when it opens). Per device we keep a small state file with what that device was last told:
 *   - the newest sign-in and rate notification it has seen,
 *   - a snapshot of the seller's commission (total, system, every bonus/deduction).
 * Anything newer, or any difference from the snapshot, becomes an item. The first call only records the
 * baseline, so a fresh install is not flooded with old news.
 */
export type FeedItem = {
  id: string;
  channel: "security" | "commission";
  title: string;
  body: string;
  /** Path inside the site to open when the notification is tapped. */
  path: string;
};

export type Snapshot = {
  month: string;
  total: number;
  regime: RepResult["regime"];
  achievement: number | null;
  adjustments: Record<string, { met: boolean; applies: boolean; amount: number }>;
};

type DeviceState = {
  seenLoginsAt: string;
  seenRatesAt: string;
  seenTestAt?: string;
  snapshot: Snapshot | null;
  /** Shown on My account: when this phone last reached the server, which app version, how many items it got. */
  lastSeenAt?: string;
  appVersion?: string | null;
  device?: string | null;
  lastItems?: number;
};

export type FeedClient = { installId: string; sessionId: string | null; appVersion: string | null; device: string | null };

const egp = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(Math.round(value));

function snapshotOf(month: string, result: RepResult): Snapshot {
  return {
    month,
    total: Math.round(result.total),
    regime: result.regime,
    achievement: result.achievement == null ? null : Math.round(result.achievement * 10) / 10,
    adjustments: Object.fromEntries(
      result.adjustments.map((adj: Adjustment) => [adj.key, { met: adj.met, applies: adj.applies, amount: Math.round(adj.amount) }]),
    ),
  };
}

export async function buildFeed(user: AppUser, client: FeedClient, locale: Locale): Promise<FeedItem[]> {
  const { installId, sessionId } = client;
  const t = await getTranslations({ locale, namespace: "appFeed" });
  const file = deviceFile(user.id, installId);
  const stored = await readJson<DeviceState>(file);
  const now = new Date().toISOString();
  const items: FeedItem[] = [];

  // 0. First check on this phone: one notification confirming they work (and showing how they look).
  if (!stored) {
    items.push({ id: `welcome-${installId}`, channel: "commission", title: t("welcome.title"), body: t("welcome.body"), path: "/commissions" });
  }

  // Test requested from My account ("send a test notification to my phone").
  const testAt = await lastTestRequest(user.id);
  const testIsNew = testAt != null && testAt > (stored?.seenTestAt ?? "") && Date.now() - Date.parse(testAt) < 60 * 60 * 1000;
  if (testIsNew) {
    items.push({ id: `test-${testAt}`, channel: "commission", title: t("test.title"), body: t("test.body"), path: "/account" });
  }

  // 1. Sign-ins from other sessions.
  const logins = await loginsFor(user.id);
  if (stored) {
    for (const login of logins) {
      if (login.at <= stored.seenLoginsAt) continue;
      if (sessionId && login.sessionId === sessionId) continue;
      const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Cairo",
      }).format(new Date(login.at));
      items.push({ id: `login-${login.at}`, channel: "security", title: t("login.title"), body: t("login.body", { device: login.device, time }), path: "/account" });
    }
  }

  // 2. Commission rate changes published from Settings.
  const rates = await notificationsFor(user.id);
  if (stored) {
    for (const item of rates.items) {
      if (item.at <= stored.seenRatesAt) continue;
      items.push({
        id: `rates-${item.id}`,
        channel: "commission",
        title: t("rates.title"),
        body: item.note?.trim() || t("rates.body", { count: item.changes.length }),
        path: "/commissions",
      });
    }
  }

  // 3. The seller's own commission: total, system and every bonus / deduction.
  let snapshot: Snapshot | null = stored?.snapshot ?? null;
  if (isSeller(user)) {
    const month = resolveMonth(undefined);
    try {
      const view = await getCommissionsView(user, month, undefined);
      const rep = view.detail?.rep ?? view.reps[0];
      if (rep?.odooUserId != null) {
        const next = snapshotOf(month, rep.result);
        const before = stored?.snapshot;
        if (stored && before && before.month === month) items.push(...commissionChanges(before, next, t, locale));
        snapshot = next;
      }
    } catch (error) {
      // Odoo or storage hiccup: keep the old snapshot and try again on the next call.
      console.error("[app feed] commission check failed:", error);
    }
  }

  const newestLogin = logins[0]?.at ?? "";
  const newestRate = rates.items[0]?.at ?? "";
  await writeJson(file, {
    seenLoginsAt: [stored?.seenLoginsAt ?? "", newestLogin, stored ? "" : now].sort().at(-1) ?? now,
    seenRatesAt: [stored?.seenRatesAt ?? "", newestRate, stored ? "" : now].sort().at(-1) ?? now,
    seenTestAt: testIsNew ? testAt : (stored?.seenTestAt ?? ""),
    snapshot,
    lastSeenAt: now,
    appVersion: client.appVersion,
    device: client.device,
    lastItems: items.length,
  } satisfies DeviceState);

  return items;
}

type T = Awaited<ReturnType<typeof getTranslations<"appFeed">>>;

export function commissionChanges(before: Snapshot, after: Snapshot, t: T, locale: Locale): FeedItem[] {
  const out: FeedItem[] = [];
  const diff = after.total - before.total;
  if (Math.abs(diff) >= 1) {
    out.push({
      id: `total-${after.month}-${after.total}`,
      channel: "commission",
      title: diff > 0 ? t("total.upTitle") : t("total.downTitle"),
      body: t(diff > 0 ? "total.upBody" : "total.downBody", { change: egp(Math.abs(diff), locale), total: egp(after.total, locale) }),
      path: "/commissions",
    });
  }
  if (after.regime !== before.regime) {
    out.push({
      id: `regime-${after.month}-${after.regime}`,
      channel: "commission",
      title: t("regime.title"),
      body: t("regime.body", { regime: t(`regimes.${after.regime}`), achievement: after.achievement == null ? "—" : String(after.achievement) }),
      path: "/commissions",
    });
  }
  for (const [key, now] of Object.entries(after.adjustments)) {
    const was = before.adjustments[key];
    if (!t.has(`adjustments.${key}`)) continue;
    const name = t(`adjustments.${key}`);
    const counts = now.met && now.applies;
    const counted = Boolean(was?.met && was?.applies);
    if (counts && !counted) {
      out.push({
        id: `adj-${after.month}-${key}-on`,
        channel: "commission",
        title: now.amount < 0 ? t("adjustment.deductionTitle") : t("adjustment.earnedTitle"),
        body: t("adjustment.onBody", { name, amount: egp(Math.abs(now.amount), locale) }),
        path: "/commissions",
      });
    } else if (!counts && counted) {
      out.push({
        id: `adj-${after.month}-${key}-off`,
        channel: "commission",
        title: (was?.amount ?? 0) < 0 ? t("adjustment.deductionGoneTitle") : t("adjustment.lostTitle"),
        body: t("adjustment.offBody", { name }),
        path: "/commissions",
      });
    } else if (counts && was && Math.abs(now.amount - was.amount) >= 1) {
      out.push({
        id: `adj-${after.month}-${key}-${now.amount}`,
        channel: "commission",
        title: t("adjustment.changedTitle"),
        body: t("adjustment.changedBody", { name, from: egp(was.amount, locale), to: egp(now.amount, locale) }),
        path: "/commissions",
      });
    }
  }
  return out;
}
