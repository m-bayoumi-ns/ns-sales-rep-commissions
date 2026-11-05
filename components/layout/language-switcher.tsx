"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Toggles the locale route and keeps the current page and filters (search params). */
export function LanguageSwitcher() {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      variant="ghost"
      lang={next}
      className="px-2.5 sm:px-3"
      aria-label={t("switchLanguageLabel")}
      onClick={() => router.replace(`${pathname}${window.location.search}`, { locale: next })}
    >
      <GlobeIcon aria-hidden className="hidden sm:block" />
      <span className="hidden sm:inline">{t("switchLanguage")}</span>
      <span aria-hidden className="font-semibold sm:hidden">
        {t("switchLanguageShort")}
      </span>
    </Button>
  );
}
