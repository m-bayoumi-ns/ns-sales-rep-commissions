"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const PAGES = [
  { href: "/commissions", key: "commissions", admin: false },
  { href: "/settings", key: "settings", admin: true },
] as const;

/** Links between the site's pages; the current one is marked. Settings is for administrators only. */
export function ReportNav({ admin }: { admin: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} data-report-nav className="flex items-center gap-1" style={{ overflowX: "auto" }}>
      {PAGES.filter((page) => admin || !page.admin).map((page) => {
        const on = pathname.startsWith(page.href);
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={on ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted"
            style={on ? { background: "var(--muted)", color: "var(--foreground)" } : { color: "var(--muted-foreground)" }}
          >
            {t(page.key)}
          </Link>
        );
      })}
    </nav>
  );
}
