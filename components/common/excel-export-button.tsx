"use client";

import { FileSpreadsheetIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, type ExcelColumn, type ExcelRow } from "@/lib/excel/download";

export function ExcelExportButton({
  columns,
  rows,
  fileName,
  sheetName,
  label,
  errorLabel,
}: {
  columns: ExcelColumn[];
  rows: ExcelRow[];
  fileName: string;
  sheetName: string;
  label: string;
  errorLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const exportRows = async () => {
    setPending(true);
    setError(false);
    try {
      await downloadExcel(fileName, sheetName, columns, rows);
    } catch (reason) {
      console.error("[excel-export] failed to create workbook:", reason);
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button type="button" onClick={exportRows} disabled={pending || rows.length === 0} className="bg-emerald-700 text-white hover:bg-emerald-800">
        <FileSpreadsheetIcon aria-hidden />
        {pending ? `${label}…` : label}
      </Button>
      {error ? <span role="alert" className="text-xs text-destructive">{errorLabel}</span> : null}
    </span>
  );
}
