"use client";

import { LogOutIcon, Loader2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function AccountControls() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">{t("preferences")}</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{t("appearance")}</span>
        <ThemeToggle />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{t("language")}</span>
        <LanguageSwitcher />
      </div>
      <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(() => signOut(locale))} className="w-full justify-start">
        {pending ? <Loader2Icon aria-hidden className="animate-spin" /> : <LogOutIcon aria-hidden className="rtl:-scale-x-100" />}
        {t("signOut")}
      </Button>
    </section>
  );
}
