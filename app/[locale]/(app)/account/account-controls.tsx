"use client";

import { LogOutIcon, Loader2Icon, LanguagesIcon, MoonIcon, SunIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth/actions";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function AccountControls() {
  const t = useTranslations("account");
  const th = useTranslations("header");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  const changeLocale = (next: Locale) => router.replace(`${pathname}${window.location.search}`, { locale: next });
  const choiceClass = (selected: boolean) =>
    cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium", selected ? "border-primary bg-accent text-primary" : "bg-card text-muted-foreground");

  return (
    <section className="app-only flex flex-col gap-3 rounded-3xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">{t("preferences")}</h2>
      <details className="rounded-xl border px-3 py-2.5">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <SunIcon aria-hidden className="size-4 text-primary" />
          {t("changeAppearance")}
        </summary>
        <div className="mt-3 flex gap-2">
          <button type="button" aria-pressed={resolvedTheme === "light"} onClick={() => setTheme("light")} className={choiceClass(resolvedTheme === "light")}>
            <SunIcon aria-hidden className="size-4" />
            {th("themeLight")}
          </button>
          <button type="button" aria-pressed={resolvedTheme === "dark"} onClick={() => setTheme("dark")} className={choiceClass(resolvedTheme === "dark")}>
            <MoonIcon aria-hidden className="size-4" />
            {th("themeDark")}
          </button>
        </div>
      </details>
      <details className="rounded-xl border px-3 py-2.5">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <LanguagesIcon aria-hidden className="size-4 text-primary" />
          {t("changeLanguage")}
        </summary>
        <div className="mt-3 flex gap-2">
          <button type="button" lang="ar" aria-pressed={locale === "ar"} onClick={() => changeLocale("ar")} className={choiceClass(locale === "ar")}>العربية</button>
          <button type="button" lang="en" aria-pressed={locale === "en"} onClick={() => changeLocale("en")} className={choiceClass(locale === "en")}>English</button>
        </div>
      </details>
      <Button type="button" variant="destructive" disabled={pending} onClick={() => startTransition(() => signOut(locale))} className="w-full justify-start bg-destructive text-white hover:bg-destructive/90">
        {pending ? <Loader2Icon aria-hidden className="animate-spin" /> : <LogOutIcon aria-hidden className="rtl:-scale-x-100" />}
        {t("signOut")}
      </Button>
    </section>
  );
}
