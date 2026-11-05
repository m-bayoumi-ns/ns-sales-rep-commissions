import { CircleCheckIcon, DatabaseIcon, InfoIcon, UserRoundIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GrowBar } from "@/components/motion/grow-bar";
import type { Locale } from "@/i18n/routing";
import { formatCompactCurrency, formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Page title block, same anatomy as Order Stages. */
export function PageHeading({ title, eyebrow, subtitle }: { title: string; eyebrow: string; subtitle?: string }) {
  return (
    <section aria-labelledby="page-title" className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
      <h1 id="page-title" className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p> : null}
    </section>
  );
}

/** A report block: title, one-line explanation, optional actions, content. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  id,
  reveal = true,
}: {
  /** Fade in on scroll (only for blocks rendered with the page, not ones that appear after a click). */
  reveal?: boolean;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} data-reveal={reveal ? "" : undefined} className={cn("flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- KPI cards
export type KpiTone = "brown" | "violet" | "teal" | "blue" | "red" | "slate";

export const SURFACES: Record<KpiTone, string> = {
  brown: "bg-gradient-to-br from-[#4a2d16] to-[#322313]",
  violet: "bg-gradient-to-br from-[#382351] to-[#281b3e]",
  teal: "bg-gradient-to-br from-[#20433d] to-[#172f2c]",
  blue: "bg-gradient-to-br from-[#243552] to-[#19263c]",
  red: "bg-gradient-to-br from-[#55211f] to-[#351a19]",
  slate: "bg-gradient-to-br from-[#33383f] to-[#23272c]",
};
export const ICONS: Record<KpiTone, string> = {
  brown: "bg-amber-400 text-[#3b2415]",
  violet: "bg-violet-400 text-[#281b3e]",
  teal: "bg-emerald-300 text-[#172f2c]",
  blue: "bg-blue-400 text-[#19263c]",
  red: "bg-red-400 text-[#351a19]",
  slate: "bg-slate-300 text-[#23272c]",
};

export type Kpi = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: KpiTone;
  /** Main figure, already formatted. */
  value: string;
  /** Exact value or context line under the figure. */
  sub?: string;
  /** Change vs the previous period (percentage points or %), with its own sign. */
  delta?: { text: string; good: boolean | null } | null;
  hint?: string;
};

export function KpiGrid({ items, label, columns = 4 }: { items: Kpi[]; label: string; columns?: 3 | 4 | 5 | 6 }) {
  const grid = { 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-6" }[columns];
  return (
    <section aria-label={label} data-reveal className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", grid)}>
      {items.map((item) => (
        <div key={item.key} title={item.hint} className={cn("flex min-w-0 flex-col gap-2 rounded-xl border border-white/10 p-4 text-white shadow-sm", SURFACES[item.tone])}>
          <div className="flex items-center gap-2">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm", ICONS[item.tone])}>
              <item.icon aria-hidden className="size-[17px]" />
            </span>
            <span className="text-[13px] leading-tight font-semibold text-white/90">
              <bdi>{item.label}</bdi>
            </span>
          </div>
          <span dir="ltr" className="text-start text-lg leading-tight font-bold break-words tabular-nums sm:text-2xl">
            {item.value}
          </span>
          {item.sub || item.delta ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/80">
              {item.sub ? <bdi>{item.sub}</bdi> : null}
              {item.delta ? (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-semibold",
                    item.delta.good == null ? "bg-white/15" : item.delta.good ? "bg-emerald-400/25 text-emerald-100" : "bg-red-400/25 text-red-100",
                  )}
                  dir="ltr"
                >
                  {item.delta.text}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      ))}
    </section>
  );
}

/** "+12.4%" change of `now` vs `before` (null when there is no base). */
export function delta(now: number, before: number | null | undefined, higherIsGood = true) {
  if (before == null || before === 0) return null;
  const pct = (100 * (now - before)) / Math.abs(before);
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return { text: `${sign}${formatPercent(Math.abs(pct))}`, good: pct === 0 ? null : (pct > 0) === higherIsGood };
}

export const money = (value: number | null | undefined, locale: Locale) => formatCompactCurrency(value, locale);
export const moneyExact = (value: number | null | undefined, locale: Locale) => formatCurrency(value, locale);

/**
 * An amount with its currency in a smaller, lighter type: "32.48M" + "EGP", "362.03 مليون" + "ج.م".
 * `unit` sizes the currency relative to the number (default 0.6 of it).
 */
/** English amounts sit in left-to-right boxes, so the gaps are on the left (not the "start"). */
const GAP: React.CSSProperties = { marginLeft: "0.25em" };

export function Money({ value, locale, exact = false, unit = "0.6em" }: { value: number | null | undefined; locale: Locale; exact?: boolean; unit?: string }) {
  const text = exact ? formatCurrency(value, locale) : formatCompactCurrency(value, locale);
  // "2.36M EGP" or "2.36 مليون ج.م": number, optional scale word, currency.
  const match = /^(\S+)(?:\s+(.+?))?\s+(EGP|ج\.م)$/.exec(text);
  if (!match) return <>{text}</>;
  if (locale === "ar") {
    // Arabic reads right to left: the number on the right, then "مليون ج.م" in smaller type.
    return (
      <span dir="rtl" className="inline-flex items-baseline gap-[0.3em]">
        <bdi dir="ltr">{match[1]}</bdi>
        <span className="font-semibold opacity-75" style={{ fontSize: unit }}>
          {match[2] ? `${match[2]} ` : ""}
          {match[3]}
        </span>
      </span>
    );
  }
  return (
    <>
      <bdi>{match[1]}</bdi>
      {match[2] ? <bdi style={GAP}>{match[2]}</bdi> : null}
      <bdi className="font-semibold opacity-75" style={{ ...GAP, fontSize: unit }}>
        {match[3]}
      </bdi>
    </>
  );
}



// ---------------------------------------------------------------- ranked bars
export type BarItem = { key: string; label: string; value: number; color?: string; sub?: string; right?: React.ReactNode; rank?: number; /** Replaces the plain label (e.g. a logo + name chip; the label stays the accessible name). */ chip?: React.ReactNode };

/** Ranked horizontal bars: label, bar, value and share — sorted by the caller. */
export function BarList({ items, total, emptyLabel, max }: { items: BarItem[]; total?: number; emptyLabel: string; max?: number }) {
  const top = max ?? Math.max(0, ...items.map((item) => item.value));
  if (!items.length || top <= 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, index) => {
        const width = Math.max(0.5, (100 * Math.max(0, item.value)) / top);
        return (
          <li key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              {item.rank != null ? (
                <span dir="ltr" className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-muted px-1 text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {item.rank}
                </span>
              ) : item.color ? (
                <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} />
              ) : null}
              {item.chip ?? <bdi className="truncate font-medium">{item.label}</bdi>}
              {item.sub ? <span className="hidden truncate text-xs text-muted-foreground sm:inline">{item.sub}</span> : null}
            </span>
            <span className="flex items-baseline gap-2 text-sm tabular-nums" dir="ltr">
              {total ? <span className="text-xs text-muted-foreground">{formatPercent((100 * item.value) / total)}</span> : null}
              <span className="font-semibold">{item.right ?? formatNumber(item.value)}</span>
            </span>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
              <GrowBar width={width} delay={index * 0.04} className="h-full rounded-full" color={item.color ?? "var(--primary)"} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** One 100% bar split into ordered segments (aging, status…), with a legend that carries the numbers. */
export function SegmentBar({
  segments,
  label,
  totalLabel,
}: {
  segments: { key: string; label: string; value: number; color: string }[];
  label: string;
  totalLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={label} className="flex h-4 w-full gap-[2px] overflow-hidden rounded-[4px]">
        {total > 0
          ? segments
              .filter((segment) => segment.value > 0)
              .map((segment) => <div key={segment.key} title={`${segment.label}: ${formatNumber(segment.value)}`} style={{ width: `${(100 * segment.value) / total}%`, background: segment.color }} />)
          : <div className="w-full bg-muted" />}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-7">
        {segments.map((segment) => (
          <li key={segment.key} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: segment.color }} />
              {segment.label}
            </span>
            <span dir="ltr" className="text-start text-sm font-semibold tabular-nums">
              {formatNumber(segment.value)}
            </span>
            <span dir="ltr" className="text-start text-[11px] text-muted-foreground tabular-nums">
              {total > 0 ? formatPercent((100 * segment.value) / total) : "—"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {totalLabel}: <span dir="ltr" className="font-semibold text-foreground tabular-nums">{formatNumber(total)}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- states & status
export function StateCard({ title, body, tone = "default", icon }: { title: string; body: string; tone?: "default" | "error"; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center">
      <span className={cn("flex size-12 items-center justify-center rounded-full", tone === "error" ? "bg-destructive-soft text-destructive" : "bg-muted text-muted-foreground")}>
        {icon ?? <DatabaseIcon aria-hidden />}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function StatusBar({ fetchedAt, locale, fetchedLabel, reportedBy, extra }: { fetchedAt: string; locale: Locale; fetchedLabel: (date: string) => string; reportedBy?: string; extra?: string }) {
  return (
    <ul data-reveal="fade" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <CircleCheckIcon aria-hidden className="size-3.5 text-success" />
        {fetchedLabel(formatDateTime(new Date(fetchedAt), locale))}
      </li>
      {reportedBy ? (
        <li className="flex items-center gap-1.5">
          <UserRoundIcon aria-hidden className="size-3.5" />
          {reportedBy}
        </li>
      ) : null}
      {extra ? (
        <li className="flex items-center gap-1.5">
          <InfoIcon aria-hidden className="size-3.5" />
          {extra}
        </li>
      ) : null}
    </ul>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <InfoIcon aria-hidden className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
