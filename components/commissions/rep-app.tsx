"use client";

import {
  BadgeCheckIcon,
  BanknoteIcon,
  CalendarClockIcon,
  ChevronLeftIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  FlagIcon,
  HandCoinsIcon,
  LayersIcon,
  LightbulbIcon,
  PackageIcon,
  ReceiptTextIcon,
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
import type { Locale } from "@/i18n/routing";
import type { Adjustment } from "@/lib/commissions/engine";
import type { Category, CommissionSettings } from "@/lib/commissions/schema";
import type { MonthClock, RepDetail } from "@/lib/commissions/view";
import { formatCompactCurrency, formatCurrency, formatMonth, formatNumber, formatPercent, formatRate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DailyChart } from "./daily-chart";

type Tab = "summary" | "sales" | "collections" | "statement";

/**
 * The seller's commission app: one screen per seller. A balance header (what they earn now), the road to
 * the next level, then four tabs of plain lists — summary, sales, collections, and the statement that
 * shows how the amount is built. No dashboard tiles.
 */
export function RepApp({ detail, settings, clock, teamLink }: { detail: RepDetail; settings: CommissionSettings; clock: MonthClock; teamLink: boolean }) {
  const t = useTranslations("app2");
  const locale = useLocale() as Locale;
  const [tab, setTab] = useState<Tab>("summary");
  const { rep } = detail;
  const r = rep.result;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {teamLink ? (
        <Link href={{ pathname: "/commissions", query: { month: clock.month, rep: "all" } }} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
          {t("team")}
        </Link>
      ) : null}

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* Balance header */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#5a3a1d] via-[#4a2d16] to-[#2e1d0f] px-5 pt-5 pb-6 text-white sm:px-7">
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
            <span className="mt-2 text-xs text-white/70">{t(`level.${r.regime}`, { low: settings.rules.lowAchievementPct, old: settings.rules.oldSystemUntilPct, rate: settings.rules.lowRate })}</span>
          </div>

          <LevelRoad achievement={r.achievement} projected={clock.closed ? null : rep.projectedAchievement} low={settings.rules.lowAchievementPct} old={settings.rules.oldSystemUntilPct} />

          <dl className="relative mt-5 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/10 py-3 text-center rtl:divide-x-reverse">
            <Mini label={t("sales")} value={formatCompactCurrency(r.sales, locale)} />
            <Mini label={t(clock.closed ? "totalTarget" : "targetToDate")} value={r.totalTargetToDate ? formatCompactCurrency(r.totalTargetToDate, locale) : "—"} />
            <Mini label={t("achieved")} value={formatPercent(r.achievement)} />
          </dl>
        </header>

        {/* Tabs */}
        <nav aria-label={t("tabs")} className="sticky top-16 z-10 border-b bg-card/95 px-3 py-2 backdrop-blur sm:px-5">
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
      <p className="text-center text-xs text-muted-foreground">{t(clock.closed ? "footerClosed" : "footerLive")}</p>
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
    <li className="flex items-center gap-3 px-4 py-3">
      {icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">{icon}</span> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium">{label}</span>
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
        {progress !== undefined ? (
          <span className="h-1.5 overflow-hidden rounded-full bg-muted" dir="ltr">
            <span
              className={cn("block h-full rounded-full", progress == null ? "" : progress >= 100 ? "bg-success" : progress >= 70 ? "bg-warning" : "bg-destructive")}
              style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}
            />
          </span>
        ) : null}
      </div>
      {value !== undefined ? (
        <div className="flex shrink-0 flex-col items-end">
          <span dir="ltr" className={cn("text-sm font-semibold tabular-nums", tone === "good" && "text-success", tone === "bad" && "text-destructive", tone === "muted" && "text-muted-foreground")}>
            {value}
          </span>
          {valueSub ? <span className="text-[11px] text-muted-foreground">{valueSub}</span> : null}
        </div>
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
            progress={r.categories[key].targetToDate ? r.categories[key].achievement : null}
          />
        ))}
        {r.tiers
          .filter((range) => range.targetToDate != null)
          .map((range) => {
            const fmt = (value: number | null) => (value == null ? "—" : range.unit === "amount" ? formatCompactCurrency(value, locale) : `${formatNumber(value)} ${qtyUnit}`);
            return (
              <Row
                key={range.key}
                icon={<span className="text-xs font-bold">{range.key}</span>}
                label={t("range", { key: range.key })}
                sub={`${fmt(range.achieved)} / ${fmt(range.targetToDate)}`}
                value={formatPercent(range.achievement)}
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
            <li key={tip.key} className={cn("flex items-start gap-3 px-4 py-3 text-sm", tip.tone === "good" && "bg-success-soft text-success", tip.tone === "warn" && "bg-warning-soft text-warning")}>
              <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{tip.text}</span>
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

type Tip = { key: string; text: string; tone: "good" | "todo" | "warn" };

function useTips(detail: RepDetail, settings: CommissionSettings): Tip[] {
  const t = useTranslations("cm.next");
  const locale = useLocale() as Locale;
  const r = detail.rep.result;
  const { rules } = settings;
  const money = (value: number) => formatCurrency(Math.ceil(value), locale);
  const tips: Tip[] = [];
  const target = r.totalTargetToDate;
  if (target) {
    if (r.regime === "low") tips.push({ key: "low", tone: "warn", text: t("toOld", { amount: money((target * rules.lowAchievementPct) / 100 - r.sales), pct: rules.lowAchievementPct }) });
    if (r.regime === "low" || r.regime === "old") tips.push({ key: "full", tone: "todo", text: t("toFull", { amount: money((target * rules.oldSystemUntilPct) / 100 - r.sales), pct: rules.oldSystemUntilPct }) });
    if (r.sales < target) tips.push({ key: "target", tone: "todo", text: t("toTarget", { amount: money(target - r.sales), pct: rules.allTargetsBonusPct }) });
  } else tips.push({ key: "noTarget", tone: "warn", text: t("noTarget") });
  const uom = t("qtyUnit");
  const slow = r.categories.slow;
  if (slow.targetToDate && slow.achievement != null && slow.achievement < rules.slowMinPct) {
    const need = (slow.targetToDate * rules.slowMinPct) / 100 - slow.achieved;
    tips.push({ key: "slowMin", tone: "warn", text: t("slowMin", { gap: slow.unit === "amount" ? money(need) : `${formatNumber(Math.ceil(need))} ${uom}`, pct: rules.slowDeductionPct, min: rules.slowMinPct }) });
  }
  for (const key of ["slow", "digital"] as const) {
    const c = r.categories[key];
    if (!c.targetToDate || c.achieved >= c.targetToDate) continue;
    const gap = c.targetToDate - c.achieved;
    tips.push({ key, tone: "todo", text: t("category", { name: t(`cat.${key}`), gap: c.unit === "amount" ? money(gap) : `${formatNumber(Math.ceil(gap))} ${uom}` }) });
  }
  for (const range of r.tiers) {
    if (!range.targetToDate || range.achieved >= range.targetToDate) continue;
    const gap = range.targetToDate - range.achieved;
    tips.push({ key: `range-${range.key}`, tone: "todo", text: t("category", { name: t("rangeName", { key: range.key }), gap: range.unit === "amount" ? money(gap) : `${formatNumber(Math.ceil(gap))} ${uom}` }) });
  }
  if (r.sales > 0) {
    if ((r.cashShare ?? 0) < rules.cashSharePct) tips.push({ key: "cash", tone: "todo", text: t("cash", { pct: formatPercent(r.cashShare), need: rules.cashSharePct, bonus: formatNumber(rules.cashBonus) }) });
    const collectNeed = (r.sales * rules.collectionPct) / 100 - r.collections;
    if (collectNeed >= 0) tips.push({ key: "collect", tone: "todo", text: t("collect", { amount: money(collectNeed + 1), bonus: formatNumber(rules.collectionBonus) }) });
  }
  const ladder = r.adjustments.find((item) => item.key === "salesLadder");
  if (ladder?.threshold) tips.push({ key: "ladder", tone: "todo", text: t("ladder", { amount: money(ladder.threshold - r.sales), at: formatCompactCurrency(ladder.threshold, locale) }) });
  if (r.allTargetsMet) tips.unshift({ key: "great", tone: "good", text: t("allMet", { pct: rules.allTargetsBonusPct }) });
  return tips;
}

// ---------------------------------------------------------------- tab 2: sales
const SHOWN = 20;

function Sales({ detail, clock }: { detail: RepDetail; clock: MonthClock }) {
  const t = useTranslations("app2");
  const tc = useTranslations("cm");
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? detail.products.filter((row) => `${row.productName} ${row.code ?? ""} ${row.color ?? ""}`.toLowerCase().includes(text)) : detail.products;
  }, [detail.products, query]);
  const shown = all ? rows : rows.slice(0, SHOWN);
  const bucketLabel = (bucket: string) => (bucket === "slow" || bucket === "digital" ? t(`cat.${bucket}`) : bucket === "none" ? t("noRange") : t("range", { key: bucket }));

  return (
    <>
      <DailyChart points={detail.daily} target={detail.rep.result.totalTarget} closedOrToday={clock.asOf} title={tc("chart.title")} caption={tc("chart.caption")} />
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("productsSold", { count: detail.products.length })}</h3>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">{t("search")}</span>
            <SearchIcon aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search")}
              className="h-9 w-full rounded-full border border-input bg-card ps-9 pe-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </label>
        </div>
        {shown.length ? (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {shown.map((row) => (
              <li key={row.key} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <PackageIcon aria-hidden className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <bdi className="truncate text-sm font-medium">
                    {row.productName}
                    {row.color ? <span className="text-muted-foreground"> · {row.color}</span> : null}
                  </bdi>
                  <span dir="ltr" className="text-start text-xs text-muted-foreground tabular-nums">
                    {formatNumber(row.qty)} {row.uom ?? ""} × {row.avgPrice == null ? "—" : formatNumber(row.avgPrice)} = {formatNumber(row.amount)}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span dir="ltr" className="text-sm font-semibold text-success tabular-nums">
                    +{formatNumber(row.commission)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {bucketLabel(row.bucket)} · <span dir="ltr">{formatRate(row.rate)}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">{t("noSales")}</p>
        )}
        {rows.length > SHOWN ? (
          <button type="button" onClick={() => setAll((value) => !value)} className="self-center rounded-full px-4 py-1.5 text-sm font-medium text-primary hover:bg-muted">
            {all ? t("less") : t("more", { count: rows.length - SHOWN })}
          </button>
        ) : null}
      </section>
      <Group title={t("topCustomers")} footer={t("sisterNote")}>
        {detail.customers.length ? (
          detail.customers.map((customer, index) => (
            <Row
              key={index}
              icon={<span className="text-xs font-bold tabular-nums">{index + 1}</span>}
              label={<bdi>{customer.name}</bdi>}
              sub={t("invoicesN", { count: customer.invoices })}
              value={formatNumber(customer.amount)}
            />
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t("noSales")}</li>
        )}
      </Group>
    </>
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
  const replaced = r.regime === "low" || (r.regime === "old" && rules.oldSystemMode === "rate");
  const lines = [
    ...r.tiers.map((bucket, index) => ({ key: bucket.key, label: t("range", { key: bucket.key }), sub: settings.tiers[index].to == null ? t("priceFrom", { from: formatNumber(settings.tiers[index].from) }) : t("priceBetween", { from: formatNumber(settings.tiers[index].from), to: formatNumber(settings.tiers[index].to) }), amount: bucket.amount, rate: formatRate(bucket.rate), commission: bucket.commission })),
    ...(["slow", "digital"] as const).map((key) => ({ key, label: t(`cat.${key}`), sub: t("ownRates"), amount: r.categories[key].amount, rate: formatRate(settings.categoryRates[key]), commission: r.categories[key].commission })),
  ].filter((line) => line.amount !== 0 || line.commission !== 0);
  const adjustments = r.adjustments.filter((item) => item.key !== "lowRate" && item.key !== "oldRate" && item.key !== "collectionShare");
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
        {lines.map((line) => (
          <li key={line.key} className={cn("flex items-baseline gap-2 text-sm", replaced && "opacity-50")}>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{line.label}</span>
              <span dir="ltr" className="text-start text-[11px] text-muted-foreground tabular-nums">
                {formatNumber(line.amount)} {line.rate ? `× ${line.rate}` : ""} · {line.sub}
              </span>
            </span>
            <span aria-hidden className="mb-1 flex-1 border-b border-dotted" />
            <span dir="ltr" className="font-semibold tabular-nums">{formatNumber(line.commission)}</span>
          </li>
        ))}
        <li className={cn("flex items-baseline gap-2 pt-1 text-sm font-semibold", replaced && "opacity-50")}>
          <span>{t("lineCommission")}</span>
          <span aria-hidden className="mb-1 flex-1 border-b border-dotted" />
          <span dir="ltr" className="tabular-nums">{formatNumber(r.base)}</span>
        </li>
      </ul>

      <ul className="flex flex-col gap-2 border-b border-dashed py-3">
        {collectionShare ? <StatementAdjustment item={collectionShare} rules={rules} replaced={false} /> : null}
        {adjustments.map((item) => (
          <StatementAdjustment key={item.key} item={item} rules={rules} replaced={replaced} />
        ))}
        {replaced ? (
          <li className="flex items-baseline gap-2 rounded-lg bg-warning-soft px-2 py-1.5 text-sm text-warning">
            <span>{r.regime === "low" ? tb("lowRate", { rate: rules.lowRate }) : tb("oldRate", { rate: rules.oldRate })}</span>
            <span aria-hidden className="mb-1 flex-1" />
            <span dir="ltr" className="font-semibold tabular-nums">{formatNumber(r.beforeCollection)}</span>
          </li>
        ) : null}
        {!replaced ? (
          <li className="flex items-baseline gap-2 border-t border-dashed pt-2 text-sm">
            <span>{t("beforeCollection")}</span>
            <span aria-hidden className="mb-1 flex-1 border-b border-dotted" />
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
    </div>
  );
}

function StatementAdjustment({ item, rules, replaced }: { item: Adjustment; rules: CommissionSettings["rules"]; replaced: boolean }) {
  const t = useTranslations("cm.build");
  const locale = useLocale() as Locale;
  const earned = item.key === "collectionShare" ? item.applies : item.met && item.applies && !replaced;
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
  return (
    <li className={cn("flex items-start gap-2 text-sm", !earned && "text-muted-foreground")}>
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", earned && (item.amount < 0 ? "text-destructive" : "text-success"))} />
      <span className="flex min-w-0 flex-col">
        <span className={cn(earned && "font-medium text-foreground")}>{label}</span>
        <span className="text-[11px]">{item.met && !item.applies && !replaced ? t("notUnderSystem") : status}</span>
      </span>
      <span aria-hidden className="mb-1 flex-1 self-end border-b border-dotted" />
      <span dir="ltr" className={cn("shrink-0 font-semibold tabular-nums", earned && (item.amount < 0 ? "text-destructive" : "text-success"))}>
        {earned ? `${item.amount > 0 ? "+" : ""}${formatNumber(item.amount)}` : "—"}
      </span>
    </li>
  );
}
