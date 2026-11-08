import { ChevronRightIcon, FlagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CommissionsView } from "@/lib/commissions/view";
import { normalizeName } from "@/lib/commissions/names";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RepsExport } from "./reps-export";

/** Team summary (managers): one plain list row per seller, opening the seller's screen. */
export function TeamList({ view, locale, canExport, displayNames = {} }: { view: CommissionsView; locale: Locale; canExport: boolean; displayNames?: Record<string, string> }) {
  const t = useTranslations("app2");
  const { totals, clock } = view;
  const target = clock.closed ? totals.target : totals.targetToDate;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs text-muted-foreground">{t("teamTotal")}</p>
          <p dir="ltr" className="text-start text-2xl font-extrabold tabular-nums">
            {formatNumber(totals.commission)} <span className="text-sm font-semibold text-muted-foreground">{locale === "ar" ? "ج.م" : "EGP"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t(clock.closed ? "teamSales" : "teamSalesToDate", { sales: formatCompactCurrency(totals.sales, locale), target: target ? formatCompactCurrency(target, locale) : "—" })}
          </p>
        </div>
        {canExport ? <RepsExport reps={view.reps} month={clock.month} /> : null}
      </div>
      <ul className="divide-y overflow-hidden rounded-3xl border bg-card shadow-sm">
        {view.reps.map((rep) => {
          const r = rep.result;
          const flagged = r.belowMinimum || rep.minimumRisk;
          const pct = r.achievement;
          const displayName = displayNames[normalizeName(rep.name)] ?? rep.name;
          return (
            <li key={rep.key}>
              <Link href={{ pathname: "/commissions", query: { month: clock.month, rep: rep.key } }} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">
                  {displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-center gap-2">
                    <bdi className="truncate text-sm font-semibold">{displayName}</bdi>
                    {flagged ? <FlagIcon aria-label={t("flagged")} className="size-3.5 shrink-0 text-destructive" /> : null}
                    {rep.odooUserId == null ? <span className="text-[11px] text-destructive">{t("notLinked")}</span> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" dir="ltr">
                      <span
                        className={cn("block h-full rounded-full", pct == null ? "" : pct >= 100 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-destructive")}
                        style={{ width: `${Math.min(100, Math.max(0, pct ?? 0))}%` }}
                      />
                    </span>
                    <span dir="ltr" className="w-12 text-end text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {formatPercent(pct)}
                    </span>
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span dir="ltr" className="text-sm font-bold text-success tabular-nums">
                    {formatNumber(r.total)}
                  </span>
                  <span dir="ltr" className="text-[11px] text-muted-foreground tabular-nums">
                    {formatCompactCurrency(r.sales, locale)}
                  </span>
                </div>
                <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
