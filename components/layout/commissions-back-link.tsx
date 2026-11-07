"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { BrandLogo } from "./brand-logo";

export function HeaderBrand({ label }: { label: string }) {
  const pathname = usePathname();
  const t = useTranslations("header");

  if (pathname === "/commissions") {
    return (
      <Link href="/commissions" className="flex shrink-0 items-center gap-3 rounded-md">
        <BrandLogo label={label} />
      </Link>
    );
  }

  return (
    <Link
      href="/commissions"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <ArrowLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
      <span>{t("backToCommissions")}</span>
    </Link>
  );
}
