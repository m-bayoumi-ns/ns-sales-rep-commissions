"use client";

export type ExcelColumn = { header: string; key: string; width: number };
export type ExcelRow = Record<string, string | number | null>;

export async function downloadExcel(fileName: string, sheetName: string, columns: ExcelColumn[], rows: ExcelRow[], title?: string) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Data");

  worksheet.columns = columns;
  if (title) {
    worksheet.insertRow(1, [title]);
    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.getRow(1).height = 34;
    worksheet.getCell(1, 1).font = { name: "Aptos Display", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A2D16" } };
    worksheet.getCell(1, 1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  }
  worksheet.addRows(rows);
  const headerRow = title ? 2 : 1;
  const header = worksheet.getRow(headerRow);
  header.height = 36;
  header.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF76502F" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.eachCell((cell) => {
    cell.border = { bottom: { style: "medium", color: { argb: "FFC49A6C" } } };
  });

  const percentColumns = new Set(["achievement", "slow", "digital", "rangeA", "rangeB", "rangeC", "cash", "collectionRatio", "collectionApplied", "commissionRate"]);
  for (let rowNumber = headerRow + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.height = 24;
    row.eachCell((cell, columnNumber) => {
      const key = columns[columnNumber - 1]?.key;
      const isNumeric = typeof cell.value === "number";
      cell.font = { name: "Aptos", size: 10, color: { argb: "FF29231E" } };
      cell.alignment = { vertical: "middle", horizontal: isNumeric ? "right" : "left", wrapText: key === "flag" || key === "system" };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE8E1D9" } } };
      if (rowNumber % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF8F5" } };
      }
      if (isNumeric) {
        cell.numFmt = key && percentColumns.has(key) ? '0.0"%"' : '#,##0.00;[Red](#,##0.00);-';
      }
    });
  }

  worksheet.views = [{ state: "frozen", xSplit: 1, ySplit: headerRow, showGridLines: false }];
  worksheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: worksheet.rowCount, column: columns.length },
  };
  worksheet.properties.defaultRowHeight = 24;

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
