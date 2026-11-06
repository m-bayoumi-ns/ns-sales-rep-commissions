"use client";

import { BellIcon, BellRingIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { RateChange } from "@/lib/commissions/changes";
import type { CommissionNotification } from "@/lib/commissions/notifications";
import { getMyNotifications, markNotificationsRead } from "@/lib/commissions/notify-actions";
import { formatDateTime, formatMonth } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CHANNEL = "ns-commissions-notify";
const POLL_MS = 30_000;

/**
 * Bell in the header: rate-change notifications, live. Listens on the Supabase Realtime channel
 * (an empty ping after every save) and also re-checks every 30 s. New arrivals pop up as a toast
 * and refresh the page so the new rates show at once.
 */
export function NotificationBell() {
  const t = useTranslations("notify");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [items, setItems] = useState<CommissionNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [lastRead, setLastRead] = useState("");
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const data = await getMyNotifications();
    setItems(data.items);
    setUnread(data.unread);
    setLastRead(data.lastRead);
    const fresh = seen.current ? data.items.filter((item) => !seen.current!.has(item.id) && item.at > data.lastRead) : [];
    seen.current = new Set(data.items.map((item) => item.id));
    if (fresh.length) {
      for (const item of fresh.slice(0, 3)) toast(t("toastTitle", { month: formatMonth(item.month, locale) }), { description: item.note ?? t("toastBody", { count: item.changes.length }), icon: <BellRingIcon className="size-4" /> });
      router.refresh();
    }
  }, [locale, router, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => document.visibilityState === "visible" && void load(), POLL_MS);
    let unsubscribe = () => {};
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase.channel(CHANNEL).on("broadcast", { event: "ping" }, () => void load()).subscribe();
      unsubscribe = () => void supabase.removeChannel(channel);
    } catch (error) {
      console.warn("[notify] realtime unavailable, polling only:", error);
    }
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && unread) {
          setUnread(0);
          void markNotificationsRead();
        }
      }}
    >
      <PopoverTrigger
        aria-label={unread ? t("labelUnread", { count: unread }) : t("label")}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {unread ? <BellRingIcon aria-hidden className="size-5 text-primary" /> : <BellIcon aria-hidden className="size-5" />}
        {unread ? (
          <span className="absolute -end-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white tabular-nums">{unread > 9 ? "9+" : unread}</span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        {items.length ? (
          <ul className="max-h-[60vh] divide-y overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className={cn("flex flex-col gap-1.5 px-4 py-3", item.at > lastRead && "bg-accent/50")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{t("itemTitle", { month: formatMonth(item.month, locale) })}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(new Date(item.at), locale)}</span>
                </div>
                {item.note ? <p className="text-sm">{item.note}</p> : null}
                {item.changes.length ? (
                  <ul className="flex flex-col gap-1">
                    {item.changes.slice(0, 8).map((change, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        <ChangeText change={change} />
                      </li>
                    ))}
                    {item.changes.length > 8 ? <li className="text-xs text-muted-foreground">{t("more", { count: item.changes.length - 8 })}</li> : null}
                  </ul>
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  {t("by", { name: item.by })}
                  {item.recipients.mode === "users" ? ` · ${t("toSome", { count: item.recipients.userIds.length })}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ChangeText({ change }: { change: RateChange }) {
  const t = useTranslations("notify.change");
  const arrow = (from: string | number, to: string | number) => (
    <span dir="ltr" className="font-medium text-foreground tabular-nums">
      {from} → {to}
    </span>
  );
  switch (change.kind) {
    case "tier":
      return <>{t("tier", { key: change.key })}: {arrow(change.from, change.to)}</>;
    case "categoryRate":
      return <>{t(`category.${change.key}`)}: {arrow(`${change.from}%`, `${change.to}%`)}</>;
    case "productAdded":
      return <>{t("added", { category: t(`category.${change.category}`) })}: <bdi className="text-foreground">{change.name}</bdi></>;
    case "productRemoved":
      return <>{t("removed", { category: t(`category.${change.category}`) })}: <bdi className="text-foreground">{change.name}</bdi></>;
    case "productMoved":
      return <><bdi className="text-foreground">{change.name}</bdi>: {t(`category.${change.from}`)} → {t(`category.${change.to}`)}</>;
    case "rule":
      return <>{t(`rule.${change.key}`)}: {arrow(change.from, change.to)}</>;
    case "ladder":
      return <>{t("ladder")}: {arrow(change.from, change.to)}</>;
  }
}
