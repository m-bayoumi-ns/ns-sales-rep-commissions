import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseTargetWorkbook } from "@/lib/commissions/storage";
import { monthReps } from "@/lib/commissions/view";
import { defaultSettings } from "@/lib/commissions/schema";

describe("target Excel sheet", () => {
  it("reads the target template columns and values", () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Targets");
    sheet.addRow(["Sales Rep", "Sales Rep U2", "Sales Target | TOTAL", "Range A", "Range B", "Range C", "Slow-moving", "Digital"]);
    sheet.addRow(["NSR305_أحمد عادل شحاته", "", 8_000_000, 3_500_000, 900_000, 5_000_000, 500_000, 100_000]);

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
      { found: true, path: "target.xlsx", reps: [row], columns: { rep: "Sales Rep", total: "Sales Target | TOTAL", slow: "Slow-moving", digital: "Digital", ranges: ["Range A", "Range B", "Range C"] } },
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
