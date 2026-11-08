import { describe, expect, it } from "vitest";
import { calculate, ladderBonus, nextLadderStep, productRuleFor, tierIndex, type SaleLine } from "@/lib/commissions/engine";
import { defaultSettings, settingsSchema } from "@/lib/commissions/schema";

const settings = settingsSchema.parse({
  ...defaultSettings("2026-11"),
  tiers: [
    { from: 0, to: 100, rate: 0.5 },
    { from: 100, to: 200, rate: 1 },
    { from: 200, to: null, rate: 1.5 },
  ],
  categoryRates: { slow: 2, digital: 3 },
  products: [
    { key: "a", templateId: 10, templateName: "Slow fabric", category: "slow" },
    { key: "b", templateId: 20, templateName: "Digital", variantId: 201, color: "1", category: "digital" },
  ],
});

const line = (over: Partial<SaleLine>): SaleLine => ({ productId: 1, templateId: 1, qty: 10, amount: 1000, cash: false, day: "2026-11-02", ...over });

describe("price tiers and products", () => {
  it("measures slow-moving targets by sales value, including legacy settings", () => {
    expect(defaultSettings("2026-11").rules.categoryUnits.slow).toBe("amount");
    const legacy = settingsSchema.parse({
      ...defaultSettings("2026-11"),
      rules: { ...defaultSettings("2026-11").rules, categoryUnits: { slow: "qty", digital: "qty" } },
    });
    expect(legacy.rules.categoryUnits).toEqual({ slow: "amount", digital: "qty" });
  });
  it("uses the current price tiers as old-system tiers for settings saved before the feature", () => {
    const migrated = settingsSchema.parse({ month: "2026-11", tiers: settings.tiers, rules: {} });
    expect(migrated.rules.oldSystemMode).toBe("tiers");
    expect(migrated.rules.oldSystemTiers).toEqual(settings.tiers);
  });
  it("keeps product classification while ignoring legacy product rates and targets", () => {
    const migrated = settingsSchema.parse({
      ...settings,
      products: [{ ...settings.products[0], rate: 2, target: 500 }],
    });
    expect(migrated.products[0].category).toBe("slow");
    expect(migrated.products[0]).not.toHaveProperty("rate");
    expect(migrated.products[0]).not.toHaveProperty("target");
  });
  it("finds the range of a unit price", () => {
    expect(tierIndex(settings.tiers, 50)).toBe(0);
    expect(tierIndex(settings.tiers, 100)).toBe(1);
    expect(tierIndex(settings.tiers, 999)).toBe(2);
  });
  it("prefers the colour rule, then the product rule", () => {
    expect(productRuleFor(settings.products, 201, 20)?.key).toBe("b");
    expect(productRuleFor(settings.products, 202, 20)).toBeNull();
    expect(productRuleFor(settings.products, 999, 10)?.key).toBe("a");
  });
  it("ladder pays the highest matching step", () => {
    expect(ladderBonus(settings.rules.salesBonuses, 999_999)).toBe(0);
    expect(ladderBonus(settings.rules.salesBonuses, 1_050_000)).toBe(1000);
    expect(ladderBonus(settings.rules.salesBonuses, 1_200_000)).toBe(1500);
    expect(ladderBonus(settings.rules.salesBonuses, 5_200_000)).toBe(5000);
    expect(nextLadderStep(settings.rules.salesBonuses, 1_050_000)).toBe(1_100_000);
  });
});

describe("calculate", () => {
  const targets = { totalTarget: 1_000_000, slowTarget: 1000, digitalTarget: 100_000 };
  it("line commission by tier and product", () => {
    const result = calculate(settings, { totalTarget: null, slowTarget: null, digitalTarget: null }, {
      lines: [line({ qty: 10, amount: 500 }), line({ qty: 10, amount: 1500 }), line({ templateId: 10, qty: 5, amount: 1000 }), line({ productId: 201, templateId: 20, amount: 1000 })],
      collections: 0,
    }, { monthClosed: false });
    // Product categories use their configured rates; unclassified lines use price tiers:
    // 2.5 + 15 + 20 + 30.
    expect(result.base).toBeCloseTo(67.5);
    expect(result.categories.slow.qty).toBe(5);
    expect(result.categories.digital.commission).toBeCloseTo(30);
    expect(result.regime).toBe("noTarget");
  });
  it("below 50% pays 0.1% of sales only", () => {
    const result = calculate(settings, { ...targets, slowTarget: null }, { lines: [line({ qty: 1000, amount: 400_000, cash: true })], collections: 900_000 }, { monthClosed: true });
    expect(result.regime).toBe("low");
    expect(result.beforeCollection).toBeCloseTo(400);
    expect(result.collectionFactor).toBe(225);
    expect(result.total).toBeCloseTo(900);
    expect(result.belowMinimum).toBe(true);
  });
  it("applies collections to the commission component only, then adds bonuses and deductions", () => {
    const data = { lines: [line({ qty: 1000, amount: 100_000 })], collections: 50_000 };
    const half = calculate(settings, { totalTarget: null, slowTarget: null, digitalTarget: null }, data, { monthClosed: false });
    expect(half.beforeCollection).toBe(1_000);
    expect(half.collectionRatio).toBe(50);
    expect(half.collectionFactor).toBe(50);
    expect(half.total).toBe(500);
    expect(half.adjustments.find((item) => item.key === "collectionShare")?.amount).toBe(-500);

    const withBonus = calculate(
      settings,
      { totalTarget: 50_000, slowTarget: null, digitalTarget: null },
      { lines: [line({ qty: 1000, amount: 100_000, cash: true })], collections: 50_000 },
      { monthClosed: false },
    );
    expect(withBonus.regime).toBe("full");
    expect(withBonus.base).toBe(1_000);
    expect(withBonus.adjustments.find((item) => item.key === "allTargets")?.amount).toBe(200);
    expect(withBonus.adjustments.find((item) => item.key === "cash")?.amount).toBe(2_000);
    expect(withBonus.total).toBe(2_700);

    const over = calculate(settings, { totalTarget: null, slowTarget: null, digitalTarget: null }, { ...data, collections: 150_000 }, { monthClosed: false });
    expect(over.collectionRatio).toBe(150);
    expect(over.collectionFactor).toBe(150);
    expect(over.total).toBe(3_500);
    expect(over.adjustments.find((item) => item.key === "collectionShare")?.amount).toBe(500);
  });
  it("measures open-month achievement against targets prorated by elapsed days", () => {
    const result = calculate(
      settings,
      { totalTarget: 1_000_000, slowTarget: 1_000, digitalTarget: 100_000, rangeTargets: [null, null, 200_000] },
      {
        lines: [
          line({ amount: 224_750, qty: 1000 }),
          line({ templateId: 10, amount: 250, qty: 1 }),
          line({ productId: 201, templateId: 20, amount: 25_000, qty: 100 }),
        ],
        collections: 125_000,
      },
      { monthClosed: false, targetProgress: 0.25 },
    );
    expect(result.totalTarget).toBe(1_000_000);
    expect(result.totalTargetToDate).toBe(250_000);
    expect(result.achievement).toBe(100);
    expect(result.regime).toBe("full");
    expect(result.categories.slow.targetToDate).toBe(250);
    expect(result.categories.slow.achievement).toBe(100);
    expect(result.categories.digital.targetToDate).toBe(25_000);
    expect(result.categories.digital.achievement).toBe(100);
    expect(result.tiers[2].targetToDate).toBe(50_000);
    expect(result.tiers[2].achievement).toBeGreaterThan(100);
    expect(result.collectionRatio).toBe(50);
    expect(result.collectionFactor).toBe(50);

    const closed = calculate(
      settings,
      { totalTarget: 1_000_000, slowTarget: 1_000, digitalTarget: 100_000 },
      { lines: [line({ amount: 250_000, qty: 1000 })], collections: 125_000 },
      { monthClosed: true, targetProgress: 0.25 },
    );
    expect(closed.totalTargetToDate).toBe(1_000_000);
    expect(closed.achievement).toBe(25);
  });
  it("between 50% and 70% uses the old system (line commission only)", () => {
    const legacy = settingsSchema.parse({ ...settings, rules: { ...settings.rules, oldSystemMode: "base" } });
    const result = calculate(legacy, { ...targets, slowTarget: null }, { lines: [line({ qty: 1000, amount: 600_000, cash: true })], collections: 900_000 }, { monthClosed: false });
    expect(result.regime).toBe("old");
    expect(result.collectionFactor).toBe(150);
    expect(result.total).toBeCloseTo(result.base * 1.5);
  });
  it("uses separate old-system price tiers for regular products and keeps category rates", () => {
    const oldSettings = settingsSchema.parse({
      ...settings,
      rules: {
        ...settings.rules,
        oldSystemMode: "tiers",
        oldSystemTiers: [
          { from: 0, to: 200, rate: 0.2 },
          { from: 200, to: null, rate: 0.4 },
        ],
      },
    });
    const result = calculate(
      oldSettings,
      { totalTarget: 1_000_000, slowTarget: null, digitalTarget: null },
      {
        lines: [
          line({ amount: 300_000, qty: 1_000 }),
          line({ templateId: 10, amount: 100_000, qty: 100 }),
          line({ productId: 201, templateId: 20, amount: 200_000, qty: 200 }),
        ],
        collections: 600_000,
      },
      { monthClosed: true },
    );
    expect(result.regime).toBe("old");
    expect(result.base).toBe(12_500);
    expect(result.total).toBe(9_200);
    expect(result.adjustments.find((item) => item.key === "oldTiers")?.amount).toBe(9_200);
  });
  it("full system with every bonus", () => {
    const lines = [
      line({ qty: 1000, amount: 1_000_000, cash: true }), // tier C (1000/m) → 15,000
      line({ templateId: 10, qty: 1200, amount: 60_000, cash: true }), // slow → 1,200
      line({ productId: 201, templateId: 20, qty: 500, amount: 120_000, cash: false }), // digital → 3,600
    ];
    const result = calculate(settings, targets, { lines, collections: 1_500_000 }, { monthClosed: false });
    expect(result.regime).toBe("full");
    expect(result.allTargetsMet).toBe(true);
    expect(result.base).toBeCloseTo(19_800);
    // +20% (3,960) + cash 2,000 + collections 2,000 + ladder 1,500 (1.18M)
    expect(result.total).toBeCloseTo((19_800 * 1_500_000) / 1_180_000 + 3_960 + 2_000 + 2_000 + 1_500);
  });
  it("slow-moving value under 60% of target deducts 15%", () => {
    const lines = [line({ qty: 1000, amount: 900_000 }), line({ templateId: 10, qty: 100, amount: 5_000 })];
    const result = calculate(settings, { ...targets, slowTarget: 100_000 }, { lines, collections: 0 }, { monthClosed: false });
    const deduction = result.adjustments.find((item) => item.key === "slowDeduction")!;
    expect(deduction.met).toBe(true);
    expect(deduction.amount).toBeCloseTo(-0.15 * result.base);
  });
  it("applies the slow-moving deduction even when the total sales target is below 50%", () => {
    const lines = [line({ qty: 1000, amount: 400_000 }), line({ templateId: 10, qty: 100, amount: 5_000 })];
    const result = calculate(settings, { ...targets, slowTarget: 100_000 }, { lines, collections: 0 }, { monthClosed: true });
    const deduction = result.adjustments.find((item) => item.key === "slowDeduction")!;
    expect(result.regime).toBe("low");
    expect(deduction.met).toBe(true);
    expect(deduction.applies).toBe(true);
    expect(deduction.amount).toBeCloseTo(-0.15 * result.base);
  });
  it("compares slow-moving sales value against the rep's explicit target", () => {
    const lines = [line({ templateId: 10, qty: 100, amount: 5_000 })];
    const missing = calculate(settings, { ...targets, slowTarget: null }, { lines, collections: 0 }, { monthClosed: false });
    expect(missing.categories.slow.target).toBeNull();
    const entered = calculate(settings, { ...targets, slowTarget: 20_000 }, { lines, collections: 0 }, { monthClosed: false });
    expect(entered.categories.slow.unit).toBe("amount");
    expect(entered.categories.slow.achieved).toBe(5_000);
    expect(entered.categories.slow.target).toBe(20_000);
    expect(entered.categories.slow.achievement).toBe(25);
  });
});

describe("price-range targets", () => {
  it("measures each range and counts it in all targets met", () => {
    // Range C (1,100/m); a missing slow target is intentionally ignored.
    const lines = [line({ qty: 1000, amount: 1_100_000, cash: true }), line({ templateId: 10, qty: 600, amount: 30_000 })];
    const base = { totalTarget: 1_000_000, slowTarget: null, digitalTarget: null };
    const met = calculate(settings, { ...base, rangeTargets: [null, null, 1_000_000] }, { lines, collections: 0 }, { monthClosed: false });
    expect(met.tiers[2].achievement).toBeCloseTo(110);
    expect(met.allTargetsMet).toBe(true);
    const missed = calculate(settings, { ...base, rangeTargets: [200_000, null, null] }, { lines, collections: 0 }, { monthClosed: false });
    expect(missed.tiers[0].achievement).toBe(0);
    expect(missed.allTargetsMet).toBe(false);
  });
});

describe("cash and collections bonus minimum achievement", () => {
  const withMin = (cash: number | null, collection: number | null) =>
    settingsSchema.parse({ ...settings, rules: { ...settings.rules, cashMinAchievementPct: cash, collectionMinAchievementPct: collection } });
  const data = { lines: [line({ qty: 1000, amount: 300_000, cash: true })], collections: 400_000 };
  const targets = { totalTarget: 1_000_000, slowTarget: null, digitalTarget: null };
  const bonus = (result: ReturnType<typeof calculate>, key: string) => result.adjustments.find((item) => item.key === key)!;

  it("empty minimum: paid only once the target is met", () => {
    const result = calculate(withMin(null, null), targets, data, { monthClosed: true });
    expect(result.achievement).toBe(30);
    expect(bonus(result, "cash").amount).toBe(0);
    expect(bonus(result, "cash").gate).toEqual({ required: 100, achievement: 30, met: false, preset: false });
    expect(bonus(result, "collection").amount).toBe(0);
  });
  it("a modest minimum pays the bonuses even below the 50% / 70% levels", () => {
    const result = calculate(withMin(25, 25), targets, data, { monthClosed: true });
    expect(result.regime).toBe("low");
    expect(bonus(result, "cash").amount).toBe(2000);
    expect(bonus(result, "collection").amount).toBe(2000);
  });
  it("still needs its own condition", () => {
    const result = calculate(withMin(25, 25), targets, { ...data, collections: 100_000 }, { monthClosed: true });
    expect(bonus(result, "collection").amount).toBe(0);
  });
});
