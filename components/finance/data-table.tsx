"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/routing";
import { EMPTY, formatDayShort, formatMonthShort, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ColumnKind = "text" | "money" | "number" | "percent" | "days" | "date" | "month";
export type Column = {
  key: string;
  label: string;
  kind?: ColumnKind;
  /** Add this column to the totals row (money / number columns). */
  total?: boolean;
  /** Narrow helper text under the header. */
  hint?: string;
  /** Colour the value: "negative" = red when > 0 (overdue), "positive" = green. */
  tone?: "negative" | "positive";
  /** Hidden on small screens. */
  optional?: boolean;
};
export type Row = Record<string, string | number | null>;

const isNumeric = (kind?: ColumnKind) => kind === "money" || kind === "number" || kind === "percent" || kind === "days";

function display(value: Row[string], kind: ColumnKind | undefined, locale: Locale): string {
  if (value == null || value === "") return EMPTY;
  switch (kind) {
    case "money":
    case "number":
      return formatNumber(Number(value));
    case "percent":
      return formatPercent(Number(value));
    case "days":
      return formatNumber(Number(value));
    case "date":
      return formatDayShort(String(value), locale) + " " + String(value).slice(0, 4);
    case "month":
      return formatMonthShort(String(value).slice(0, 7), locale);
    default:
      return String(value);
  }
}

function csvCell(value: Row[string]) {
  const text = value == null ? "" : typeof value === "number" ? String(Math.round(value * 100) / 100) : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Sortable, searchable, paginated table with a totals row and CSV download (Excel-ready, UTF-8 BOM).
 * Numbers are right-aligned and tabular; text follows the reading direction.
 */
export function DataTable({
  columns,
  rows,
  fileName,
  defaultSort,
  pageSize = 15,
  searchable = true,
  totals = false,
  note,
  downloadHref,
  className,
  dense = false,
}: {
  columns: Column[];
  rows: Row[];
  fileName: string;
  defaultSort?: { key: string; direction: "asc" | "desc" };
  pageSize?: number;
  searchable?: boolean;
  totals?: boolean;
  note?: string;
  /** Server CSV with every row (when the table only holds the first rows). */
  downloadHref?: string;
  className?: string;
  dense?: boolean;
}) {
  const t = useTranslations("table");
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((row) => columns.some((column) => !isNumeric(column.kind) && String(row[column.key] ?? "").toLowerCase().includes(q)))
      : rows;
    if (!sort) return list;
    const column = columns.find((item) => item.key === sort.key);
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      if (isNumeric(column?.kind)) return (Number(x) - Number(y)) * factor;
      return String(x).localeCompare(String(y), locale) * factor;
    });
  }, [rows, columns, query, sort, locale]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visibleRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const sums = totals
    ? Object.fromEntries(columns.filter((column) => column.total).map((column) => [column.key, filtered.reduce((sum, row) => sum + (Number(row[column.key]) || 0), 0)]))
    : {};

  const download = () => {
    const lines = [columns.map((column) => csvCell(column.label)).join(","), ...filtered.map((row) => columns.map((column) => csvCell(row[column.key])).join(","))];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((prev) => (prev?.key === key ? { key, direction: prev.direction === "desc" ? "asc" : "desc" } : { key, direction: isNumeric(columns.find((c) => c.key === key)?.kind) ? "desc" : "asc" }));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2" data-no-print>
        {searchable ? (
          <div className="relative min-w-0 flex-1 sm:max-w-72">
            <SearchIcon aria-hidden className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t("search")}
              aria-label={t("search")}
              className="h-9 ps-8"
            />
          </div>
        ) : null}
        <span className="text-xs text-muted-foreground">{t("rows", { count: filtered.length })}</span>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={download}>
            <DownloadIcon aria-hidden />
            {t("csv")}
          </Button>
          {downloadHref ? (
            <a href={downloadHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <DownloadIcon aria-hidden />
              {t("csvAll")}
            </a>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className={cn("w-full border-collapse text-sm", dense && "text-[13px]")}>
          <thead>
            <tr className="fin-head">
              {columns.map((column) => {
                const sorted = sort?.key === column.key ? sort.direction : null;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", isNumeric(column.kind) ? "text-end" : "text-start", column.optional && "hidden md:table-cell")}
                  >
                    <button type="button" onClick={() => toggleSort(column.key)} className={cn("inline-flex items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/60", isNumeric(column.kind) && "flex-row-reverse")}>
                      <span>{column.label}</span>
                      {sorted === "asc" ? <ArrowUpIcon aria-hidden className="size-3.5" /> : sorted === "desc" ? <ArrowDownIcon aria-hidden className="size-3.5" /> : null}
                    </button>
                    {column.hint ? <span className="block text-[11px] font-normal opacity-75">{column.hint}</span> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => (
                <tr key={index} className="border-t transition-colors hover:bg-muted/50">
                  {columns.map((column) => {
                    const value = row[column.key];
                    const numeric = isNumeric(column.kind);
                    const tone =
                      column.tone === "negative" && Number(value) > 0.5
                        ? "text-destructive"
                        : column.tone === "positive" && Number(value) > 0.5
                          ? "text-success"
                          : "";
                    return (
                      <td
                        key={column.key}
                        className={cn("px-3", dense ? "py-1.5" : "py-2", numeric ? "text-end tabular-nums whitespace-nowrap" : "text-start", column.optional && "hidden md:table-cell", tone)}
                        dir={numeric ? "ltr" : undefined}
                      >
                        {numeric ? display(value, column.kind, locale) : <bdi>{display(value, column.kind, locale)}</bdi>}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {totals && filtered.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 bg-muted/60 font-semibold">
                {columns.map((column, index) => (
                  <td key={column.key} className={cn("px-3 py-2", isNumeric(column.kind) ? "text-end tabular-nums" : "text-start", column.optional && "hidden md:table-cell")} dir={isNumeric(column.kind) ? "ltr" : undefined}>
                    {index === 0 ? t("total") : column.total ? formatNumber(sums[column.key]) : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground" data-no-print>
        <span>{note}</span>
        {pages > 1 ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={t("previous")} disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <ChevronLeftIcon aria-hidden className="rtl:-scale-x-100" />
            </Button>
            <span className="tabular-nums" dir="ltr">{t("page", { page: current, pages })}</span>
            <Button variant="ghost" size="icon-sm" aria-label={t("next")} disabled={current >= pages} onClick={() => setPage(current + 1)}>
              <ChevronRightIcon aria-hidden className="rtl:-scale-x-100" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
