"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { Locale } from "@/i18n/routing";
import { formatDay, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Up to this many days of data → one column per day; longer → one column per week (Daily/Weekly switch overrides). */
const DAILY_MAX_DAYS = 15;

type Point = { day: string; sales: number; collections: number; cash: number };
type Grain = "day" | "week";

type Bucket = {
  key: string;
  label: string;
  first: string;
  last: string;
  sales: number;
  cash: number;
  collections: number;
  /** Days of the bucket already recorded. */
  recorded: number;
  days: number;
  /** Month day index (1-based) of the bucket's last day. */
  endIndex: number;
};

/** Days → buckets: one per day, or weeks of the month (1–7, 8–14, 15–21, 22–28, 29–end). */
function bucketize(points: Point[], grain: Grain, asOf: string): Bucket[] {
  const size = grain === "day" ? 1 : 7;
  const out: Bucket[] = [];
  for (let start = 0; start < points.length; start += size) {
    const slice = points.slice(start, start + size);
    const past = slice.filter((point) => point.day <= asOf);
    const firstDay = start + 1;
    const lastDay = start + slice.length;
    out.push({
      key: slice[0].day,
      label: grain === "day" ? String(firstDay) : `${firstDay}–${lastDay}`,
      first: slice[0].day,
      last: slice[slice.length - 1].day,
      sales: past.reduce((sum, point) => sum + point.sales, 0),
      cash: past.reduce((sum, point) => sum + point.cash, 0),
      collections: past.reduce((sum, point) => sum + point.collections, 0),
      recorded: past.length,
      days: slice.length,
      endIndex: lastDay,
    });
  }
  return out;
}

/**
 * Sales by day or by week (columns, left axis) with the running total and the target pace (lines, right axis):
 * the pace line goes straight from 0 on the 1st to the target on the last day, so the gap between the two lines
 * is how far ahead or behind the rep is. Periods still ahead are hatched. Time runs left → right.
 * Up to 15 recorded days it shows days, beyond that weeks; the Daily / Weekly switch changes it.
 */
export function DailyChart({ points, target, closedOrToday }: { points: Point[]; target: number | null; closedOrToday: string; title?: string; caption?: string }) {
  const t = useTranslations("cm.chart");
  const locale = useLocale() as Locale;
  const recordedDays = points.filter((point) => point.day <= closedOrToday).length;
  const [choice, setChoice] = useState<Grain | null>(null);
  const grain: Grain = choice ?? (recordedDays <= DAILY_MAX_DAYS ? "day" : "week");

  const config = {
    sales: { label: t(grain === "day" ? "sales" : "salesWeek"), color: "var(--series-sales)" },
    cumulative: { label: t("cumulative"), color: "var(--series-collected)" },
    pace: { label: t("pace"), color: "var(--muted-foreground)" },
  } satisfies ChartConfig;

  const buckets = bucketize(points, grain, closedOrToday);
  const totals = buckets.reduce<number[]>((list, bucket) => [...list, (list[list.length - 1] ?? 0) + bucket.sales], []);
  const running = totals[totals.length - 1] ?? 0;
  const data = buckets.map((bucket, index) => {
    const past = bucket.recorded > 0;
    return {
      ...bucket,
      x: index + 1,
      bar: past && bucket.sales !== 0 ? bucket.sales : null,
      cumulative: past ? totals[index] : null,
      pace: target ? (target * bucket.endIndex) / points.length : null,
      past,
      partial: past && bucket.recorded < bucket.days,
    };
  });
  const future = data.filter((point) => !point.past);
  const maxBar = Math.max(1, ...data.map((point) => point.bar ?? 0));
  const maxLine = Math.max(1, target ?? 0, running);
  const rangeLabel = (point: (typeof data)[number]) =>
    grain === "day" ? formatDay(point.first, locale) : `${formatDay(point.first, locale)} – ${formatDay(point.last, locale)}`;

  return (
    <section aria-labelledby="daily-chart-title" className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm sm:gap-3 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <h2 id="daily-chart-title" className="text-base font-semibold">
            {t(grain === "day" ? "titleDaily" : "titleWeekly")}
          </h2>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: "var(--series-sales)" }} />
              {t(grain === "day" ? "sales" : "salesWeek")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 rounded" style={{ background: "var(--series-collected)" }} />
              {t("cumulative")}
            </li>
            {target ? (
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" />
                {t("pace")}
              </li>
            ) : null}
          </ul>
        </div>
        <div role="radiogroup" aria-label={t("grain")} className="flex shrink-0 rounded-lg bg-muted p-0.5">
          {(["day", "week"] as Grain[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={grain === value}
              onClick={() => setChoice(value)}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-colors", grain === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t(value === "day" ? "daily" : "weekly")}
            </button>
          ))}
        </div>
      </div>
      <div dir="ltr">
        <ChartContainer config={config} className="aspect-auto h-[200px] w-full sm:h-[300px]">
          <ComposedChart data={data} margin={{ top: 12, right: 4, bottom: 4, left: 4 }} accessibilityLayer>
            <defs>
              <pattern id="cm-future" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border)" strokeWidth="2" />
              </pattern>
              <linearGradient id="cm-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: "color-mix(in oklab, var(--series-sales) 55%, white)" }} stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--series-sales)" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              tickFormatter={(value: number) => data[value - 1]?.label ?? ""}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={grain === "week" ? 0 : "preserveStartEnd"}
              minTickGap={grain === "week" ? 0 : 8}
            />
            <YAxis yAxisId="bar" domain={[Math.min(0, ...data.map((point) => point.bar ?? 0)), Math.ceil(maxBar * 1.15)]} tickFormatter={(value: number) => compact.format(value)} tickLine={false} axisLine={false} width={44} />
            <YAxis yAxisId="line" orientation="right" domain={[0, Math.ceil(maxLine * 1.05)]} tickFormatter={(value: number) => compact.format(value)} tickLine={false} axisLine={false} width={48} />
            {future.length ? (
              <ReferenceArea
                yAxisId="bar"
                x1={future[0].x}
                x2={future[future.length - 1].x}
                fill="url(#cm-future)"
                fillOpacity={1}
                label={{ value: t("ahead"), position: "insideTop", fontSize: 11, fill: "var(--muted-foreground)" }}
              />
            ) : null}
            <Bar yAxisId="bar" dataKey="bar" fill="url(#cm-bar)" radius={[3, 3, 0, 0]} maxBarSize={grain === "week" ? 56 : 22} />
            {target ? <Line yAxisId="line" dataKey="pace" stroke="var(--muted-foreground)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} /> : null}
            <Line yAxisId="line" dataKey="cumulative" stroke="var(--series-collected)" strokeWidth={2.5} dot={grain === "week" ? { r: 3 } : false} connectNulls={false} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const point = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined;
                if (!point) return null;
                return (
                  <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-w-52 rounded-lg border bg-popover p-3 text-xs shadow-md">
                    <p className="mb-2 font-semibold">{rangeLabel(point)}</p>
                    {point.past ? (
                      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                        <dt className="text-muted-foreground">{t(grain === "day" ? "sales" : "salesWeek")}</dt>
                        <dd className="text-end font-semibold tabular-nums">{formatNumber(point.sales)}</dd>
                        <dt className="text-muted-foreground">{t("cash")}</dt>
                        <dd className="text-end tabular-nums">{formatNumber(point.cash)}</dd>
                        <dt className="text-muted-foreground">{t("collections")}</dt>
                        <dd className="text-end tabular-nums">{formatNumber(point.collections)}</dd>
                        <dt className="text-muted-foreground">{t("cumulative")}</dt>
                        <dd className="text-end font-semibold tabular-nums">{formatNumber(point.cumulative)}</dd>
                        {point.pace != null ? (
                          <>
                            <dt className="text-muted-foreground">{t("pace")}</dt>
                            <dd className="text-end tabular-nums">{formatNumber(point.pace)}</dd>
                          </>
                        ) : null}
                        {point.partial ? <dd className="col-span-2 pt-1 text-muted-foreground">{t("partialWeek", { days: point.recorded, total: point.days })}</dd> : null}
                      </dl>
                    ) : (
                      <p className="text-muted-foreground">{t("ahead")}</p>
                    )}
                  </div>
                );
              }}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
      <p className="text-center text-xs text-muted-foreground">{t(grain === "day" ? "captionDaily" : "captionWeekly")}</p>
    </section>
  );
}
