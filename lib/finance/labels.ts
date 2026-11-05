/** Display helpers usable on the server and in the browser. */
import type { Locale } from "@/i18n/routing";

/** Odoo company names are Arabic; English gets the short business name. */
export function companyLabel(name: string, locale: Locale): string {
  if (locale === "ar") return name;
  if (/تجزئة|retail/i.test(name)) return "Naguib Selim Retail";
  if (/جملة|wholesale/i.test(name)) return "Naguib Selim Wholesale";
  if (/تصنيع|manufactur/i.test(name)) return "Naguib Selim Manufacturing";
  if (/القابضة|holding/i.test(name)) return "Naguib Selim Holding";
  return name;
}

/** Short form for chips and table cells. */
export function companyShort(name: string, locale: Locale): string {
  if (/تجزئة|retail/i.test(name)) return locale === "ar" ? "التجزئة" : "Retail";
  if (/جملة|wholesale/i.test(name)) return locale === "ar" ? "الجملة" : "Wholesale";
  return companyLabel(name, locale);
}

/** Customer-type names from Odoo, translated where they are Arabic business terms. */
const TYPE_EN: Record<string, string> = {
  "جملة": "Wholesale",
  "تجاري": "Commercial",
  "تجاري جديد": "New commercial",
  "استهلاكي": "B2C",
  "شركة شقيقة": "Sister company",
  B2B: "B2B",
  "تصنيع": "Manufacturing",
  "هيئات حكومية": "Government bodies",
  "مكتب تشطيبات وديكور": "Finishing & décor offices",
  "مكاتب مقاولات": "Contracting offices",
};
const TYPE_AR: Record<string, string> = {
  B2B: "تجاري",
  Vendors: "موردون",
  Employees: "موظفون",
  "Service Provider": "مقدمو خدمات",
  "Important commercial": "تجاري مهم",
  Normal: "عادي",
  VIP: "VIP",
};

/** Salesperson names in Odoo carry an employee code ("NSR1653_ابراهيم حسنى"): show the name only. */
export function repLabel(name: string | null | undefined, none: string): string {
  if (!name) return none;
  return name.replace(/^[A-Z]{2,5}\d+[_\s-]+/, "").trim() || name;
}

export function customerTypeLabel(name: string | null | undefined, locale: Locale, unclassified: string): string {
  if (!name) return unclassified;
  const trimmed = name.trim();
  return (locale === "ar" ? TYPE_AR[trimmed] : TYPE_EN[trimmed]) ?? trimmed;
}

/**
 * "Oct 2026", "May 2026 – Oct 2026", or when the period stops on a chosen day "1–27 Oct 2026" /
 * "1 May – 27 Oct 2026". Takes the page's filter options (months + optional last day) or a month list.
 */
export function periodLabel(input: string[] | { months: string[]; endDay: string | null }, locale: Locale) {
  const dateLocale = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  const months = Array.isArray(input) ? input : input.months;
  if (!Array.isArray(input) && input.endDay) {
    return new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).formatRange(
      new Date(`${months[0]}-01T00:00:00Z`),
      new Date(`${input.endDay}T00:00:00Z`),
    );
  }
  const short = (month: string) =>
    new Intl.DateTimeFormat(dateLocale, { month: locale === "ar" ? "long" : "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  return months.length === 1 ? short(months[0]) : `${short(months[0])} – ${short(months[months.length - 1])}`;
}

/** "27 Oct 2026" / "27 أكتوبر 2026". */
export function dayLabel(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}
