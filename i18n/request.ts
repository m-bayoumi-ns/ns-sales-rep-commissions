import { locale as rootLocale } from "next/root-params";
import { getRequestConfig } from "next-intl/server";
import { isLocale, routing } from "./routing";

export default getRequestConfig(async ({ locale: override }) => {
  const segment = override ?? (await rootLocale());
  const locale = isLocale(segment) ? segment : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Africa/Cairo",
  };
});
