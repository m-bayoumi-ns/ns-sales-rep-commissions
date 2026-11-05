import type { Locale } from "@/i18n/routing";

/**
 * Shared number/date formatting — the screen, exports and print all use this module.
 * Western digits (0–9) in both languages: Intl always runs with "en-US" for digits.
 * Currency: the number first in both languages — "8,412,650 EGP" / "8,412,650 ج.م".
 */

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const compactEn = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export const EMPTY = "—";

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  // U+2212 minus sign reads better than a hyphen in tables.
  return integer.format(value).replace("-", "−");
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `${oneDecimal.format(value).replace("-", "−")}%`;
}

export function formatCurrency(value: number | null | undefined, locale: Locale): string {
  const n = formatNumber(value);
  if (n === EMPTY) return n;
  return locale === "ar" ? `${n} ج.م` : `${n} EGP`;
}

/** 8.41M / 8.41 مليون — for KPI heroes; the exact value goes on a second line. */
export function formatCompactCurrency(value: number | null | undefined, locale: Locale): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  if (locale === "ar") {
    const abs = Math.abs(value);
    const sign = value < 0 ? "−" : "";
    if (abs >= 1e6) return `${sign}${oneDecimalOrTwo(abs / 1e6)} مليون ج.م`;
    if (abs >= 1e3) return `${sign}${oneDecimalOrTwo(abs / 1e3)} ألف ج.م`;
    return formatCurrency(value, locale);
  }
  return `${compactEn.format(value).replace("-", "−")} EGP`;
}

function oneDecimalOrTwo(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

/** "Wed 7 Oct 2026, 07:40" / "الأربعاء 7 أكتوبر 2026، 07:40" — Latin digits in Arabic too. */
export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Cairo",
  }).format(date);
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(date);
}

const dateLocale = (locale: Locale) => (locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB");
const utcDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d || 1));
};

/** "October 2026" / "أكتوبر 2026" from "2026-10". */
export function formatMonth(monthKey: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { month: "long", year: "numeric", timeZone: "UTC" }).format(
    utcDate(`${monthKey}-01`),
  );
}

/** "Oct 2026" / "أكتوبر 2026". */
export function formatMonthShort(monthKey: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    month: locale === "ar" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate(`${monthKey}-01`));
}

/** "Tue 6 Oct 2026" from "2026-10-06". */
export function formatDay(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate(iso));
}

/** "1–6 October 2026" (same month) or "28 Sep – 3 Oct 2026". */
export function formatDayRange(from: string, to: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(utcDate(from), utcDate(to));
}

/** "5 Sep" / "5 سبتمبر" — compact date for narrow controls. */
export function formatDayShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" }).format(utcDate(iso));
}

/** A commission rate as typed in the settings: "0.75%", "0.1%", "2%" (up to 3 decimals, no rounding to one). */
export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value)}%`;
}
