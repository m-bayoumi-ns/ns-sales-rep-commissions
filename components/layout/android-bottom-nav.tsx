"use client";

import Image from "next/image";
import { FileTextIcon, HandCoinsIcon, ShoppingCartIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type AppSection = "summary" | "sales" | "collections" | "statement";
type NavigationSection = AppSection | "account";

export function AndroidBottomNav({ active, onSelect }: { active: NavigationSection; onSelect?: (section: AppSection) => void }) {
  const t = useTranslations("app2.tab");
  const sectionLink = (section: AppSection) => ({ pathname: "/commissions" as const, query: { section } });
  const itemClass = (selected: boolean) =>
    cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium leading-none transition-colors", selected ? "text-primary" : "text-muted-foreground hover:text-foreground");

  const sectionItem = (section: AppSection, Icon: typeof ShoppingCartIcon) => {
    const selected = active === section;
    return onSelect ? (
      <button key={section} type="button" aria-current={selected ? "page" : undefined} onClick={() => onSelect(section)} className={itemClass(selected)}>
        <Icon aria-hidden className="size-5" />
        <span className="truncate">{t(section)}</span>
      </button>
    ) : (
      <Link key={section} href={sectionLink(section)} aria-current={selected ? "page" : undefined} className={itemClass(selected)}>
        <Icon aria-hidden className="size-5" />
        <span className="truncate">{t(section)}</span>
      </Link>
    );
  };

  return (
    <nav aria-label={t("navigation")} dir="rtl" className="android-bottom-nav app-only fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgb(0_0_0/0.08)] backdrop-blur">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch px-2">
        {sectionItem("sales", ShoppingCartIcon)}
        <Link href="/account" aria-current={active === "account" ? "page" : undefined} className={itemClass(active === "account")}>
          <UserRoundIcon aria-hidden className="size-5" />
          <span className="truncate">{t("account")}</span>
        </Link>
        <div className="relative flex min-w-0 flex-col items-center justify-end pb-1">
          <span aria-hidden className="absolute -top-4 left-1/2 size-[4.5rem] -translate-x-1/2 rounded-t-full border-x border-t bg-card" />
          {onSelect ? (
            <button type="button" aria-label={t("summary")} aria-current={active === "summary" ? "page" : undefined} onClick={() => onSelect("summary")} className="absolute -top-7 z-10 flex size-14 items-center justify-center rounded-full border-4 border-background bg-card shadow-md">
              <Image src="/logos/ns-mark.png" alt="" width={36} height={36} className="size-9 rounded-lg object-cover" />
            </button>
          ) : (
            <Link href={sectionLink("summary")} aria-label={t("summary")} aria-current={active === "summary" ? "page" : undefined} className="absolute -top-7 z-10 flex size-14 items-center justify-center rounded-full border-4 border-background bg-card shadow-md">
              <Image src="/logos/ns-mark.png" alt="" width={36} height={36} className="size-9 rounded-lg object-cover" />
            </Link>
          )}
          <span className={cn("text-[10px] font-medium leading-none", active === "summary" ? "text-primary" : "text-muted-foreground")}>{t("summary")}</span>
        </div>
        {sectionItem("collections", HandCoinsIcon)}
        {sectionItem("statement", FileTextIcon)}
      </div>
    </nav>
  );
}
