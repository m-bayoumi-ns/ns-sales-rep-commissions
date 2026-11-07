"use client";

import { LanguagesIcon, MoonIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Visual on/off switch (the row itself is the control). */
function SwitchMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("relative ms-auto inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", on ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-4.5 rtl:-translate-x-4.5" : "translate-x-0.5 rtl:-translate-x-0.5",
        )}
      />
    </span>
  );
}

/**
 * In the Android app and on small screens, language and theme settings live in the account menu as switches.
 */
export function AppPreferenceItems() {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  const arabic = locale === "ar";

  return (
    <div className="app-only mobile-menu-preferences">
      <DropdownMenuGroup>
        <DropdownMenuItem
          closeOnClick={false}
          role="menuitemcheckbox"
          aria-checked={dark}
          onClick={() => setTheme(dark ? "light" : "dark")}
          className="py-2"
        >
          <MoonIcon aria-hidden />
          {t("darkMode")}
          <SwitchMark on={dark} />
        </DropdownMenuItem>
        <DropdownMenuItem
          role="menuitemcheckbox"
          aria-checked={arabic}
          onClick={() => router.replace(`${pathname}${window.location.search}`, { locale: arabic ? "en" : "ar" })}
          className="py-2"
        >
          <LanguagesIcon aria-hidden />
          <span lang="ar">{t("arabic")}</span>
          <SwitchMark on={arabic} />
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
    </div>
  );
}
