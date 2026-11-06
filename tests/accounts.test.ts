import { describe, expect, it } from "vitest";
import { rateChanges } from "@/lib/commissions/changes";
import { findSheetName } from "@/lib/commissions/names";
import { defaultSettings, settingsSchema } from "@/lib/commissions/schema";

describe("registration name check", () => {
  const sheet = ["NSR305_أحمد عادل شحاته", "أحمد مصطفى غريب", "NSR370_محمود احمد مرسي حنفى"];
  it("accepts the sheet name with or without the code and spelling variants", () => {
    expect(findSheetName("NSR305_أحمد عادل شحاته", sheet)).toBe("NSR305_أحمد عادل شحاته");
    expect(findSheetName("احمد عادل شحاتة", sheet)).toBe("NSR305_أحمد عادل شحاته");
    expect(findSheetName("احمد مصطفي غريب", sheet)).toBe("أحمد مصطفى غريب");
  });
  it("rejects names that are not in the sheet (or only partly match)", () => {
    expect(findSheetName("أحمد عادل", sheet)).toBeNull();
    expect(findSheetName("محمد علي", sheet)).toBeNull();
    expect(findSheetName("", sheet)).toBeNull();
  });
});

describe("rate changes for notifications", () => {
  const before = settingsSchema.parse({ ...defaultSettings("2026-11"), tiers: [{ from: 0, to: 111, rate: 0.05 }, { from: 111, to: 126, rate: 0.15 }, { from: 126, to: null, rate: 0.25 }] });
  it("finds nothing when nothing changed", () => {
    expect(rateChanges(before, structuredClone(before))).toEqual([]);
  });
  it("lists tier, category, rule and product changes", () => {
    const after = structuredClone(before);
    after.tiers[1].rate = 0.2;
    after.categoryRates.slow = 1;
    after.rules.cashBonus = 3000;
    after.products.push({ key: "x", templateId: 5, templateName: "BLOOM", code: null, variantId: null, color: null, category: "slow" });
    const kinds = rateChanges(before, after).map((change) => change.kind);
    expect(kinds).toEqual(["tier", "categoryRate", "productAdded", "rule"]);
  });
});
