import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseTargetWorkbook } from "@/lib/commissions/storage";
import { hasConfiguredTargets, monthReps } from "@/lib/commissions/view";
import { defaultSettings } from "@/lib/commissions/schema";

describe("target Excel sheet", () => {
  it("only treats positive target values as a configured month target", () => {
    expect(hasConfiguredTargets([{
      name: "Rep",
      totalTarget: null,
      slowTarget: 0,
      digitalTarget: null,
      rangeTargets: [null, 0],
    }])).toBe(false);
    expect(hasConfiguredTargets([{
      name: "Rep",
      totalTarget: null,
      slowTarget: null,
      digitalTarget: null,
      rangeTargets: [null, 125],
    }])).toBe(true);
  });

  it("reads the target template columns and values", () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Targets");
    sheet.addRow(["Sales Rep", "Sales Rep U2", "Sales Target | TOTAL", "Range A", "Range B", "Range C", "Slow-moving", "Digital"]);
    sheet.addRow(["NSR305_أحمد عادل شحاته", "", 8_000_000, 3_500_000, 900_000, 5_000_000, 500_000, 100_000]);
    const commissionSheet = workbook.addWorksheet("Product commission");
    commissionSheet.addRow(["Categories", "Product Name", "Price", "Commission"]);
    commissionSheet.addRow(["Slow-moving", "Slow Fabric", 100, 0.05]);
    commissionSheet.getCell("D2").numFmt = "0.00%";
    commissionSheet.addRow(["Digital", "Digital Service", "Any price", 3]);
    commissionSheet.addRow(["NS", "Rabbit", 130, 1]);

    const result = parseTargetWorkbook(workbook, "Wholesales_Target/target_2026_11.xlsx");

    expect(result.columns).toEqual({
      rep: "Sales Rep",
      total: "Sales Target | TOTAL",
      slow: "Slow-moving",
      digital: "Digital",
      ranges: ["Range A", "Range B", "Range C"],
    });
    expect(result.reps).toEqual([{
      name: "NSR305_أحمد عادل شحاته",
      totalTarget: 8_000_000,
      slowTarget: 500_000,
      digitalTarget: 100_000,
      rangeTargets: [3_500_000, 900_000, 5_000_000],
    }]);
    expect(result.productCommission.found).toBe(true);
    expect(result.productCommission.columns).toEqual({ category: "Categories", productName: "Product Name", price: "Price", commission: "Commission" });
    expect(result.productCommission.rows).toMatchObject([
      { categoryKey: "slow", productName: "Slow Fabric", price: 100, anyPrice: false, commission: 5, valid: true },
      { categoryKey: "digital", productName: "Digital Service", price: null, anyPrice: true, commission: 3, valid: true },
      { category: "NS", categoryKey: null, productName: "Rabbit", price: 130, commission: 1, valid: true },
    ]);
  });

  it("uses Excel target values instead of legacy targets from monthly settings", () => {
    const row = {
      name: "NSR305_أحمد عادل شحاته",
      totalTarget: 8_000_000,
      slowTarget: 500_000,
      digitalTarget: 100_000,
      rangeTargets: [3_500_000, 900_000, 5_000_000],
    };
    const stored = {
      settings: {
        ...defaultSettings("2026-11"),
        reps: [{
          name: row.name,
          odooUserId: 305,
          totalTarget: 1,
          slowTarget: 2,
          digitalTarget: 3,
          rangeTargets: [4, 5, 6],
        }],
      },
      source: "saved",
      inheritedFrom: null,
    } as Parameters<typeof monthReps>[0];

    const result = monthReps(
      stored,
      {
        found: true,
        path: "target.xlsx",
        reps: [row],
        columns: { rep: "Sales Rep", total: "Sales Target | TOTAL", slow: "Slow-moving", digital: "Digital", ranges: ["Range A", "Range B", "Range C"] },
        productCommission: { found: false, columns: { category: null, productName: null, price: null, commission: null }, rows: [] },
      },
      [{ id: 305, name: "NSR305_أحمد عادل شحاته", sales: 0 }],
      new Map(),
    );

    expect(result[0]).toMatchObject({
      totalTarget: 8_000_000,
      slowTarget: 500_000,
      digitalTarget: 100_000,
      rangeTargets: [3_500_000, 900_000, 5_000_000],
      odooUserId: 305,
    });
  });
});
