"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ColumnSeries = { key: string; name: string; color: string };
export type ColumnDatum = { key: string; label: string; tooltipLabel?: string; values: Record<string, number> };

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Rounded "nice" tick step for an axis that should reach `max` in ~4 steps. */
function niceStep(max: number) {
  if (max <= 0) return 1;
  const raw = max / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power;
}

/**
 * Vertical columns per period: grouped (side by side) or stacked. One y-axis, starting at zero.
 * Hover / focus a period to see every value; the same numbers are always in the table below the chart.
 */
export function ColumnChart({
  data,
  series,
  stacked = false,
  height = 260,
  ariaLabel,
  totalLabel,
  emptyLabel,
}: {
  data: ColumnDatum[];
  series: ColumnSeries[];
  stacked?: boolean;
  height?: number;
  ariaLabel: string;
  /** Stacked charts: label of the total line in the tooltip. */
  totalLabel?: string;
  emptyLabel?: string;
}) {
  const locale = useLocale() as Locale;
  // Time always runs left to right (earliest day on the left), in Arabic too.
  const rtl = false;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const totals = data.map((datum) => series.reduce((sum, item) => sum + Math.max(0, datum.values[item.key] ?? 0), 0));
  const max = stacked ? Math.max(0, ...totals) : Math.max(0, ...data.flatMap((datum) => series.map((item) => datum.values[item.key] ?? 0)));
  const step = niceStep(max);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = useMemo(() => Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step), [top, step]);

  const padTop = 12;
  const padBottom = 28;
  const axisWidth = 48;
  const plotWidth = width - axisWidth - 8;
  const plotHeight = height - padTop - padBottom;
  const slot = data.length ? plotWidth / data.length : plotWidth;
  const groupWidth = Math.min(slot * 0.72, stacked ? 56 : 28 * series.length + 8);
  const barWidth = stacked ? groupWidth : Math.max(4, (groupWidth - 2 * (series.length - 1)) / series.length);
  const y = (value: number) => padTop + plotHeight - (Math.max(0, value) / top) * plotHeight;
  // In Arabic the time axis runs right-to-left, like the text.
  const slotX = (index: number) => {
    const i = rtl ? data.length - 1 - index : index;
    return (rtl ? 8 : axisWidth) + i * slot;
  };
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.floor(plotWidth / 56)));

  if (!data.length || max <= 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  const activeDatum = active != null ? data[active] : null;
  const tooltipLeft = active != null ? Math.min(Math.max(slotX(active) + slot / 2, 90), width - 90) : 0;

  return (
    <div ref={ref} dir="ltr" className="relative w-full select-none" onMouseLeave={() => setActive(null)}>
      <svg role="img" aria-label={ariaLabel} width={width} height={height} className="block overflow-visible">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={rtl ? 8 : axisWidth} x2={rtl ? width - axisWidth : width - 8} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" strokeWidth={1} />
            <text
              x={rtl ? width - axisWidth + 6 : axisWidth - 6}
              y={y(tick)}
              dy="0.32em"
              textAnchor={rtl ? "start" : "end"}
              className="fill-muted-foreground text-[11px] tabular-nums"
              direction="ltr"
            >
              {compact.format(tick)}
            </text>
          </g>
        ))}
        {data.map((datum, index) => {
          const x0 = slotX(index) + (slot - groupWidth) / 2;
          let stackBase = 0;
          const dim = active != null && active !== index;
          return (
            <g key={datum.key} opacity={dim ? 0.45 : 1} className="transition-opacity">
              {series.map((item, s) => {
                const value = Math.max(0, datum.values[item.key] ?? 0);
                if (value <= 0) return null;
                let x: number;
                let yTop: number;
                let h: number;
                if (stacked) {
                  x = x0;
                  yTop = y(stackBase + value);
                  h = y(stackBase) - yTop;
                  stackBase += value;
                  // 2px surface gap between stacked segments (taken off the top of each lower segment).
                  if (stackBase < totals[index] - 1e-6 && h > 2) {
                    yTop += 2;
                    h -= 2;
                  }
                } else {
                  const order = rtl ? series.length - 1 - s : s;
                  x = x0 + order * (barWidth + 2);
                  yTop = y(value);
                  h = y(0) - yTop;
                }
                const isTop = !stacked || Math.abs(stackBase - totals[index]) < 1e-6;
                const r = isTop ? Math.min(4, barWidth / 2, h) : 0;
                return (
                  <path
                    key={item.key}
                    d={`M${x},${yTop + h} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barWidth - r} Q${x + barWidth},${yTop} ${x + barWidth},${yTop + r} V${yTop + h} Z`}
                    fill={item.color}
                  />
                );
              })}
            </g>
          );
        })}
        <line x1={rtl ? 8 : axisWidth} x2={rtl ? width - axisWidth : width - 8} y1={y(0)} y2={y(0)} stroke="var(--chart-axis)" strokeWidth={1} />
        {data.map((datum, index) =>
          index % labelEvery === 0 ? (
            <text key={datum.key} x={slotX(index) + slot / 2} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {datum.label}
            </text>
          ) : null,
        )}
        {/* Hit targets: the whole period column, larger than the bars. */}
        {data.map((datum, index) => (
          <rect
            key={datum.key}
            x={slotX(index)}
            y={padTop}
            width={slot}
            height={plotHeight}
            fill="transparent"
            tabIndex={0}
            aria-label={`${datum.tooltipLabel ?? datum.label}: ${series.map((item) => `${item.name} ${formatNumber(datum.values[item.key] ?? 0)}`).join(", ")}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            className="cursor-default outline-none focus-visible:stroke-ring"
          />
        ))}
      </svg>
      {activeDatum ? (
        <div
          role="tooltip"
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="pointer-events-none absolute top-0 z-10 min-w-40 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
          style={{ left: tooltipLeft }}
        >
          <p className="mb-1 font-semibold">{activeDatum.tooltipLabel ?? activeDatum.label}</p>
          <ul className="flex flex-col gap-0.5">
            {series.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span dir="ltr" className="font-medium tabular-nums">
                  {formatNumber(activeDatum.values[item.key] ?? 0)}
                </span>
              </li>
            ))}
            {stacked && totalLabel ? (
              <li className="mt-1 flex items-center justify-between gap-4 border-t pt-1 font-semibold">
                <span>{totalLabel}</span>
                <span dir="ltr" className="tabular-nums">
                  {formatNumber(series.reduce((sum, item) => sum + (activeDatum.values[item.key] ?? 0), 0))}
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Legend row: swatch + name (always shown for 2+ series, so identity never relies on colour alone). */
export function ChartLegend({ series, className }: { series: { name: string; color: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {series.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
