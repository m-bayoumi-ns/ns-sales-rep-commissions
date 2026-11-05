"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { Locale } from "@/i18n/routing";
import { formatDay, formatNumber } from "@/lib/format";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

type Point = { day: string; sales: number; collections: number; cash: number };

/**
 * Daily sales (columns, left axis) with the running total and the target pace (lines, right axis):
 * the pace line goes straight from 0 on the 1st to the target on the last day, so the gap between the
 * two lines is how far ahead or behind the rep is. Days still ahead are hatched. Time runs left → right.
 */
export function DailyChart({ points, target, closedOrToday, title, caption }: { points: Point[]; target: number | null; closedOrToday: string; title: string; caption: string }) {
  const t = useTranslations("cm.chart");
  const locale = useLocale() as Locale;
  const config = {
    sales: { label: t("sales"), color: "var(--series-sales)" },
    cumulative: { label: t("cumulative"), color: "var(--series-collected)" },
    pace: { label: t("pace"), color: "var(--muted-foreground)" },
  } satisfies ChartConfig;
  const totals = points.reduce<number[]>((list, point) => [...list, (list[list.length - 1] ?? 0) + (point.day <= closedOrToday ? point.sales : 0)], []);
  const running = totals[totals.length - 1] ?? 0;
  const data = points.map((point, index) => {
    const past = point.day <= closedOrToday;
    return {
      ...point,
      x: index + 1,
      bar: past && point.sales !== 0 ? point.sales : null,
      cumulative: past ? totals[index] : null,
      pace: target ? (target * (index + 1)) / points.length : null,
      past,
    };
  });
  const future = data.filter((point) => !point.past);
  const maxBar = Math.max(1, ...data.map((point) => point.bar ?? 0));
  const maxLine = Math.max(1, target ?? 0, running);

  return (
    <section aria-labelledby="daily-chart-title" className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1.5">
        <h2 id="daily-chart-title" className="text-base font-semibold">
          {title}
        </h2>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: "var(--series-sales)" }} />
            {t("sales")}
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
      <div dir="ltr">
        <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
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
            <XAxis dataKey="x" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={8} />
            <YAxis yAxisId="bar" domain={[0, Math.ceil(maxBar * 1.15)]} tickFormatter={(value: number) => compact.format(value)} tickLine={false} axisLine={false} width={44} />
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
            <Bar yAxisId="bar" dataKey="bar" fill="url(#cm-bar)" radius={[3, 3, 0, 0]} maxBarSize={22} />
            {target ? <Line yAxisId="line" dataKey="pace" stroke="var(--muted-foreground)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} /> : null}
            <Line yAxisId="line" dataKey="cumulative" stroke="var(--series-collected)" strokeWidth={2.5} dot={false} connectNulls={false} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const point = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined;
                if (!point) return null;
                return (
                  <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-w-52 rounded-lg border bg-popover p-3 text-xs shadow-md">
                    <p className="mb-2 font-semibold">{formatDay(point.day, locale)}</p>
                    {point.past ? (
                      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                        <dt className="text-muted-foreground">{t("sales")}</dt>
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
      <p className="text-center text-xs text-muted-foreground">{caption}</p>
    </section>
  );
}
