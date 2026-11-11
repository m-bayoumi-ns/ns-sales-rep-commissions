"use client";

import { BellRingIcon, KeyRoundIcon, LanguagesIcon, Loader2Icon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth/actions";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { PasswordForm } from "./password-form";
import { TestNotificationButton } from "@/components/layout/test-notification-button";

export function AccountControls({
  mustChangePassword = false,
  hasDevices = true,
  notificationsWorking = true,
}: {
  mustChangePassword?: boolean;
  hasDevices?: boolean;
  notificationsWorking?: boolean;
}) {
  const t = useTranslations("account");
  const th = useTranslations("header");
  const tp = useTranslations("phoneNotify");
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

      {/* 1. تغيير كلمة المرور */}
      <details className="rounded-xl border px-3 py-2.5" open={mustChangePassword}>
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <KeyRoundIcon aria-hidden className="size-4 text-primary" />
          {t("changePassword")}
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <PasswordForm />
        </div>
      </details>

      {/* 2. تغيير الوضع / المظهر */}
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

      {/* 3. تغيير اللغة */}
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

      {/* 4. إشعارات الهاتف */}
      <details className="rounded-xl border px-3 py-2.5">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <BellRingIcon aria-hidden className="size-4 text-primary" />
          {tp("title")}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <p className={cn("flex items-center gap-2 text-sm font-semibold", notificationsWorking ? "text-success" : "text-warning")}>
            <BellRingIcon aria-hidden className="size-4" />
            {notificationsWorking ? tp("deliveryWorking") : tp("deliveryNotWorking")}
          </p>
          <TestNotificationButton disabled={!hasDevices} />
        </div>
      </details>

      <Button type="button" variant="ghost" disabled={pending} onClick={() => startTransition(() => signOut(locale))} className="mt-1 h-14 w-full justify-center gap-2 rounded-xl bg-destructive-soft text-base font-semibold text-destructive hover:bg-destructive-soft/80">
        {pending ? <Loader2Icon aria-hidden className="size-5 animate-spin" /> : <LogOutIcon aria-hidden className="size-5 rtl:-scale-x-100" />}
        {t("signOut")}
      </Button>
    </section>
  );
}
