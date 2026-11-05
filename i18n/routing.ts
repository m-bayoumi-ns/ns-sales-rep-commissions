import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  // Remember the user's last language choice.
  localeCookie: { name: "NS_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return routing.locales.includes(value as Locale);
}

export function directionOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
