"use client";

import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/commissions/view";
import { formatNumber, formatRate } from "@/lib/format";
import { cn } from "@/lib/utils";

const SHOWN = 15;

const BUCKET_STYLE: Record<string, string> = {
  slow: "bg-[color-mix(in_oklab,var(--series-3)_18%,transparent)] text-[color-mix(in_oklab,var(--series-3)_70%,var(--foreground))]",
  digital: "bg-[color-mix(in_oklab,var(--series-7)_18%,transparent)] text-[color-mix(in_oklab,var(--series-7)_70%,var(--foreground))]",
  none: "bg-muted text-muted-foreground",
};

/** Products sold by the rep: quantity, average price after discount, value and the commission each earned. */
export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const t = useTranslations("cm.products");
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? rows.filter((row) => `${row.productName} ${row.code ?? ""} ${row.color ?? ""}`.toLowerCase().includes(text)) : rows;
  }, [rows, query]);
  const shown = all ? filtered : filtered.slice(0, SHOWN);

  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{t("none")}</p>;
  return (
    <div className="flex flex-col gap-3">
      <label className="relative w-full max-w-sm">
        <span className="sr-only">{t("search")}</span>
        <SearchIcon aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          className="h-9 w-full rounded-lg border border-input bg-card ps-8 pe-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </label>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="fin-head text-xs">
              <th className="px-3 py-2 text-start font-semibold">{t("product")}</th>
              <th className="px-3 py-2 text-start font-semibold">{t("color")}</th>
              <th className="px-3 py-2 text-end font-semibold">{t("qty")}</th>
              <th className="px-3 py-2 text-end font-semibold">{t("price")}</th>
              <th className="px-3 py-2 text-end font-semibold">{t("value")}</th>
              <th className="px-3 py-2 text-center font-semibold">{t("bucket")}</th>
              <th className="px-3 py-2 text-end font-semibold">{t("rate")}</th>
              <th className="px-3 py-2 text-end font-semibold">{t("commission")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.key} className="border-t hover:bg-muted/40">
                <td className="max-w-[320px] px-3 py-2">
                  <bdi className="line-clamp-2 font-medium">{row.productName}</bdi>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.color ?? "—"}</td>
                <td dir="ltr" className="px-3 py-2 text-end tabular-nums">
                  {formatNumber(row.qty)} <span className="text-xs text-muted-foreground">{row.uom}</span>
                </td>
                <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{row.avgPrice == null ? "—" : formatNumber(row.avgPrice)}</td>
                <td dir="ltr" className="px-3 py-2 text-end font-medium tabular-nums">{formatNumber(row.amount)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", BUCKET_STYLE[row.bucket] ?? "bg-accent text-accent-foreground")}>
                    {row.bucket === "slow" || row.bucket === "digital" || row.bucket === "none" ? t(`buckets.${row.bucket}`) : t("buckets.range", { key: row.bucket })}
                  </span>
                </td>
                <td dir="ltr" className="px-3 py-2 text-end tabular-nums">{formatRate(row.rate)}</td>
                <td dir="ltr" className="px-3 py-2 text-end font-semibold tabular-nums">{formatNumber(row.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > SHOWN ? (
        <button type="button" onClick={() => setAll((value) => !value)} className="self-center rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted">
          {all ? t("less") : t("more", { count: filtered.length - SHOWN })}
        </button>
      ) : null}
    </div>
  );
}
