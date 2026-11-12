"use client";

import { useTranslations } from "next-intl";
import { ExcelExportButton } from "@/components/common/excel-export-button";
import type { CommissionRowData, RepSummary } from "@/lib/commissions/view";

const round = (value: number | null | undefined) => (value == null || !Number.isFinite(value) ? null : Math.round(value * 100) / 100);

/** Excel file of the month's reps and their commission (administrators only). */
export function RepsExport({ reps, rowData, month, lowAchievementPct, oldSystemUntilPct }: {
  reps: RepSummary[];
  rowData: CommissionRowData[];
  month: string;
  lowAchievementPct: number;
  oldSystemUntilPct: number;
}) {
  const t = useTranslations("cm.export");
  const regimeLabel = (regime: RepSummary["result"]["regime"]) =>
    regime === "old"
      ? t("regime.old", { low: lowAchievementPct, old: oldSystemUntilPct })
      : t(`regime.${regime}`);
  const categoryOrTierLabel = (row: CommissionRowData) => {
    if (row.category === "slow" || row.category === "digital") return t(`rowData.categories.${row.category}`);
    if (row.category) return row.category;
    if (row.tierName === "range") return t("rowData.tier.range", { key: row.tierKey ?? "—" });
    if (row.tierName === "productThreshold") return t("rowData.tier.productThreshold", { price: row.tierPrice ?? "—" });
    return t(`rowData.tier.${row.tierName}`);
  };
  const columns = [
    { header: t("rep"), key: "rep", width: 30 },
    { header: t("sales"), key: "sales", width: 16 },
    { header: t("target"), key: "target", width: 16 },
    { header: t("targetToDate"), key: "targetToDate", width: 18 },
    { header: t("achievement"), key: "achievement", width: 12 },
    { header: t("slow"), key: "slow", width: 14 },
    { header: t("digital"), key: "digital", width: 14 },
    ...["A", "B", "C"].map((key) => ({ header: t("range", { key }), key: `range${key}`, width: 12 })),
    { header: t("cashShare"), key: "cash", width: 12 },
    { header: t("collections"), key: "collections", width: 16 },
    { header: t("collectionRatio"), key: "collectionRatio", width: 12 },
    { header: t("system"), key: "system", width: 18 },
    { header: t("base"), key: "base", width: 14 },
    { header: t("beforeCollection"), key: "beforeCollection", width: 20 },
    { header: t("collectionApplied"), key: "collectionApplied", width: 18 },
    { header: t("adjustments"), key: "adjustments", width: 14 },
    { header: t("total"), key: "total", width: 14 },
    { header: t("flag"), key: "flag", width: 18 },
  ];
  const rows = reps.map((rep) => {
    const r = rep.result;
    return {
      rep: rep.name,
      sales: round(r.sales),
      target: round(r.totalTarget),
      targetToDate: round(r.totalTargetToDate),
      achievement: round(r.achievement),
      slow: round(r.categories.slow.achievement),
      digital: round(r.categories.digital.achievement),
      ...Object.fromEntries(["A", "B", "C"].map((key, index) => [`range${key}`, round(r.tiers[index]?.achievement)])),
      cash: round(r.cashShare),
      collections: round(r.collections),
      collectionRatio: round(r.collectionRatio),
      system: regimeLabel(r.regime),
      base: round(r.base),
      beforeCollection: round(r.beforeCollection),
      collectionApplied: round(r.collectionFactor),
      adjustments: round(r.total - r.base),
      total: round(r.total),
      flag: r.belowMinimum ? t("belowMinimum") : rep.minimumRisk ? t("minimumRisk") : "",
    };
  });
  const rowDataColumns = [
    { header: t("rowData.date"), key: "date", width: 14 },
    { header: t("rowData.rep"), key: "rep", width: 28 },
    { header: t("rowData.customer"), key: "customer", width: 28 },
    { header: t("rowData.invoice"), key: "invoice", width: 20 },
    { header: t("rowData.product"), key: "product", width: 32 },
    { header: t("rowData.color"), key: "color", width: 20 },
    { header: t("rowData.price"), key: "price", width: 16 },
    { header: t("rowData.priceAfterDiscount"), key: "priceAfterDiscount", width: 20 },
    { header: t("rowData.qty"), key: "qty", width: 14 },
    { header: t("rowData.invoiceAmount"), key: "invoiceAmount", width: 18 },
    { header: t("rowData.commissionRate"), key: "commissionRate", width: 16 },
    { header: t("rowData.commission"), key: "commission", width: 16 },
    { header: t("rowData.system"), key: "system", width: 22 },
    { header: t("rowData.categoryOrTier"), key: "tier", width: 24 },
  ];
  const detailedRows = rowData.map((row) => ({
    date: row.day,
    rep: row.seller,
    customer: row.customer,
    invoice: row.invoice,
    product: row.product,
    color: row.color,
    price: round(row.price),
    priceAfterDiscount: round(row.priceAfterDiscount),
    qty: round(row.qty),
    invoiceAmount: round(row.invoiceAmount),
    commissionRate: round(row.commissionRate),
    commission: round(row.commission),
    system: regimeLabel(row.regime),
    tier: categoryOrTierLabel(row),
  }));
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <ExcelExportButton columns={columns} rows={rows} fileName={`commissions-${month}`} sheetName={month} label={t("button")} errorLabel={t("error")} title={t("title", { month })} />
      <ExcelExportButton columns={rowDataColumns} rows={detailedRows} fileName={`row-data-${month}`} sheetName="Row Data" label={t("rowData.button")} errorLabel={t("error")} title={t("rowData.title", { month })} />
    </div>
  );
}
