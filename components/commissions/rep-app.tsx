"use client";

import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  BanknoteIcon,
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  ChevronRightIcon,
  FlagIcon,
  HandCoinsIcon,
  LayersIcon,
  LightbulbIcon,
  PackageIcon,
  ReceiptTextIcon,
  RulerIcon,
  SearchIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { AndroidBottomNav, type AppSection } from "@/components/layout/android-bottom-nav";
import type { Locale } from "@/i18n/routing";
import type { Adjustment } from "@/lib/commissions/engine";
import type { Category, CommissionSettings } from "@/lib/commissions/schema";
import type { MonthClock, RepDetail } from "@/lib/commissions/view";
import { formatCompactCurrency, formatCurrency, formatMonth, formatNumber, formatPercent, formatRate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DailyChart } from "./daily-chart";

type Tab = AppSection;

/**
 * The seller's commission app: one screen per seller. A balance header (what they earn now), the road to
 * the next level, then four tabs of plain lists — summary, sales, collections, and the statement that
 * shows how the amount is built. No dashboard tiles.
 */
export function RepApp({ detail, settings, clock, teamLink, initialTab = "summary" }: { detail: RepDetail; settings: CommissionSettings; clock: MonthClock; teamLink: boolean; initialTab?: Tab }) {
  const t = useTranslations("app2");
  const locale = useLocale() as Locale;
  const [tab, setTab] = useState<Tab>(initialTab);
  const { rep } = detail;
  const r = rep.result;

  return (
    <div data-app-section={tab} className="rep-app mx-auto flex w-full max-w-3xl flex-col gap-4">
      {teamLink ? (
        <Link href={{ pathname: "/commissions", query: { month: clock.month, rep: "all" } }} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
          {t("team")}
        </Link>
      ) : null}

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* Balance header */}
        <header className="rep-balance-header relative overflow-hidden bg-gradient-to-br from-[#5a3a1d] via-[#4a2d16] to-[#2e1d0f] px-5 pt-5 pb-6 text-white sm:px-7">
          <div aria-hidden className="pointer-events-none absolute -end-20 -top-24 size-72 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <Initials name={rep.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">
                <bdi>{rep.name}</bdi>
              </p>
              <p className="text-xs text-white/70">{formatMonth(clock.month, locale)} · {clock.closed ? t("closed") : t("day", { day: clock.elapsedDays, days: clock.monthDays })}</p>
            </div>
            <LevelChip regime={r.regime} />
          </div>

          <div className="relative mt-6 flex flex-col items-center text-center">
            <span className="text-sm text-white/75">{t(clock.closed ? "earnedFinal" : "earnedNow")}</span>
            <span dir="ltr" className="mt-1 text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
              {formatNumber(r.total)}
              <span className="ms-2 text-xl font-semibold text-white/70">{locale === "ar" ? "ج.م" : "EGP"}</span>
            </span>
            {r.regime !== "full" ? (
              <span className="mt-2 text-xs text-white/70">{t(`level.${r.regime}`, { low: settings.rules.lowAchievementPct, old: settings.rules.oldSystemUntilPct, rate: settings.rules.lowRate })}</span>
            ) : null}
          </div>

          <LevelRoad achievement={r.achievement} projected={clock.closed ? null : rep.projectedAchievement} low={settings.rules.lowAchievementPct} old={settings.rules.oldSystemUntilPct} />

          <dl className="relative mt-5 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/10 py-3 text-center rtl:divide-x-reverse">
            <Mini label={t("sales")} value={formatCompactCurrency(r.sales, locale)} />
            <Mini label={t(clock.closed ? "totalTarget" : "targetToDate")} value={r.totalTargetToDate ? formatCompactCurrency(r.totalTargetToDate, locale) : "—"} />
            <Mini label={t("achieved")} value={formatPercent(r.achievement)} />
          </dl>
        </header>

        {/* Tabs */}
        <nav aria-label={t("tabs")} className="web-only sticky top-16 z-10 border-b bg-card/95 px-3 py-2 backdrop-blur sm:px-5">
          <div role="tablist" className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
            {(["summary", "sales", "collections", "statement"] as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                  tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`tab.${key}`)}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex flex-col gap-6 px-4 py-5 sm:px-6">
          {tab === "summary" ? <Summary detail={detail} settings={settings} clock={clock} /> : null}
          {tab === "sales" ? <Sales detail={detail} clock={clock} /> : null}
          {tab === "collections" ? <Collections detail={detail} clock={clock} /> : null}
          {tab === "statement" ? <Statement detail={detail} settings={settings} /> : null}
        </div>
      </div>
      <p className="rep-footer text-center text-xs text-muted-foreground">{t(clock.closed ? "footerClosed" : "footerLive")}</p>
      <AndroidBottomNav active={tab} onSelect={setTab} month={clock.month} rep={rep.key} />
    </div>
  );
}

// ---------------------------------------------------------------- building blocks
function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold ring-2 ring-white/25">{letters}</span>;
}

function LevelChip({ regime }: { regime: RepDetail["rep"]["result"]["regime"] }) {
  const t = useTranslations("app2.chip");
  const tone = { full: "bg-emerald-400/20 text-emerald-100", old: "bg-amber-300/20 text-amber-100", low: "bg-red-400/25 text-red-100", noTarget: "bg-white/15 text-white" }[regime];
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", tone)}>{t(regime)}</span>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-2">
      <dt className="text-[11px] text-white/65">{label}</dt>
      <dd dir="ltr" className="text-sm font-bold tabular-nums sm:text-base">
        {value}
      </dd>
    </div>
  );
}

/** The road to the target: three levels (0.1 % · old system · full + bonuses) with the rep's position and month-end projection. */
function LevelRoad({ achievement, projected, low, old }: { achievement: number | null; projected: number | null; low: number; old: number }) {
  const t = useTranslations("app2.road");
  if (achievement == null) return null;
  const max = Math.max(110, Math.min(160, Math.ceil(Math.max(achievement, projected ?? 0) / 10) * 10 + 10));
  const at = (value: number) => `${(100 * Math.min(Math.max(value, 0), max)) / max}%`;
  const marks = [
    { value: low, label: `${low}%` },
    { value: old, label: `${old}%` },
    { value: 100, label: t("target") },
  ];
  return (
    <div className="relative mt-6" dir="ltr" aria-label={t("label", { pct: formatPercent(achievement) })}>
      <div className="relative h-2.5 rounded-full bg-white/15">
        {projected != null && projected > achievement ? <div className="absolute inset-y-0 left-0 rounded-full bg-white/25" style={{ width: at(projected) }} /> : null}
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-[width] duration-700" style={{ width: at(achievement) }} />
        {marks.map((mark) => (
          <span key={mark.label} className={cn("absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2", achievement >= mark.value ? "border-white bg-emerald-300" : "border-white/60 bg-[#4a2d16]")} style={{ left: at(mark.value) }} />
        ))}
        <span className="absolute -top-1 size-[18px] -translate-x-1/2 rounded-full border-[3px] border-white bg-amber-300 shadow" style={{ left: at(achievement) }} />
      </div>
      <div className="relative mt-2 h-4 text-[10px] text-white/70">
        {marks.map((mark) => (
          <span key={mark.label} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: at(mark.value) }}>
            {mark.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Group({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">{children}</ul>
      {footer ? <p className="px-1 text-xs text-muted-foreground">{footer}</p> : null}
    </section>
  );
}

function Row({
  icon,
  label,
  sub,
  value,
  valueSub,
  tone,
  progress,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  sub?: React.ReactNode;
  value?: React.ReactNode;
  valueSub?: React.ReactNode;
  tone?: "good" | "bad" | "muted";
  progress?: number | null;
}) {
  return (
    <li className={cn("flex px-4 py-3", progress !== undefined ? "flex-col gap-2" : "items-center gap-3")}>
      <div className={cn("flex min-w-0 items-center gap-3", progress !== undefined && "w-full")}>
        {icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">{icon}</span> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Full name, wrapping onto a second line on narrow screens rather than cut with "…". */}
          <span className="text-sm font-medium leading-snug break-words">{label}</span>
          {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
        </div>
        {value !== undefined ? (
          <div className={cn("flex min-w-0 shrink-0 flex-col items-end text-end", progress !== undefined ? "w-[42%]" : "max-w-[42%]")}>
            <span dir="ltr" className={cn("text-sm font-semibold tabular-nums", tone === "good" && "text-success", tone === "bad" && "text-destructive", tone === "muted" && "text-muted-foreground")}>
              {value}
            </span>
            {valueSub ? <span className="text-[11px] leading-snug text-muted-foreground">{valueSub}</span> : null}
          </div>
        ) : null}
      </div>
      {progress !== undefined ? (
          <span className="h-1.5 overflow-hidden rounded-full bg-muted" dir="ltr">
            <span
              className={cn("block h-full rounded-full", progress == null ? "" : progress >= 100 ? "bg-success" : progress >= 70 ? "bg-warning" : "bg-destructive")}
              style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}
            />
          </span>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------- tab 1: summary
function Summary({ detail, settings, clock }: { detail: RepDetail; settings: CommissionSettings; clock: MonthClock }) {
  const t = useTranslations("app2");
  const locale = useLocale() as Locale;
  const { rep } = detail;
  const r = rep.result;
  const tips = useTips(detail, settings);
  const qtyUnit = t("m");
  const categoryText = (key: Category) => {
    const c = r.categories[key];
    const fmt = (value: number | null) => (value == null ? "—" : c.unit === "amount" ? formatCompactCurrency(value, locale) : `${formatNumber(value)} ${qtyUnit}`);
    return `${fmt(c.achieved)} / ${fmt(c.targetToDate)}`;
  };
  const flagged = r.belowMinimum || rep.minimumRisk;

  return (
    <>
      {flagged ? (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          <FlagIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          {r.belowMinimum
            ? t("flagBelow", { amount: formatCurrency(settings.rules.minimumSales, locale) })
            : t("flagRisk", { projected: formatCurrency(rep.projectedSales, locale), amount: formatCurrency(settings.rules.minimumSales, locale) })}
        </p>
      ) : null}

      <Group title={t("targets")}>
        <Row icon={<TargetIcon aria-hidden className="size-4" />} label={t(clock.closed ? "totalTarget" : "targetToDate")} sub={`${formatCompactCurrency(r.sales, locale)} / ${r.totalTargetToDate ? formatCompactCurrency(r.totalTargetToDate, locale) : "—"}`} value={formatPercent(r.achievement)} progress={r.achievement} />
        {(["slow", "digital"] as Category[]).map((key) => (
          <Row
            key={key}
            icon={key === "slow" ? <LayersIcon aria-hidden className="size-4" /> : <ZapIcon aria-hidden className="size-4" />}
            label={t(`cat.${key}`)}
            sub={categoryText(key)}
            value={r.categories[key].targetToDate ? formatPercent(r.categories[key].achievement) : "—"}
            valueSub={
              r.categories[key].targetToDate == null
                ? undefined
                : r.categories[key].achieved >= r.categories[key].targetToDate
                  ? t("targetMet")
                  : t("remainingTarget", {
                      amount:
                        r.categories[key].unit === "amount"
                          ? formatCompactCurrency(r.categories[key].targetToDate - r.categories[key].achieved, locale)
                          : `${formatNumber(Math.ceil(r.categories[key].targetToDate - r.categories[key].achieved))} ${qtyUnit}`,
                    })
            }
            progress={r.categories[key].targetToDate ? r.categories[key].achievement : null}
          />
        ))}
        {r.tiers
          .filter((range) => range.targetToDate != null)
          .map((range) => {
            const target = range.targetToDate;
            if (target == null) return null;
            const fmt = (value: number | null) => (value == null ? "—" : range.unit === "amount" ? formatCompactCurrency(value, locale) : `${formatNumber(value)} ${qtyUnit}`);
            return (
              <Row
                key={range.key}
                icon={<span className="text-xs font-bold">{range.key}</span>}
                label={t("range", { key: range.key })}
                sub={`${fmt(range.achieved)} / ${fmt(range.targetToDate)}`}
                value={formatPercent(range.achievement)}
                valueSub={
                  range.achieved >= target
                    ? t("targetMet")
                    : t("remainingTarget", {
                        amount:
                          range.unit === "amount"
                            ? formatCompactCurrency(target - range.achieved, locale)
                            : `${formatNumber(Math.ceil(target - range.achieved))} ${qtyUnit}`,
                      })
                }
                progress={range.achievement}
              />
            );
          })}
        <Row
          icon={<HandCoinsIcon aria-hidden className="size-4" />}
          label={t(clock.closed ? "collectionRate" : "collectionRateToDate")}
          sub={`${formatCompactCurrency(r.collections, locale)} / ${formatCompactCurrency(r.sales, locale)} ${t("collectedOfSales")}`}
          value={formatPercent(r.collectionRatio)}
          valueSub={t("commissionApplied", { pct: formatPercent(r.collectionFactor) })}
          progress={r.collectionFactor}
        />
      </Group>

      {!clock.closed && r.totalTarget ? (
        <Group title={t("pace")}>
          <Row icon={<TrendingUpIcon aria-hidden className="size-4" />} label={t("projected")} value={formatCompactCurrency(rep.projectedSales, locale)} valueSub={formatPercent(rep.projectedAchievement)} />
          <Row icon={<CalendarClockIcon aria-hidden className="size-4" />} label={t("perDay")} sub={t("daysLeft", { days: clock.remainingDays })} value={rep.perDayToTarget ? formatCompactCurrency(rep.perDayToTarget, locale) : t("reached")} tone={rep.perDayToTarget ? undefined : "good"} />
        </Group>
      ) : null}

      <Group title={t("earnMore")} footer={t("earnMoreHint")}>
        {tips.length ? (
          tips.map((tip) => (
            <li key={tip.key} className={cn("flex items-start gap-3 px-4 py-3 text-sm", tip.tone === "warn" && tip.key !== "slowMin" && "bg-warning-soft text-warning", tip.condition && "bg-warning-soft font-semibold text-warning")}>
              <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                {tip.rewardAmount ? <strong className="me-1 font-bold text-success">{tip.rewardAmount}</strong> : null}
                {tip.text}
              </span>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t("nothingLeft")}</li>
        )}
      </Group>

      <Group title={t("thisMonth")}>
        <Row icon={<ReceiptTextIcon aria-hidden className="size-4" />} label={t("invoices")} value={formatNumber(rep.invoices)} valueSub={t("customersN", { count: rep.customers })} />
        <Row icon={<BanknoteIcon aria-hidden className="size-4" />} label={t("cashShare")} sub={t("cashNeed", { pct: settings.rules.cashSharePct })} value={formatPercent(r.cashShare)} tone={(r.cashShare ?? 0) >= settings.rules.cashSharePct ? "good" : undefined} />
        <Row icon={<HandCoinsIcon aria-hidden className="size-4" />} label={t("collected")} sub={t("collectNeed", { pct: settings.rules.collectionPct })} value={formatCompactCurrency(r.collections, locale)} valueSub={formatPercent(r.collectionRatio)} />
      </Group>
    </>
  );
}

type Tip = { key: string; text: string; tone: "good" | "todo" | "warn"; rewardAmount?: string; condition?: boolean };

function useTips(detail: RepDetail, settings: CommissionSettings): Tip[] {
  const t = useTranslations("cm.next");
  const locale = useLocale() as Locale;
  const r = detail.rep.result;
  const { rules } = settings;
  const money = (value: number) => formatCurrency(Math.ceil(value), locale);
  const tips: Tip[] = [];
  const target = r.totalTargetToDate;
  let hasUnmetTargets = false;
  const uom = t("qtyUnit");
  if (target) {
    if (r.regime === "low") tips.push({ key: "low", tone: "warn", text: t("toOld", { amount: money((target * rules.lowAchievementPct) / 100 - r.sales), pct: rules.lowAchievementPct }) });
    if (r.regime === "low" || r.regime === "old") tips.push({ key: "full", tone: "warn", text: t("toFull", { amount: money((target * rules.oldSystemUntilPct) / 100 - r.sales), pct: rules.oldSystemUntilPct }) });
    if (r.sales < target) hasUnmetTargets = true;
  } else tips.push({ key: "noTarget", tone: "warn", text: t("noTarget") });
  for (const key of ["slow", "digital"] as const) {
    const category = r.categories[key];
    if (category.targetToDate != null && category.achieved < category.targetToDate) {
      hasUnmetTargets = true;
    }
  }
  r.tiers.forEach((range) => {
    if (range.targetToDate != null && range.achieved < range.targetToDate) {
      hasUnmetTargets = true;
    }
  });
  if (hasUnmetTargets) {
    tips.push({
      key: "target",
      tone: "todo",
      text: t("toTarget", { pct: rules.allTargetsBonusPct }),
      condition: true,
    });
  }
  const slow = r.categories.slow;
  if (slow.targetToDate && slow.achievement != null && slow.achievement < rules.slowMinPct) {
    const need = (slow.targetToDate * rules.slowMinPct) / 100 - slow.achieved;
    const deduction = r.adjustments.find((item) => item.key === "slowDeduction")?.amount ?? 0;
    tips.push({
      key: "slowMin",
      tone: "warn",
      text: t("slowMinRecovery", {
        gap: slow.unit === "amount" ? money(need) : `${formatNumber(Math.ceil(need))} ${uom}`,
        pct: rules.slowDeductionPct,
        min: rules.slowMinPct,
      }),
      rewardAmount: deduction < 0 ? money(Math.abs(deduction)) : undefined,
    });
  }
  if (r.sales > 0) {
    if (r.collectionFactor < 100) {
      const collectionAdjustment = r.adjustments.find((item) => item.key === "collectionShare");
      if (collectionAdjustment) {
        tips.push({
          key: "commissionAtFullCollection",
          tone: "todo",
          text: t("commissionAtFullCollection", { amount: money(r.sales - r.collections) }),
          rewardAmount: money(Math.abs(collectionAdjustment.amount)),
        });
      }
    }
    if ((r.cashShare ?? 0) < rules.cashSharePct) {
      tips.push({
        key: "cash",
        tone: "todo",
        text: t("cash", { pct: formatPercent(r.cashShare), need: rules.cashSharePct }),
        rewardAmount: money(rules.cashBonus),
      });
    }
    const collectNeed = (r.sales * rules.collectionPct) / 100 - r.collections;
    if (collectNeed >= 0) {
      tips.push({
        key: "collect",
        tone: "todo",
        text: t("collect", { amount: money(collectNeed + 1) }),
        rewardAmount: money(rules.collectionBonus),
      });
    }
  }
  const ladder = r.adjustments.find((item) => item.key === "salesLadder");
  if (ladder?.threshold) {
    const nextBonus = rules.salesBonuses
      .filter((step) => step.from === ladder.threshold)
      .reduce((highest, step) => Math.max(highest, step.amount), 0);
    tips.push({
      key: "ladder",
      tone: "todo",
      text: t("ladder", { amount: money(ladder.threshold - r.sales), at: formatCompactCurrency(ladder.threshold, locale) }),
      rewardAmount: nextBonus > 0 ? money(nextBonus) : undefined,
    });
  }
  if (r.allTargetsMet) tips.unshift({ key: "great", tone: "good", text: t("allMet", { pct: rules.allTargetsBonusPct }) });
  return tips;
}

// ---------------------------------------------------------------- tab 2: sales
const SHOWN = 20;
type SalesView = "products" | "invoices" | "customers" | "days";

function Sales({ detail, clock }: { detail: RepDetail; clock: MonthClock }) {
  const t = useTranslations("app2");
  const tc = useTranslations("cm");
  const locale = useLocale() as Locale;
  const [view, setView] = useState<SalesView>("days");
  const [mobileView, setMobileView] = useState<SalesView | null>(null);
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const text = query.trim().toLowerCase();
  const match = (value: string) => !text || value.toLowerCase().includes(text);
  const products = useMemo(() => detail.products.filter((row) => match(`${row.productName} ${row.code ?? ""} ${row.color ?? ""} ${row.invoices.join(" ")}`)), [detail.products, text]); // eslint-disable-line react-hooks/exhaustive-deps
  const invoices = useMemo(() => detail.invoiceRows.filter((row) => match(`${row.name} ${row.customer}`)), [detail.invoiceRows, text]); // eslint-disable-line react-hooks/exhaustive-deps
  const customers = useMemo(() => detail.customerRows.filter((row) => match(row.name)), [detail.customerRows, text]); // eslint-disable-line react-hooks/exhaustive-deps
  // By day: the invoices of each day (newest first); the search matches invoice numbers and customers on that day.
  const days = useMemo(() => {
    const map = new Map<string, { day: string; invoices: number; refunds: number; customers: Set<string>; qty: number; amount: number; commission: number }>();
    for (const row of detail.invoiceRows) {
      if (!match(`${row.name} ${row.customer} ${row.day}`)) continue;
      const entry = map.get(row.day) ?? { day: row.day, invoices: 0, refunds: 0, customers: new Set<string>(), qty: 0, amount: 0, commission: 0 };
      if (row.refund) entry.refunds += 1;
      else entry.invoices += 1;
      entry.customers.add(row.customer);
      entry.qty += row.qty;
      entry.amount += row.amount;
      entry.commission += row.commission;
      map.set(row.day, entry);
    }
    return [...map.values()].sort((a, b) => b.day.localeCompare(a.day));
  }, [detail.invoiceRows, text]); // eslint-disable-line react-hooks/exhaustive-deps
  const currentView = mobileView ?? view;
  const count = { products: products.length, invoices: invoices.length, customers: customers.length, days: days.length }[currentView];
  const bucketLabel = (bucket: string) => (bucket === "slow" || bucket === "digital" ? t(`cat.${bucket}`) : bucket === "none" ? t("noRange") : t("range", { key: bucket }));
  const cut = <T,>(list: T[]) => (all ? list : list.slice(0, SHOWN));
  const dayLabel = (day: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
  const totalCommission = detail.invoiceRows.reduce((sum, row) => sum + row.commission, 0);
  const weekdayLabel = (day: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

  return (
    <>
      <div className="web-only">
        <DailyChart points={detail.daily} target={detail.rep.result.totalTarget} closedOrToday={clock.asOf} title={tc("chart.title")} caption={tc("chart.caption")} />
      </div>
      {mobileView == null ? (
        <section className="app-only flex flex-col gap-3">
          <h2 className="text-center text-lg font-bold">{t("chooseSalesView")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["days", "customers", "invoices", "products"] as SalesView[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMobileView(key);
                  setAll(false);
                  setQuery("");
                }}
                className="flex min-h-20 items-center gap-3 rounded-2xl border bg-card px-4 py-4 text-start shadow-sm transition-colors hover:bg-accent"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  {key === "days" ? <CalendarDaysIcon aria-hidden className="size-5" /> : key === "customers" ? <UsersIcon aria-hidden className="size-5" /> : key === "invoices" ? <ReceiptTextIcon aria-hidden className="size-5" /> : <PackageIcon aria-hidden className="size-5" />}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{t(`view.${key}`)}</span>
                <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <section className={cn("flex flex-col gap-3", mobileView == null ? "web-only" : "android-sales-results")} data-mobile-selected={mobileView != null}>
        {mobileView ? (
          <button type="button" onClick={() => { setMobileView(null); setQuery(""); }} className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-muted">
            <ChevronLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
            {t("chooseSalesView")}
          </button>
        ) : null}
        <div role="tablist" aria-label={t("salesViews")} className="web-only grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
          {(["days", "customers", "invoices", "products"] as SalesView[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => {
                setView(key);
                setAll(false);
              }}
              className={cn("rounded-lg px-2 py-1.5 text-xs font-semibold sm:text-sm", view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t(`view.${key}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t(`viewTitle.${currentView}`, { count })}
          </h3>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">{t(`searchView.${currentView}`)}</span>
            <SearchIcon aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(`searchView.${currentView}`)}
              className="h-9 w-full rounded-full border border-input bg-card ps-9 pe-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </label>
        </div>

        {count === 0 ? (
          <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">{t("noSales")}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {currentView === "products"
              ? cut(products).map((row) => (
                  <li key={row.key} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <PackageIcon aria-hidden className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <bdi className="truncate text-left text-sm font-medium rtl:text-right">
                        {row.productName}
                        {row.color ? <span className="text-muted-foreground"> · {row.color}</span> : null}
                      </bdi>
                      <span dir="ltr" className="text-start text-xs text-muted-foreground tabular-nums">
                        {formatNumber(row.qty)} {row.uom ?? ""} × {row.avgPrice == null ? "—" : formatNumber(row.avgPrice)} = {formatNumber(row.amount)}
                      </span>
                      <InvoiceTags names={row.invoices} />
                    </div>
                    <div className="flex max-w-[42%] shrink-0 flex-col items-end text-end">
                      <span dir="ltr" className="text-sm font-semibold text-success tabular-nums">
                        +{formatNumber(row.commission)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {bucketLabel(row.bucket)} · <span dir="ltr">{formatRate(row.rate)}</span>
                      </span>
                    </div>
                  </li>
                ))
              : currentView === "invoices"
                ? cut(invoices).map((row) => (
                    <li key={row.moveId} className="flex items-center gap-3 px-4 py-3">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", row.refund ? "bg-destructive-soft text-destructive" : "bg-accent text-primary")}>
                        <ReceiptTextIcon aria-hidden className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          <span dir="ltr" className="text-sm font-semibold tabular-nums">{row.name}</span>
                          {row.refund ? <span className="rounded-full bg-destructive-soft px-1.5 py-0.5 text-[10px] font-semibold text-destructive">{t("refundTag")}</span> : null}
                        </span>
                        <bdi className="truncate text-left text-xs text-muted-foreground rtl:text-right">{row.customer}</bdi>
                        <span className="text-[11px] text-muted-foreground">
                          {dayLabel(row.day)} · {t("linesN", { count: row.lines })} · <span dir="ltr" className="tabular-nums">{formatNumber(row.amount)}</span>
                        </span>
                      </div>
                      <span dir="ltr" className={cn("shrink-0 text-sm font-semibold tabular-nums", row.commission < 0 ? "text-destructive" : "text-success")}>
                        {row.commission >= 0 ? "+" : ""}
                        {formatNumber(row.commission)}
                      </span>
                    </li>
                  ))
                : currentView === "days"
                  ? cut(days).map((row) => (
                      <li key={row.day} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-primary">
                          <span className="text-sm leading-none font-bold tabular-nums">{Number(row.day.slice(8, 10))}</span>
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-medium">{weekdayLabel(row.day)}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {t("invoicesN", { count: row.invoices })}
                            {row.refunds ? ` · ${t("refundsN", { count: row.refunds })}` : ""} · {t("customersN", { count: row.customers.size })}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs">
                            <DayFigure icon={RulerIcon} label={t("dayQty")} value={formatNumber(row.qty)} unit={t("m")} />
                            <DayFigure icon={BanknoteIcon} label={t("daySales")} value={formatNumber(row.amount)} unit={t("egp")} />
                          </span>
                        </div>
                        <span dir="ltr" className={cn("shrink-0 text-sm font-semibold tabular-nums", row.commission < 0 ? "text-destructive" : "text-success")}>
                          {row.commission >= 0 ? "+" : ""}
                          {formatNumber(row.commission)}
                        </span>
                      </li>
                    ))
                  : cut(customers).map((row, index) => (
                    <li key={`${row.name}-${index}`} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-bold text-primary tabular-nums">{index + 1}</span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <bdi className="truncate text-left text-sm font-medium rtl:text-right">{row.name}</bdi>
                        <span className="text-[11px] text-muted-foreground">
                          {t("invoicesN", { count: row.invoices })} · <span dir="ltr" className="tabular-nums">{formatNumber(row.amount)}</span>
                        </span>
                      </div>
                      <span dir="ltr" className={cn("shrink-0 text-sm font-semibold tabular-nums", row.commission < 0 ? "text-destructive" : "text-success")}>
                        {row.commission >= 0 ? "+" : ""}
                        {formatNumber(row.commission)}
                      </span>
                    </li>
                  ))}
          </ul>
        )}
        {count > SHOWN ? (
          <button type="button" onClick={() => setAll((value) => !value)} className="self-center rounded-full px-4 py-1.5 text-sm font-medium text-primary hover:bg-muted">
            {all ? t("less") : t("more", { count: count - SHOWN })}
          </button>
        ) : null}
        <p className="px-1 text-xs text-muted-foreground">
          {t("lineCommissionNote", { total: formatNumber(totalCommission) })} {t("sisterNote")}
        </p>
      </section>
    </>
  );
}

/** One labelled figure in a day row, e.g. "Meters 1,797 m" / "المبيعات 226,205 ج.م" (number kept left-to-right). */
function DayFigure({ icon: Icon, label, value, unit }: { icon: typeof RulerIcon; label: string; value: string; unit: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span>{label}</span>
      <bdi className="font-semibold text-foreground tabular-nums">{value}</bdi>
      <span>{unit}</span>
    </span>
  );
}

/** Invoice numbers a product was sold on: the first three, then "+N". */
function InvoiceTags({ names }: { names: string[] }) {
  const t = useTranslations("app2");
  const [open, setOpen] = useState(false);
  if (!names.length) return null;
  const shown = open ? names : names.slice(0, 3);
  return (
    <span className="flex flex-wrap items-center gap-1" aria-label={t("invoiceNumbers")}>
      {shown.map((name) => (
        <span key={name} dir="ltr" className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
          {name}
        </span>
      ))}
      {names.length > 3 ? (
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md px-1 text-[10px] font-semibold text-primary hover:underline">
          {open ? t("less") : `+${names.length - 3}`}
        </button>
      ) : null}
    </span>
  );
}

// ---------------------------------------------------------------- tab 3: collections
function Collections({ detail, clock }: { detail: RepDetail; clock: MonthClock }) {
  const t = useTranslations("app2");
  const locale = useLocale() as Locale;
  const r = detail.rep.result;
  const c = detail.collections;
  const recent = [...detail.daily].filter((day) => day.collections !== 0).reverse().slice(0, 10);
  return (
    <>
      <div className="flex flex-col items-center gap-1 rounded-2xl border bg-accent/50 px-4 py-5 text-center">
        <span className="text-xs text-muted-foreground">{t("collectedMonth")}</span>
        <span dir="ltr" className="text-3xl font-extrabold tabular-nums">{formatCurrency(r.collections, locale)}</span>
        <span className="text-xs text-muted-foreground">{t("ofSales", { pct: formatPercent(r.collectionRatio) })}</span>
      </div>
      <Group title={t("bySource")}>
        <Row icon={<WalletIcon aria-hidden className="size-4" />} label={t("payments")} value={formatNumber(c.payment)} />
        <Row icon={<ReceiptTextIcon aria-hidden className="size-4" />} label={t("cheques")} value={formatNumber(c.cheque)} />
        <Row icon={<BanknoteIcon aria-hidden className="size-4" />} label={t("treasury")} value={formatNumber(c.manual)} />
        {c.refund ? <Row icon={<CircleMinusIcon aria-hidden className="size-4" />} label={t("refunds")} value={formatNumber(c.refund)} tone="bad" /> : null}
      </Group>
      <Group title={t("customersOwe")}>
        <Row
          icon={<UsersIcon aria-hidden className="size-4" />}
          label={t("debtToday")}
          sub={clock.closed ? t("debtClosed") : t("debtSub")}
          value={detail.rep.receivables == null ? "—" : formatCurrency(detail.rep.receivables, locale)}
        />
      </Group>
      {recent.length ? (
        <Group title={t("latestDays")}>
          {recent.map((day) => (
            <Row key={day.day} label={new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day.day}T00:00:00Z`))} value={formatNumber(day.collections)} />
          ))}
        </Group>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- tab 4: statement
function Statement({ detail, settings }: { detail: RepDetail; settings: CommissionSettings }) {
  const t = useTranslations("app2");
  const tb = useTranslations("cm.build");
  const locale = useLocale() as Locale;
  const r = detail.rep.result;
  const { rules } = settings;
  const replaced = r.regime === "low" || (r.regime === "old" && rules.oldSystemMode !== "base");
  const useOldSystemTiers = r.regime === "old" && rules.oldSystemMode === "tiers";
  const activeTiers = useOldSystemTiers ? rules.oldSystemTiers : settings.tiers;
  const activeBuckets = useOldSystemTiers ? r.oldTiers : r.tiers;
  const lines = [
    ...activeBuckets.map((bucket, index) => ({ key: bucket.key, label: t("range", { key: bucket.key }), sub: activeTiers[index].to == null ? t("priceFrom", { from: formatNumber(activeTiers[index].from) }) : t("priceBetween", { from: formatNumber(activeTiers[index].from), to: formatNumber(activeTiers[index].to) }), amount: bucket.amount, rate: formatRate(bucket.rate), commission: bucket.commission })),
    ...(["slow", "digital"] as const).map((key) => ({ key, label: t(`cat.${key}`), sub: t("ownRates"), amount: r.categories[key].amount, rate: formatRate(settings.categoryRates[key]), commission: r.categories[key].commission })),
  ].filter((line) => line.amount !== 0 || line.commission !== 0);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const canOpen = (key: string) => rules.statementDetails[key as keyof typeof rules.statementDetails] !== false && detail.products.some((row) => row.bucket === key);
  const adjustments = r.adjustments.filter((item) => item.key !== "lowRate" && item.key !== "oldRate" && item.key !== "oldTiers" && item.key !== "collectionShare");
  const collectionShare = r.adjustments.find((item) => item.key === "collectionShare");

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-dashed pb-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SparklesIcon aria-hidden className="size-4 text-primary" />
          {t("statementTitle")}
        </span>
        <span className="text-xs text-muted-foreground">{t(`level.${r.regime}Short`)}</span>
      </div>

      <ul className="flex flex-col gap-2 border-b border-dashed py-3">
        {lines.map((line) => {
          const openable = canOpen(line.key);
          const open = openable && openKey === line.key;
          const body = (
            <>
              <span className="flex min-w-0 flex-col text-start">
                <span className="flex items-center gap-1 font-medium">
                  {line.label}
                  {openable ? <ChevronDownIcon aria-hidden className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} /> : null}
                </span>
                <span dir="ltr" className="text-start text-[11px] text-muted-foreground tabular-nums">
                  {formatNumber(line.amount)} {line.rate ? `× ${line.rate}` : ""} · {line.sub}
                </span>
              </span>
              <span aria-hidden className="mb-1 flex-1 self-end border-b border-dotted" />
              <span dir="ltr" className="font-semibold tabular-nums">{formatNumber(line.commission)}</span>
            </>
          );
          return (
            <li key={line.key} className={cn("flex flex-col text-sm", replaced && "opacity-50")}>
              {openable ? (
                <button type="button" aria-expanded={open} onClick={() => setOpenKey(open ? null : line.key)} className="-mx-2 flex items-baseline gap-2 rounded-lg px-2 py-1 hover:bg-muted">
                  {body}
                </button>
              ) : (
                <div className="flex items-baseline gap-2 py-1">{body}</div>
              )}
              {open ? <BucketProducts rows={detail.products.filter((row) => row.bucket === line.key)} /> : null}
            </li>
          );
        })}
        <li className={cn("flex items-baseline gap-2 rounded-lg bg-accent/60 px-2 py-2 text-sm font-bold text-foreground", replaced && "opacity-50")}>
          <span>{t("lineCommission")}</span>
          <span aria-hidden className="mb-1 flex-1 border-b border-dotted" />
          <span dir="ltr" className="tabular-nums">{formatNumber(useOldSystemTiers ? r.adjustments.find((item) => item.key === "oldTiers")?.amount ?? r.base : r.base)}</span>
        </li>
      </ul>

      <ul className="flex flex-col gap-2 border-b border-dashed py-3">
        {collectionShare ? <StatementAdjustment item={collectionShare} rules={rules} replaced={false} /> : null}
        {adjustments.map((item) => (
          <StatementAdjustment key={item.key} item={item} rules={rules} replaced={replaced} />
        ))}
        {replaced ? (
          <li className="flex items-baseline gap-2 rounded-lg bg-warning-soft px-2 py-1.5 text-sm text-warning">
            <span>{r.regime === "low" ? tb("lowRate", { rate: rules.lowRate }) : rules.oldSystemMode === "tiers" ? tb("oldTiers") : tb("oldRate", { rate: rules.oldRate })}</span>
            <span aria-hidden className="mb-1 flex-1" />
            <span dir="ltr" className="font-semibold tabular-nums">{formatNumber(r.beforeCollection)}</span>
          </li>
        ) : null}
      </ul>

      <div className="flex items-baseline justify-between pt-3">
        <span className="text-base font-bold">{t("youEarn")}</span>
        <span dir="ltr" className="text-2xl font-extrabold text-success tabular-nums">
          {formatCurrency(r.total, locale)}
        </span>
      </div>
      {r.regime === "old" && rules.oldSystemMode === "base" ? <p className="mt-3 text-xs text-muted-foreground">{tb("oldNote", { low: rules.lowAchievementPct, old: rules.oldSystemUntilPct })}</p> : null}
      {r.regime === "old" && rules.oldSystemMode === "tiers" ? <p className="mt-3 text-xs text-muted-foreground">{tb("oldTiersNote")}</p> : null}
    </div>
  );
}

/** Products sold in one price range / category: price after discount, quantity and the commission each earned. */
/** "[007861] Y7" → "Y7": the statement lists products by name only. */
const plainName = (name: string) => name.replace(/^\s*\[[^\]]*\]\s*/, "") || name;

function BucketProducts({ rows }: { rows: RepDetail["products"] }) {
  const t = useTranslations("app2");
  const num = "px-2 py-1.5 text-end whitespace-nowrap tabular-nums";
  return (
    <div className="mt-1 mb-2 max-h-96 overflow-auto rounded-xl border bg-muted/40">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted text-[11px] text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-start font-semibold">{t("product")}</th>
            <th className="px-2 py-1.5 text-end font-semibold">{t("priceNet")}</th>
            <th className="px-2 py-1.5 text-end font-semibold">{t("qtyM")}</th>
            <th className="px-2 py-1.5 text-end font-semibold">{t("commissionCol")}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="px-2 py-1.5">
                <bdi className="block min-w-[5.5rem] text-left rtl:text-right">
                  {plainName(row.productName)}
                  {row.color ? <span className="text-muted-foreground"> · {row.color}</span> : null}
                </bdi>
              </td>
              <td dir="ltr" className={num}>{row.avgPrice == null ? "—" : formatNumber(row.avgPrice)}</td>
              <td dir="ltr" className={num}>{formatNumber(row.qty)}</td>
              <td dir="ltr" className={cn(num, "font-semibold", row.commission < 0 ? "text-destructive" : "text-success")}>{formatNumber(row.commission)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-muted font-semibold">
          <tr>
            <td className="px-2 py-1.5">{t("total")}</td>
            <td />
            <td dir="ltr" className={num}>{formatNumber(rows.reduce((sum, row) => sum + row.qty, 0))}</td>
            <td dir="ltr" className={num}>{formatNumber(rows.reduce((sum, row) => sum + row.commission, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function StatementAdjustment({ item, rules, replaced }: { item: Adjustment; rules: CommissionSettings["rules"]; replaced: boolean }) {
  const t = useTranslations("cm.build");
  const locale = useLocale() as Locale;
  // Cash and collections bonuses, plus the slow-moving deduction, are independent of the commission regime.
  const independent = item.key === "cash" || item.key === "collection" || item.key === "slowDeduction";
  const earned = item.key === "collectionShare" ? item.applies : item.met && item.applies && (independent || !replaced);
  const Icon = earned ? (item.amount < 0 ? CircleMinusIcon : BadgeCheckIcon) : CircleDashedIcon;
  const label = {
    allTargets: t("allTargets", { pct: rules.allTargetsBonusPct }),
    slowDeduction: t("slowDeduction", { pct: rules.slowDeductionPct, min: rules.slowMinPct }),
    cash: t("cash", { pct: rules.cashSharePct }),
    collection: t("collection", { pct: rules.collectionPct }),
    salesLadder: t("salesLadder"),
    collectionShare: t("collectionShare"),
    lowRate: "",
    oldRate: "",
    oldTiers: "",
  }[item.key];
  const status =
    item.key === "salesLadder"
      ? item.met
        ? t("ladderAt", { sales: formatCompactCurrency(item.current, locale) })
        : item.threshold
          ? t("ladderNext", { at: formatCompactCurrency(item.threshold, locale) })
          : t("notMet")
      : item.current == null
        ? t("noData")
        : t("standing", { current: formatPercent(item.current), threshold: formatPercent(item.threshold) });
  // Cash / collections bonus: the target achievement it also needs.
  const gate = item.gate
    ? `${t(item.gate.met ? "gateMet" : "gateNeeded", { required: formatPercent(item.gate.required), now: formatPercent(item.gate.achievement) })}${item.gate.preset ? "" : ` ${t("gateDefault")}`}`
    : null;
  return (
    <li className={cn("flex items-start gap-2 text-sm", !earned && "text-muted-foreground")}>
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", earned && (item.amount < 0 ? "text-destructive" : "text-success"))} />
      <span className="flex min-w-0 flex-col">
        <span className={cn(earned && "font-medium text-foreground")}>{label}</span>
        <span className="text-[11px]">{item.met && !item.applies && !replaced ? t("notUnderSystem") : status}</span>
        {gate ? <span className={cn("text-[11px]", item.gate?.met ? "" : "text-warning")}>{gate}</span> : null}
      </span>
      <span aria-hidden className="mb-1 flex-1 self-end border-b border-dotted" />
      <span dir="ltr" className={cn("shrink-0 font-semibold tabular-nums", earned && (item.amount < 0 ? "text-destructive" : "text-success"))}>
        {earned ? `${item.amount > 0 ? "+" : ""}${formatNumber(item.amount)}` : "—"}
      </span>
    </li>
  );
}
