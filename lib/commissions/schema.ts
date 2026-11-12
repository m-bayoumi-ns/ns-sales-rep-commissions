import { z } from "zod";

/**
 * Commission settings of one month, stored as one JSON file per month in Supabase Storage
 * (bucket naguib-selim-db, folder ns-sales-rep-commissions/settings_YYYY_MM.json).
 * Shared by the server (calculation, storage) and the browser (settings form).
 */

export const CATEGORIES = ["slow", "digital"] as const;
export type Category = (typeof CATEGORIES)[number];

/** How a category target is measured: quantity sold (meters / units) or sales value (EGP). */
export const TARGET_UNITS = ["qty", "amount"] as const;
export type TargetUnit = (typeof TARGET_UNITS)[number];

const num = z.coerce.number().finite();
const nonNeg = num.min(0);
const pct = num.min(0).max(1000);
/** Optional number: empty, null or missing → null (z.coerce would turn null into 0). */
const optNum = z.preprocess((value) => (value === "" || value === undefined || value === null ? null : value), z.union([z.null(), nonNeg])).default(null);

/** Price tier: lines whose unit price after discount is ≥ from and < to (to = null → no upper limit). */
export const tierSchema = z.object({
  from: nonNeg.default(0),
  to: optNum,
  rate: pct.default(0),
});

/** A product row imported from Product commission and linked to an Odoo product. */
export const productRuleSchema = z.object({
  key: z.string().min(1).max(64),
  sourceName: z.string().max(500).default(""),
  templateId: z.number().int().nonnegative().default(0),
  templateName: z.string().max(300),
  code: z.string().max(64).nullable().default(null),
  sourceCategory: z.string().max(120).nullable().default(null),
  /** null = every colour of the product. */
  variantId: z.number().int().positive().nullable().default(null),
  color: z.string().max(120).nullable().default(null),
  category: z.enum(CATEGORIES).nullable().default(null),
  /** null with anyPrice=false means the source Price cell was invalid or empty. */
  price: optNum,
  anyPrice: z.boolean().default(false),
  commission: z.preprocess((value) => (value === "" || value === undefined || value === null ? null : value), z.union([z.null(), pct])).default(null),
});

export const bonusStepSchema = z.object({
  from: nonNeg,
  to: optNum,
  amount: nonNeg,
});

export const repSettingSchema = z.object({
  /** Name as written in the "Sales Rep" column of the month's target sheet. */
  name: z.string().min(1).max(200),
  /** Odoo user (res.users) the name is linked to; null = matched automatically by name. */
  odooUserId: z.number().int().positive().nullable().default(null),
  totalTarget: optNum,
  slowTarget: optNum,
  digitalTarget: optNum,
  /** Target per price range, in range order (A, B, C); null = no target for that range. */
  rangeTargets: z.array(optNum).max(6).default([]),
});

export const rulesSchema = z.object({
  /** Meets every target (total + each category with a target) → + this % of the commission. */
  allTargetsBonusPct: pct.default(20),
  /** Slow-moving achievement below this % → − slowDeductionPct % of the commission. */
  slowMinPct: pct.default(60),
  slowDeductionPct: pct.default(15),
  /** Invoice sales paid this month ≥ this % of the month's sales → flat bonus. */
  cashSharePct: pct.default(60),
  cashBonus: nonNeg.default(2000),
  /** Target achievement (%) needed before the cash bonus is paid; empty = the target must be met (100 %). */
  cashMinAchievementPct: optNum,
  /** Collections > this % of the month's sales → flat bonus. */
  collectionPct: pct.default(120),
  collectionBonus: nonNeg.default(2000),
  /** Target achievement (%) needed before the collections bonus is paid; empty = the target must be met (100 %). */
  collectionMinAchievementPct: optNum,
  /** Total achievement below this % → commission = lowRate % of total sales only. */
  lowAchievementPct: pct.default(50),
  lowRate: pct.default(0.1),
  /** From lowAchievementPct up to this % → the old commission system. */
  oldSystemUntilPct: pct.default(70),
  /** Used by the old system for products without an applicable Product commission. */
  oldSystemTiers: z.array(tierSchema).min(1).max(6),
  /** A note is flagged when month-end sales are below this amount. */
  minimumSales: nonNeg.default(478_000),
  /** Flat bonuses by monthly sales; the highest matching step is paid. */
  salesBonuses: z.array(bonusStepSchema).max(20).default([
    { from: 1_000_000, to: 1_100_000, amount: 1000 },
    { from: 1_100_000, to: 1_250_000, amount: 1500 },
    { from: 2_250_000, to: 5_500_000, amount: 2500 },
    { from: 5_000_000, to: null, amount: 5000 },
  ]),
  /** Statement: which buckets (price ranges A/B/C, NS, slow, digital) can be opened to list the products sold in them. */
  statementDetails: z
    .object({ A: z.boolean().default(true), B: z.boolean().default(true), C: z.boolean().default(true), ns: z.boolean().default(true), slow: z.boolean().default(true), digital: z.boolean().default(true) })
    .default({ A: true, B: true, C: true, ns: true, slow: true, digital: true }),
  /** How the price-range targets are measured: quantity (meters / units) or sales value (EGP). */
  rangeUnit: z.enum(TARGET_UNITS).default("amount"),
  categoryUnits: z
    .object({ slow: z.enum(TARGET_UNITS).default("amount"), digital: z.enum(TARGET_UNITS).default("amount") })
    .default({ slow: "amount", digital: "amount" })
    // Older monthly settings may store slow-moving targets as quantities; always interpret them as sales value now.
    .transform(({ digital }) => ({ slow: "amount" as const, digital })),
});

const settingsObjectSchema = z.object({
  version: z.literal(1).default(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  tiers: z.array(tierSchema).min(1).max(6),
  products: z.array(productRuleSchema).max(500).default([]),
  /** Legacy category rates retained for existing settings files; product commission is read from Excel. */
  categoryRates: z.object({ slow: pct.default(0), digital: pct.default(0) }).default({ slow: 0, digital: 0 }),
  rules: rulesSchema,
  reps: z.array(repSettingSchema).max(300).default([]),
  updatedAt: z.string().nullable().default(null),
  updatedBy: z.string().nullable().default(null),
});

export const settingsSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null || !("tiers" in value)) return value;
  const input = value as { tiers: unknown; rules?: unknown };
  const rules = typeof input.rules === "object" && input.rules !== null ? input.rules : {};
  const currentRules = rules as Record<string, unknown>;
  return {
    ...value,
    rules: {
      ...currentRules,
      oldSystemTiers: currentRules.oldSystemTiers ?? input.tiers,
    },
  };
}, settingsObjectSchema);

export type Tier = z.infer<typeof tierSchema>;
export type ProductRule = z.infer<typeof productRuleSchema>;
export type BonusStep = z.infer<typeof bonusStepSchema>;
export type RepSetting = z.infer<typeof repSettingSchema>;
export type Rules = z.infer<typeof rulesSchema>;
export type CommissionSettings = z.infer<typeof settingsSchema>;

/** Three empty ranges A, B, C: the ranges and rates are set on the Settings page. */
export function defaultSettings(month: string): CommissionSettings {
  return settingsSchema.parse({
    month,
    tiers: [
      { from: 0, to: null, rate: 0 },
      { from: 0, to: null, rate: 0 },
      { from: 0, to: null, rate: 0 },
    ],
    rules: {},
  });
}

/** True once at least one price range or linked Product commission row has a rate. */
export function hasRates(settings: CommissionSettings) {
  return settings.tiers.some((tier) => tier.rate > 0) || settings.products.some((product) => product.commission != null && product.templateId > 0);
}
