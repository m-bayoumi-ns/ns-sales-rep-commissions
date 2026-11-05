/** Shared helpers of the financial reports: months, the per-instance cache, branch matching. */
import { cairoNow, diffDays } from "@/lib/metrics/dates";

// ---------------------------------------------------------------- months ("YYYY-MM")
export function nextMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
}

export function prevMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): string[] {
  const [a, b] = from <= to ? [from, to] : [to, from];
  const out: string[] = [];
  for (let month = a; month <= b; month = nextMonth(month)) out.push(month);
  return out;
}

export function addMonths(month: string, count: number): string {
  let out = month;
  for (let i = 0; i < Math.abs(count); i++) out = count > 0 ? nextMonth(out) : prevMonth(out);
  return out;
}

/** First and last calendar day of a month: ["2026-09-01", "2026-09-30"]. */
export function monthBounds(month: string): [string, string] {
  const [year, mon] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(last).padStart(2, "0")}`];
}

/** ISO day + n days. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Today in Cairo, "YYYY-MM-DD" — the business day every "as of" figure uses. */
export function today(): string {
  return cairoNow().date;
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return diffDays(from, to);
}

// ---------------------------------------------------------------- small TTL cache (per server instance)
type Entry = { at: number; ttl: number; stale: number; value: Promise<unknown>; settled: unknown; refreshing: boolean };
const store = new Map<string, Entry>();

/**
 * Memoizes an Odoo read for `ttlMs`. Concurrent callers share one in-flight request; a failed
 * read is forgotten so the next request retries. Keys must include every input of `load`.
 *
 * `staleMs` (stale-while-revalidate): after the TTL, the last good value is still served for up to
 * `staleMs` while a fresh read runs in the background — so a slow read (the receivables snapshot)
 * only makes the very first visitor wait.
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>, options: { staleMs?: number } = {}): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && now - hit.at < hit.ttl) return hit.value as Promise<T>;
  if (hit && hit.settled !== undefined && now - hit.at < hit.ttl + hit.stale) {
    if (!hit.refreshing) {
      hit.refreshing = true;
      load()
        .then((value) => store.set(key, { at: Date.now(), ttl: ttlMs, stale: options.staleMs ?? 0, value: Promise.resolve(value), settled: value, refreshing: false }))
        .catch((error) => {
          hit.refreshing = false;
          console.error(`[cache] background refresh of ${key} failed:`, error);
        });
    }
    return Promise.resolve(hit.settled as T);
  }
  const entry: Entry = { at: now, ttl: ttlMs, stale: options.staleMs ?? 0, value: Promise.resolve(), settled: undefined, refreshing: false };
  entry.value = load().then(
    (value) => {
      entry.settled = value;
      return value;
    },
    (error) => {
      if (store.get(key) === entry) store.delete(key);
      throw error;
    },
  );
  store.set(key, entry);
  if (store.size > 500) {
    for (const [name, item] of store) if (now - item.at > item.ttl + item.stale) store.delete(name);
  }
  return entry.value as Promise<T>;
}

export const MINUTE = 60_000;

/** The current month changes all day; closed months only change with late postings. */
export function monthTtl(month: string): number {
  return month >= currentMonth() ? 5 * MINUTE : 60 * MINUTE;
}

// ---------------------------------------------------------------- branches
/** Loose branch-name match ("فرع فيصل" = "فيصل", "Branch Nasr City" = "nasr city") — same rule as Order Stages. */
export function normalizeBranch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/^\s*(فرع|branch)\s*/u, "")
    .replace(/[\s\-_/()]+/g, "");
}

// ---------------------------------------------------------------- numbers
export const round2 = (value: number) => Math.round(value * 100) / 100;
export const sumBy = <T,>(items: T[], value: (item: T) => number) => items.reduce((total, item) => total + value(item), 0);
export const share = (part: number, whole: number) => (whole ? (100 * part) / whole : null);
