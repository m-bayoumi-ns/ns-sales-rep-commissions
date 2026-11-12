import { describe, expect, it } from "vitest";
import { filterVisibleMonths } from "@/lib/commissions/month-visibility";

describe("commission month visibility", () => {
  const months = ["2027-02", "2027-01", "2026-12", "2026-11", "2026-10"];

  it("keeps only months in the inclusive configured range", () => {
    expect(filterVisibleMonths(months, "2026-11", "2027-01")).toEqual(["2027-01", "2026-12", "2026-11"]);
  });

  it("includes every available upcoming month when no end month is set", () => {
    expect(filterVisibleMonths(months, "2026-12")).toEqual(["2027-02", "2027-01", "2026-12"]);
  });

  it("returns no months for a reversed range", () => {
    expect(filterVisibleMonths(months, "2027-01", "2026-12")).toEqual([]);
  });
});
