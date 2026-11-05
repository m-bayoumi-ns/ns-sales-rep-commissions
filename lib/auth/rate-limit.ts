import "server-only";

/**
 * Sign-in throttling: after 5 failed attempts within 10 minutes, sign-in pauses for
 * 10 minutes — per email and per IP address. In-memory, which is correct for the
 * single-container deployment; move it to Postgres/Redis if the app ever runs on
 * several instances. Supabase Auth applies its own rate limits on top of this.
 */
const MAX_FAILURES = 5;
const WINDOW_MS = 10 * 60 * 1000;

const failures = new Map<string, number[]>();

function recent(key: string, now: number) {
  const list = (failures.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export function isLocked(keys: string[], now = Date.now()) {
  return keys.some((key) => recent(key, now).length >= MAX_FAILURES);
}

export function recordFailure(keys: string[], now = Date.now()) {
  for (const key of keys) failures.set(key, [...recent(key, now), now]);
}

export function clearFailures(keys: string[]) {
  for (const key of keys) failures.delete(key);
}
