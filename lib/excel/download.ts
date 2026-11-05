"use client";

export type ExcelColumn = { header: string; key: string; width: number };
export type ExcelRow = Record<string, string | number | null>;

export async function downloadExcel(fileName: string, sheetName: string, columns: ExcelColumn[], rows: ExcelRow[]) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Data");

  worksheet.columns = columns;
  worksheet.addRows(rows);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeFileName = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
  link.download = safeFileName.endsWith(".xlsx") ? safeFileName : `${safeFileName}.xlsx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
