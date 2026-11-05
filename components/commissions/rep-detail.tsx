import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BadgeCheckIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  FlagIcon,
  LightbulbIcon,
  ReceiptTextIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BarList, Money, Note, Section, SURFACES } from "@/components/finance/report-ui";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Adjustment, Regime } from "@/lib/commissions/engine";
import type { Category, CommissionSettings } from "@/lib/commissions/schema";
import type { CommissionsView, RepDetail as Detail } from "@/lib/commissions/view";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent, formatRate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DailyChart } from "./daily-chart";
import { ProductsTable } from "./products-table";
import { ProgressRing } from "./progress";

const REGIME_STYLE: Record<Regime, string> = {
  full: "bg-success-soft text-success",
  old: "bg-warning-soft text-warning",
  low: "bg-destructive-soft text-destructive",
  noTarget: "bg-muted text-muted-foreground",
};

export function RegimeBadge({ regime, className }: { regime: Regime; className?: string }) {
  const t = useTranslations("cm.regime");
  return <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", REGIME_STYLE[regime], className)}>{t(regime)}</span>;
}

function categoryValue(value: number | null, unit: "qty" | "amount", locale: Locale, uomLabel: string) {
  if (value == null) return "—";
  return unit === "amount" ? formatCurrency(value, locale) : `${formatNumber(value)} ${uomLabel}`;
}

export function RepDetail({ view, detail, locale, showBack }: { view: CommissionsView; detail: Detail; locale: Locale; showBack: boolean }) {
  const t = useTranslations("cm");
  const { rep } = detail;
  const r = rep.result;
  const { rules } = view.settings;
  const closed = view.clock.closed;
  const flagged = r.belowMinimum || rep.minimumRisk;
  const uom = t("units.qty");

  return (
    <div className="flex flex-col gap-5">
      {showBack ? (
        <Link href={{ pathname: "/commissions", query: { month: view.clock.month, rep: "all" } }} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
          {t("detail.back")}
        </Link>
      ) : null}

      {/* Hero: who, what they earn now, under which system. */}
      <section data-reveal className={cn("relative overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-sm sm:p-6", SURFACES.brown)}>
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">{t("detail.eyebrow")}</p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              <bdi>{rep.name}</bdi>
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
              <RegimeBadge regime={r.regime} className="bg-white/15 text-white" />
              <span>{t("detail.invoices", { count: rep.invoices })}</span>
              <span aria-hidden>·</span>
              <span>{t("detail.customers", { count: rep.customers })}</span>
              {rep.odooName && rep.odooName !== rep.name ? (
                <>
                  <span aria-hidden>·</span>
                  <bdi className="text-white/60">{rep.odooName}</bdi>
                </>
              ) : null}
            </div>
            <p className="max-w-xl text-sm text-white/80">{t(`regimeHelp.${r.regime}`, { low: rules.lowAchievementPct, old: rules.oldSystemUntilPct, rate: rules.lowRate })}</p>
          </div>
          <div className="flex flex-col gap-1 lg:items-end">
            <span className="text-sm text-white/75">{t(closed ? "detail.commissionFinal" : "detail.commissionNow")}</span>
            <span dir="ltr" className="text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
              <Money value={r.total} locale={locale} exact />
            </span>
            {!closed && r.base > 0 ? <span className="text-xs text-white/70">{t("detail.updatesLive")}</span> : null}
          </div>
        </div>
      </section>

      {flagged ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive-soft p-3 text-sm text-destructive">
          <FlagIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {r.belowMinimum
              ? t("flags.belowMinimumLong", { amount: formatCurrency(rules.minimumSales, locale), sales: formatCurrency(r.sales, locale) })
              : t("flags.minimumRiskLong", { amount: formatCurrency(rules.minimumSales, locale), projected: formatCurrency(rep.projectedSales, locale) })}
          </span>
        </div>
      ) : null}

      {/* Targets */}
      <Section title={t("detail.targetsTitle")} description={t(closed ? "detail.targetsClosed" : "detail.targetsDescription")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ProgressRing
            value={r.achievement}
            projected={closed ? null : rep.projectedAchievement}
            size={140}
            stroke={12}
            label={t(closed ? "detail.totalTarget" : "detail.totalTargetToDate")}
            sub={
              <span dir="ltr" className="tabular-nums">
                {formatCompactCurrency(r.sales, locale)} / {r.totalTargetToDate ? formatCompactCurrency(r.totalTargetToDate, locale) : "—"}
              </span>
            }
          />
          {(["slow", "digital"] as Category[]).map((key) => {
            const c = r.categories[key];
            return (
              <ProgressRing
                key={key}
                value={c.achievement}
                size={140}
                stroke={12}
                label={t(`categories.${key}`)}
                sub={
                  <span dir="ltr" className="tabular-nums">
                    {categoryValue(c.achieved, c.unit, locale, uom)} / {categoryValue(c.targetToDate, c.unit, locale, uom)}
                  </span>
                }
              />
            );
          })}
        </div>
        {!closed && r.totalTarget ? (
          <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-3">
            <Stat label={t("detail.projected")} value={formatCurrency(rep.projectedSales, locale)} sub={formatPercent(rep.projectedAchievement)} />
            <Stat label={t("detail.left")} value={formatCurrency(Math.max(0, r.totalTarget - r.sales), locale)} />
            <Stat label={t("detail.perDay")} value={rep.perDayToTarget ? formatCurrency(rep.perDayToTarget, locale) : t("detail.reached")} sub={t("detail.daysLeft", { days: view.clock.remainingDays })} />
          </div>
        ) : null}
      </Section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <BuildUp view={view} detail={detail} locale={locale} />
        <NextSteps view={view} detail={detail} locale={locale} />
      </div>

      <DailyChart
        points={detail.daily}
        target={r.totalTarget}
        closedOrToday={view.clock.asOf}
        title={t("chart.title")}
        caption={t("chart.caption")}
      />

      <Section title={t("tiers.title")} description={t("tiers.description")}>
        <TierTable settings={view.settings} detail={detail} locale={locale} />
      </Section>

      <Section title={t("products.title")} description={t("products.description")}>
        <ProductsTable rows={detail.products} />
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={t("collections.title")} description={t("collections.description")}>
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<WalletIcon aria-hidden className="size-4" />} label={t("collections.total")} value={formatCurrency(r.collections, locale)} sub={t("collections.ofSales", { pct: formatPercent(r.collectionRatio) })} />
            <Stat
              icon={<ReceiptTextIcon aria-hidden className="size-4" />}
              label={t("collections.receivables")}
              value={rep.receivables == null ? "—" : formatCurrency(rep.receivables, locale)}
              sub={closed ? t("collections.receivablesClosed") : t("collections.receivablesSub")}
            />
          </div>
          <BarList
            emptyLabel={t("collections.none")}
            items={[
              { key: "payment", label: t("collections.payment"), value: detail.collections.payment, color: "var(--series-1)", right: formatNumber(detail.collections.payment) },
              { key: "cheque", label: t("collections.cheque"), value: detail.collections.cheque, color: "var(--series-8)", right: formatNumber(detail.collections.cheque) },
              { key: "manual", label: t("collections.manual"), value: detail.collections.manual, color: "var(--series-4)", right: formatNumber(detail.collections.manual) },
              { key: "refund", label: t("collections.refund"), value: Math.abs(detail.collections.refund), color: "var(--series-other)", right: `−${formatNumber(Math.abs(detail.collections.refund))}` },
            ].filter((item) => item.value > 0)}
          />
        </Section>
        <Section title={t("customers.title")} description={t("customers.description")}>
          <BarList
            emptyLabel={t("customers.none")}
            items={detail.customers.map((customer, index) => ({
              key: `${index}`,
              label: customer.name,
              value: customer.amount,
              rank: index + 1,
              sub: t("detail.invoices", { count: customer.invoices }),
              right: formatNumber(customer.amount),
            }))}
          />
          <Note>{t("customers.note")}</Note>
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-card p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span dir="ltr" className="text-start text-base font-bold tabular-nums">
        {value}
      </span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}

// ---------------------------------------------------------------- commission build-up
function BuildUp({ view, detail, locale }: { view: CommissionsView; detail: Detail; locale: Locale }) {
  const t = useTranslations("cm.build");
  const r = detail.rep.result;
  const { rules } = view.settings;
  const replaced = r.regime === "low" || (r.regime === "old" && rules.oldSystemMode === "rate");
  const items = r.adjustments.filter((item) => item.key !== "lowRate" && item.key !== "oldRate" && item.key !== "collectionShare");
  const collectionShare = r.adjustments.find((item) => item.key === "collectionShare");
  return (
    <Section title={t("title")} description={t("description")}>
      <ol className="flex flex-col divide-y rounded-lg border">
        <li className={cn("flex items-center justify-between gap-3 p-3", replaced && "opacity-50")}>
          <span className="flex items-center gap-2 text-sm font-medium">
            <SparklesIcon aria-hidden className="size-4 text-primary" />
            {t("base")}
          </span>
          <span dir="ltr" className="font-semibold tabular-nums">
            {formatCurrency(r.base, locale)}
          </span>
        </li>
        {collectionShare ? <AdjustmentRow item={collectionShare} rules={rules} locale={locale} replaced={false} /> : null}
        {items.map((item) => (
          <AdjustmentRow key={item.key} item={item} rules={rules} locale={locale} replaced={replaced} />
        ))}
        {replaced ? (
          <li className="flex items-center justify-between gap-3 bg-warning-soft p-3 text-warning">
            <span className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangleIcon aria-hidden className="size-4" />
              {r.regime === "low" ? t("lowRate", { rate: rules.lowRate }) : t("oldRate", { rate: rules.oldRate })}
            </span>
            <span dir="ltr" className="font-semibold tabular-nums">
              {formatCurrency(r.beforeCollection, locale)}
            </span>
          </li>
        ) : null}
        {!replaced ? (
          <li className="flex items-center justify-between gap-3 border-t border-dashed p-3">
            <span className="text-sm font-medium">{t("beforeCollection")}</span>
            <span dir="ltr" className="font-semibold tabular-nums">{formatCurrency(r.beforeCollection, locale)}</span>
          </li>
        ) : null}
        <li className="flex items-center justify-between gap-3 bg-muted/60 p-3">
          <span className="text-sm font-bold">{t("total")}</span>
          <span dir="ltr" className="text-lg font-extrabold text-success tabular-nums">
            {formatCurrency(r.total, locale)}
          </span>
        </li>
      </ol>
      {r.regime === "old" && rules.oldSystemMode === "base" ? <Note>{t("oldNote", { low: rules.lowAchievementPct, old: rules.oldSystemUntilPct })}</Note> : null}
    </Section>
  );
}

function AdjustmentRow({ item, rules, locale, replaced }: { item: Adjustment; rules: CommissionSettings["rules"]; locale: Locale; replaced: boolean }) {
  const t = useTranslations("cm.build");
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
    <li className={cn("flex items-center justify-between gap-3 p-3", !earned && "text-muted-foreground")}>
      <span className="flex min-w-0 items-start gap-2">
        <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", earned ? (item.amount < 0 ? "text-destructive" : "text-success") : "")} />
        <span className="flex min-w-0 flex-col">
          <span className={cn("text-sm", earned && "font-medium text-foreground")}>{label}</span>
          <span className="text-xs">{item.met && !item.applies && !replaced ? t("notUnderSystem") : status}</span>
        </span>
      </span>
      <span dir="ltr" className={cn("shrink-0 font-semibold tabular-nums", earned && (item.amount < 0 ? "text-destructive" : "text-success"))}>
        {earned ? `${item.amount > 0 ? "+" : ""}${formatNumber(item.amount)}` : "—"}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------- what to do next
function NextSteps({ view, detail, locale }: { view: CommissionsView; detail: Detail; locale: Locale }) {
  const t = useTranslations("cm.next");
  const r = detail.rep.result;
  const { rules } = view.settings;
  const money = (value: number) => formatCurrency(Math.ceil(value), locale);
  const tips: { key: string; text: string; tone: "good" | "todo" | "warn" }[] = [];
  const target = r.totalTargetToDate;
  if (target) {
    if (r.regime === "low") tips.push({ key: "low", tone: "warn", text: t("toOld", { amount: money((target * rules.lowAchievementPct) / 100 - r.sales), pct: rules.lowAchievementPct }) });
    if (r.regime === "low" || r.regime === "old") tips.push({ key: "full", tone: "todo", text: t("toFull", { amount: money((target * rules.oldSystemUntilPct) / 100 - r.sales), pct: rules.oldSystemUntilPct }) });
    if (r.sales < target) tips.push({ key: "target", tone: "todo", text: t("toTarget", { amount: money(target - r.sales), pct: rules.allTargetsBonusPct }) });
  } else tips.push({ key: "noTarget", tone: "warn", text: t("noTarget") });
  const uom = t("qtyUnit");
  for (const key of ["slow", "digital"] as const) {
    const c = r.categories[key];
    if (!c.targetToDate || c.achieved >= c.targetToDate) continue;
    const gap = c.targetToDate - c.achieved;
    tips.push({ key, tone: "todo", text: t("category", { name: t(`cat.${key}`), gap: c.unit === "amount" ? money(gap) : `${formatNumber(Math.ceil(gap))} ${uom}` }) });
  }
  const slow = r.categories.slow;
  if (slow.targetToDate && slow.achievement != null && slow.achievement < rules.slowMinPct) {
    const need = (slow.targetToDate * rules.slowMinPct) / 100 - slow.achieved;
    tips.push({ key: "slowMin", tone: "warn", text: t("slowMin", { gap: slow.unit === "amount" ? money(need) : `${formatNumber(Math.ceil(need))} ${uom}`, pct: rules.slowDeductionPct, min: rules.slowMinPct }) });
  }
  if (r.sales > 0) {
    if ((r.cashShare ?? 0) < rules.cashSharePct) tips.push({ key: "cash", tone: "todo", text: t("cash", { pct: formatPercent(r.cashShare), need: rules.cashSharePct, bonus: formatNumber(rules.cashBonus) }) });
    const collectNeed = (r.sales * rules.collectionPct) / 100 - r.collections;
    if (collectNeed >= 0) tips.push({ key: "collect", tone: "todo", text: t("collect", { amount: money(collectNeed + 1), bonus: formatNumber(rules.collectionBonus) }) });
  }
  const ladder = r.adjustments.find((item) => item.key === "salesLadder");
  if (ladder?.threshold) tips.push({ key: "ladder", tone: "todo", text: t("ladder", { amount: money(ladder.threshold - r.sales), at: formatCompactCurrency(ladder.threshold, locale) }) });
  if (r.allTargetsMet) tips.unshift({ key: "great", tone: "good", text: t("allMet", { pct: rules.allTargetsBonusPct }) });
  return (
    <Section title={t("title")} description={t("description")}>
      {tips.length ? (
        <ul className="flex flex-col gap-2">
          {tips.map((tip) => (
            <li
              key={tip.key}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                tip.tone === "good" && "border-success/30 bg-success-soft text-success",
                tip.tone === "warn" && "border-warning/30 bg-warning-soft text-warning",
              )}
            >
              <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("none")}</p>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- by range / category
function TierTable({ settings, detail, locale }: { settings: CommissionSettings; detail: Detail; locale: Locale }) {
  const t = useTranslations("cm.tiers");
  const r = detail.rep.result;
  const range = (from: number, to: number | null) => (to == null ? t("from", { from: formatNumber(from) }) : t("between", { from: formatNumber(from), to: formatNumber(to) }));
  const rows = [
    ...r.tiers.map((bucket, index) => ({ ...bucket, label: t("range", { key: bucket.key }), sub: range(settings.tiers[index].from, settings.tiers[index].to), rate: settings.tiers[index].rate as number | null })),
    ...(["slow", "digital"] as const).map((key) => ({ ...r.categories[key], key, label: t(`cat.${key}`), sub: t("productRates"), rate: null as number | null })),
    ...(r.unpriced.amount ? [{ ...r.unpriced, key: "none", label: t("none"), sub: t("noneSub") }] : []),
  ];
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="fin-head text-xs">
            <th className="px-3 py-2 text-start font-semibold">{t("bucket")}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("qty")}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("sales")}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("share")}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("rate")}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("commission")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t hover:bg-muted/40">
              <td className="px-3 py-2">
                <span className="block font-medium">{row.label}</span>
                <span className="block text-xs text-muted-foreground">{row.sub}</span>
              </td>
              <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{formatNumber(row.qty)}</td>
              <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{formatNumber(row.amount)}</td>
              <td dir="ltr" className="px-3 py-2 text-end text-muted-foreground tabular-nums">{r.sales ? formatPercent((100 * row.amount) / r.sales) : "—"}</td>
              <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{row.rate == null ? "—" : formatRate(row.rate)}</td>
              <td dir="ltr" className="px-3 py-2 text-end font-semibold tabular-nums">{formatNumber(row.commission)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/50 font-semibold">
            <td className="px-3 py-2">{t("total")}</td>
            <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{formatNumber(r.qty)}</td>
            <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{formatCurrency(r.sales, locale)}</td>
            <td />
            <td />
            <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{formatCurrency(r.base, locale)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
