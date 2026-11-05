/** Calendar helpers on plain "YYYY-MM-DD" strings (no time zones involved). */

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function monthKey(year: number, month: number) {
  return `${year}-${pad2(month)}`;
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function addDays(value: string, days: number) {
  const { year, month, day } = parseIsoDate(value);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Whole days from `from` to `to` (to − from). */
export function diffDays(from: string, to: string) {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) out.push(day);
  return out;
}

/** The current date and hour in Cairo — the business day the old app used. */
export function cairoNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

export type BusinessNow = ReturnType<typeof cairoNow>;
