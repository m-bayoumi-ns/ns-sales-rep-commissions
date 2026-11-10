"use client";

import { CalendarDaysIcon, RadioIcon, RefreshCwIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { NotificationBell } from "@/components/layout/notification-bell";
import type { Locale } from "@/i18n/routing";
import { formatMonth } from "@/lib/format";

const REFRESH_MS = 5 * 60_000;

/**
 * Month choice (kept in the URL) and, for the open month, a live indicator that re-reads the figures every
 * five minutes while the page is visible, so each rep sees their progress move through the day.
 */
export function MonthBar({ months, month, live, keepRep, showStatus = true, showAppNotifications = false }: { months: string[]; month: string; live: boolean; keepRep?: string; showStatus?: boolean; showAppNotifications?: boolean }) {
  const t = useTranslations("cm.month");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const refresh = () => startTransition(() => {
    router.refresh();
    setLastRefresh(Date.now());
  });

  useEffect(() => {
    if (!live) return;
    const tick = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible" && Date.now() - lastRefresh >= REFRESH_MS) refresh();
    }, 15_000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, lastRefresh]);

  const minutes = Math.max(0, Math.round((now - lastRefresh) / 60_000));

  return (
    <div data-no-print className={showAppNotifications ? "flex w-full flex-wrap items-center justify-between gap-2" : "flex flex-wrap items-center gap-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex items-center">
          <span className="sr-only">{t("label")}</span>
          <CalendarDaysIcon aria-hidden className="pointer-events-none absolute start-2.5 size-4 text-muted-foreground" />
          <select
            value={month}
            disabled={pending}
            onChange={(event) =>
              startTransition(() => router.push({ pathname, query: { month: event.target.value, ...(keepRep ? { rep: keepRep } : {}) } }))
            }
            className="h-9 rounded-lg border border-input bg-card ps-8 pe-3 text-sm font-medium shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {months.map((item) => (
              <option key={item} value={item}>
                {formatMonth(item, locale)}
              </option>
            ))}
          </select>
        </label>
        {live && showStatus ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-xs text-muted-foreground">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            <RadioIcon aria-hidden className="size-3.5" />
            {t("live", { minutes })}
            <button
              type="button"
              onClick={refresh}
              disabled={pending}
              aria-label={t("refresh")}
              title={t("refresh")}
              className="ms-1 rounded p-0.5 text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCwIcon aria-hidden className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
            </button>
          </span>
        ) : showStatus ? (
          <span className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-xs text-muted-foreground">{t("closed")}</span>
        ) : null}
      </div>
      {showAppNotifications ? (
        <div className="app-only app-home-notification ms-auto">
          <NotificationBell appHome />
        </div>
      ) : null}
    </div>
  );
}
