import { ChevronRightIcon, FlagIcon, HandCoinsIcon, UserRoundIcon } from "lucide-react";
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
  const achievement = target > 0 ? (totals.sales / target) * 100 : null;
  const achievementProgress = Math.min(Math.max(achievement ?? 0, 0), 100);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <section className="relative isolate min-w-0 flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-[#5a3a1d] via-[#4a2d16] to-[#2e1d0f] p-4 text-white shadow-lg shadow-[#4a2d16]/15 sm:p-5">
          <div aria-hidden className="pointer-events-none absolute -end-12 -top-20 size-48 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-100 ring-1 ring-white/15 sm:size-11">
              <HandCoinsIcon aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white/75">{t("teamTotal")}</p>
              <p dir="ltr" className="mt-1 text-start text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                {formatNumber(totals.commission)}
                <span className="ms-2 text-sm font-semibold text-white/70">{locale === "ar" ? "ج.م" : "EGP"}</span>
              </p>
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-3 border-t border-white/15 pt-3">
            <div className="min-w-0">
              <p className="text-xs text-white/65">{t("sales")}</p>
              <p dir="ltr" className="mt-1 text-start text-sm font-bold text-white tabular-nums">{formatCompactCurrency(totals.sales, locale)}</p>
            </div>
            <div className="min-w-0 border-s border-white/15 ps-3">
              <p className="text-xs text-white/65">{t(clock.closed ? "target" : "targetToDate")}</p>
              <p dir="ltr" className="mt-1 text-start text-sm font-bold text-white tabular-nums">{target ? formatCompactCurrency(target, locale) : "—"}</p>
            </div>
            <div className="min-w-0 border-s border-white/15 ps-3">
              <p className="text-xs text-white/65">{t("achievement")}</p>
              <p dir="ltr" className="mt-1 text-start text-sm font-bold text-white tabular-nums">{formatPercent(achievement)}</p>
            </div>
          </div>
          <div
            role="progressbar"
            aria-label={t("achievement")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={achievementProgress}
            className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"
          >
            <div className="h-full rounded-full bg-emerald-300 transition-[width]" style={{ width: `${achievementProgress}%` }} />
          </div>
          <div aria-hidden className="pointer-events-none absolute -bottom-12 -start-10 size-28 rounded-full border border-white/10" />
        </section>
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
                  <UserRoundIcon aria-hidden className="size-5" />
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
      {canExport ? <div className="flex justify-end"><RepsExport reps={view.reps} month={clock.month} /></div> : null}
    </div>
  );
}
