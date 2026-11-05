import { AlertTriangleIcon, BanknoteIcon, ChevronRightIcon, CoinsIcon, FlagIcon, HandCoinsIcon, TargetIcon, TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { KpiGrid, Money, Section } from "@/components/finance/report-ui";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CommissionsView, RepSummary } from "@/lib/commissions/view";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProgressBar, ProgressRing } from "./progress";
import { RepsExport } from "./reps-export";
import { RegimeBadge } from "./rep-detail";

export function Overview({ view, locale, canExport }: { view: CommissionsView; locale: Locale; canExport: boolean }) {
  const t = useTranslations("cm");
  const { totals, clock } = view;
  const teamAchievement = totals.targetToDate > 0 ? (100 * totals.sales) / totals.targetToDate : null;
  return (
    <div className="flex flex-col gap-5">
      <KpiGrid
        label={t("kpi.label")}
        columns={5}
        items={[
          {
            key: "sales",
            label: t("kpi.sales"),
            icon: TrendingUpIcon,
            tone: "brown",
            value: formatCompactCurrency(totals.sales, locale),
            sub: totals.targetToDate > 0
              ? t(clock.closed ? "kpi.ofTarget" : "kpi.ofTargetToDate", { pct: formatPercent(teamAchievement), target: formatCompactCurrency(totals.targetToDate, locale) })
              : t("kpi.noTarget"),
          },
          { key: "commission", label: t("kpi.commission"), icon: CoinsIcon, tone: "teal", value: formatCompactCurrency(totals.commission, locale), sub: t(clock.closed ? "kpi.final" : "kpi.soFar") },
          {
            key: "collections",
            label: t("kpi.collections"),
            icon: HandCoinsIcon,
            tone: "blue",
            value: formatCompactCurrency(totals.collections, locale),
            sub: totals.sales > 0 ? t("kpi.ofSales", { pct: formatPercent((100 * totals.collections) / totals.sales) }) : undefined,
          },
          { key: "track", label: t("kpi.onTrack"), icon: TargetIcon, tone: "violet", value: `${totals.onTrack} / ${view.reps.length}`, sub: t("kpi.onTrackSub") },
          { key: "flags", label: t("kpi.flagged"), icon: FlagIcon, tone: totals.flagged ? "red" : "slate", value: String(totals.flagged), sub: t("kpi.flaggedSub", { amount: formatNumber(view.settings.rules.minimumSales) }) },
        ]}
      />

      <MonthProgress clock={clock} />

      <Section
        title={t("board.title")}
        description={t("board.description")}
        actions={canExport ? <RepsExport reps={view.reps} month={view.clock.month} /> : undefined}
      >
        {view.reps.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {view.reps.map((rep, index) => (
              <li key={rep.key}>
                <RepCard rep={rep} rank={index + 1} locale={locale} month={view.clock.month} closed={clock.closed} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("board.empty")}</p>
        )}
      </Section>
    </div>
  );
}

export function MonthProgress({ clock }: { clock: CommissionsView["clock"] }) {
  const t = useTranslations("cm.month");
  const pct = (100 * clock.elapsedDays) / clock.monthDays;
  return (
    <div data-reveal className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">{clock.closed ? t("finished") : t("day", { day: clock.elapsedDays, days: clock.monthDays })}</span>
        <span className="text-xs text-muted-foreground">{clock.closed ? t("finalFigures") : t("remaining", { days: clock.remainingDays })}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" dir="ltr">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RepCard({ rep, rank, locale, month, closed }: { rep: RepSummary; rank: number; locale: Locale; month: string; closed: boolean }) {
  const t = useTranslations("cm");
  const r = rep.result;
  const flagged = r.belowMinimum || rep.minimumRisk;
  return (
    <Link
      href={{ pathname: "/commissions", query: { month, rep: rep.key } }}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        flagged && "border-destructive/40",
      )}
    >
      <div className="flex items-start gap-3">
        <ProgressRing value={r.achievement} projected={closed ? null : rep.projectedAchievement} size={72} stroke={7} label="" center={<span dir="ltr" className="text-sm font-bold tabular-nums">{r.achievement == null ? "—" : formatPercent(r.achievement)}</span>} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span dir="ltr" className="flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1 text-[11px] font-semibold text-muted-foreground tabular-nums">
              {rank}
            </span>
            <bdi className="truncate font-semibold">{rep.name}</bdi>
          </div>
          <RegimeBadge regime={r.regime} />
          {rep.odooUserId == null ? <span className="text-xs text-destructive">{t("board.notLinked")}</span> : null}
        </div>
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("board.sales")}</span>
          <span dir="ltr" className="text-start text-base font-bold tabular-nums">
            <Money value={r.sales} locale={locale} />
          </span>
          <span className="text-[11px] text-muted-foreground">
            {r.totalTargetToDate ? t(closed ? "board.of" : "board.ofToDate", { target: formatCompactCurrency(r.totalTargetToDate, locale) }) : t("board.noTarget")}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t(closed ? "board.commissionFinal" : "board.commission")}</span>
          <span dir="ltr" className="text-start text-base font-bold text-success tabular-nums">
            <Money value={r.total} locale={locale} />
          </span>
          <span className="text-[11px] text-muted-foreground">{t("board.collected", { pct: formatPercent(r.collectionRatio) })}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {(["slow", "digital"] as const).map((key) => {
          const c = r.categories[key];
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t(`categories.${key}`)}</span>
                <span dir="ltr" className="font-semibold tabular-nums">
                  {c.targetToDate ? formatPercent(c.achievement) : "—"}
                </span>
              </div>
              <ProgressBar value={c.targetToDate ? c.achievement : null} />
            </div>
          );
        })}
      </div>

      {flagged ? (
        <p className="mt-auto flex items-center gap-1.5 rounded-md bg-destructive-soft px-2 py-1.5 text-xs font-medium text-destructive">
          <AlertTriangleIcon aria-hidden className="size-3.5 shrink-0" />
          {r.belowMinimum ? t("flags.belowMinimum") : t("flags.minimumRisk")}
        </p>
      ) : rep.perDayToTarget ? (
        <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <BanknoteIcon aria-hidden className="size-3.5 shrink-0" />
          {t("board.perDay", { amount: formatCompactCurrency(rep.perDayToTarget, locale) })}
        </p>
      ) : null}
    </Link>
  );
}
