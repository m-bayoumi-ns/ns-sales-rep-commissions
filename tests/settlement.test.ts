import { describe, expect, it } from "vitest";
import { paidInvoiceShares } from "@/lib/commissions/settlement";

describe("invoice amounts paid in the selected month", () => {
  const invoiceIds = new Set([10, 11]);
  const receivableLines = [
    { id: 100, invoiceId: 10, balance: 1000 },
    { id: 110, invoiceId: 11, balance: 500 },
  ];

  it("counts partial payments from multiple payment methods in the month", () => {
    const shares = paidInvoiceShares(
      invoiceIds,
      receivableLines,
      [
        { debitLineId: 100, creditLineId: 200, amount: 200, date: "2026-11-08" },
        { debitLineId: 100, creditLineId: 201, amount: 300, date: "2026-11-15" },
        { debitLineId: 110, creditLineId: 202, amount: 300, date: "2026-11-12" },
      ],
      "2026-11-01",
      "2026-11-30",
    );

    expect(shares).toEqual(new Map([[10, 0.5], [11, 0.6]]));
  });

  it("counts only amounts paid during the selected month", () => {
    const shares = paidInvoiceShares(
      new Set([10]),
      [receivableLines[0]],
      [
        { debitLineId: 100, creditLineId: 200, amount: 400, date: "2026-10-30" },
        { debitLineId: 100, creditLineId: 201, amount: 200, date: "2026-11-08" },
        { debitLineId: 100, creditLineId: 202, amount: 400, date: "2026-12-02" },
      ],
      "2026-11-01",
      "2026-11-30",
    );

    expect(shares).toEqual(new Map([[10, 0.2]]));
  });

  it("combines installments across all receivable lines for an invoice", () => {
    const shares = paidInvoiceShares(
      new Set([10]),
      [
        { id: 100, invoiceId: 10, balance: 700 },
        { id: 101, invoiceId: 10, balance: 300 },
      ],
      [
        { debitLineId: 100, creditLineId: 200, amount: 700, date: "2026-11-08" },
        { debitLineId: 101, creditLineId: 201, amount: 100, date: "2026-11-15" },
      ],
      "2026-11-01",
      "2026-11-30",
    );

    expect(shares).toEqual(new Map([[10, 0.8]]));
  });

  it("caps the counted share at the invoice total", () => {
    const shares = paidInvoiceShares(
      new Set([10]),
      [receivableLines[0]],
      [{ debitLineId: 100, creditLineId: 200, amount: 1200, date: "2026-11-08" }],
      "2026-11-01",
      "2026-11-30",
    );

    expect(shares).toEqual(new Map([[10, 1]]));
  });
});
