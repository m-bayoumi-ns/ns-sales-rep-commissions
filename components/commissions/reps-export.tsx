"use client";

import { useTranslations } from "next-intl";
import { ExcelExportButton } from "@/components/common/excel-export-button";
import type { RepSummary } from "@/lib/commissions/view";

const round = (value: number | null | undefined) => (value == null || !Number.isFinite(value) ? null : Math.round(value * 100) / 100);

/** Excel file of the month's reps and their commission (administrators only). */
export function RepsExport({ reps, month }: { reps: RepSummary[]; month: string }) {
  const t = useTranslations("cm.export");
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
      system: t(`regime.${r.regime}`),
      base: round(r.base),
      beforeCollection: round(r.beforeCollection),
      collectionApplied: round(r.collectionFactor),
      adjustments: round(r.total - r.base),
      total: round(r.total),
      flag: r.belowMinimum ? t("belowMinimum") : rep.minimumRisk ? t("minimumRisk") : "",
    };
  });
  return <ExcelExportButton columns={columns} rows={rows} fileName={`commissions-${month}`} sheetName={month} label={t("button")} errorLabel={t("error")} />;
}
