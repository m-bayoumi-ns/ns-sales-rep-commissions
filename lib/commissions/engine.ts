import type { Category, CommissionSettings, ProductRule, Rules, TargetUnit, Tier } from "./schema";

/**
 * The commission calculation — pure (no Odoo, no storage), so it is unit-tested and runs the same
 * on every page. Amounts are net of discounts and of refunds (credit notes count negative).
 *
 * 1. Classified products earn their category rate; all other lines earn the rate of the price range
 *    their unit price after discount falls in (A / B / C).
 * 2. In an open month, target achievement is compared with the prorated target for elapsed calendar days; in a closed
 *    month, it is compared with the full target. This decides the system:
 *      • below 50 %            → 0.1 % of total sales, nothing else;
 *      • 50 % up to 70 %       → the old system (by default: the line commission, no bonuses or deductions);
 *      • 70 % and above        → the line commission with every bonus and deduction below.
 * 3. Percentage adjustments of the line commission: + 20 % when every target is met, − 15 % when the
 *    slow-moving achievement is under 60 %. Then flat bonuses: cash sales ≥ 60 %, collections > 120 % of
 *    sales, and the monthly sales ladder (highest matching step).
 * 4. Collections ÷ sales is applied to the commission component only, with no upper cap; bonuses and deductions
 *    are added afterward without being scaled by collections.
 * 5. A note is flagged when month-end sales are below the minimum (478,000).
 */

export type SaleLine = {
  productId: number;
  templateId: number;
  qty: number;
  /** Net amount after discount, negative for refunds. */
  amount: number;
  /** Sold on immediate payment terms (cash sale). */
  cash: boolean;
  day: string;
};

export type RepData = {
  lines: SaleLine[];
  /** Customer receipts credited to the rep (payments + collected cheques + treasury receipts − refunds). */
  collections: number;
};

export type Regime = "noTarget" | "low" | "old" | "full";

export type Adjustment = {
  key: "allTargets" | "slowDeduction" | "cash" | "collection" | "salesLadder" | "lowRate" | "oldRate" | "collectionShare";
  /** Condition met (the bonus is earned / the deduction applies). */
  met: boolean;
  /** Counts toward the total under the current system. */
  applies: boolean;
  /** EGP added (negative = deducted). 0 when not met or not applied. */
  amount: number;
  /** Where the rep stands on the condition: current value and the threshold, in the condition's unit. */
  current: number | null;
  threshold: number | null;
  /** Cash / collections bonus: the target achievement (%) also required, and where the rep is. */
  /** `preset`: false when the minimum is not set in the month's settings and the 100 % default applies. */
  gate?: { required: number; achievement: number | null; met: boolean; preset: boolean };
};

export type BucketResult = { key: string; qty: number; amount: number; commission: number; rate: number | null };
export type RangeResult = BucketResult & { target: number | null; targetToDate: number | null; unit: TargetUnit; achieved: number; achievement: number | null };

export type RepResult = {
  sales: number;
  qty: number;
  cashSales: number;
  cashShare: number | null;
  collections: number;
  /** Actual collections as a percentage of sales, which may exceed 100% or be negative. */
  collectionRatio: number | null;
  /** Percentage of commission paid based on collections; it can exceed 100% and is floored at 0%. */
  collectionFactor: number;
  /** Line commission by price range before any adjustment. */
  base: number;
  /** Per price range: sales, commission and — when the rep has a target for the range — its achievement. */
  tiers: RangeResult[];
  /** Lines in no range (unit price outside every range) — they earn nothing. */
  unpriced: BucketResult;
  categories: Record<Category, BucketResult & { target: number | null; targetToDate: number | null; unit: TargetUnit; achieved: number; achievement: number | null }>;
  totalTarget: number | null;
  totalTargetToDate: number | null;
  achievement: number | null;
  allTargetsMet: boolean;
  regime: Regime;
  adjustments: Adjustment[];
  /** What the rep earns now under the system that applies. */
  beforeCollection: number;
  total: number;
  belowMinimum: boolean;
};

export type RepTargets = { totalTarget: number | null; slowTarget: number | null; digitalTarget: number | null; rangeTargets?: (number | null)[] };

/** Index of the price range a unit price falls in, or -1. Ranges are [from, to); an empty "to" is open. */
export function tierIndex(tiers: Tier[], unitPrice: number): number {
  return tiers.findIndex((tier) => tier.rate > 0 || tier.from > 0 || tier.to != null ? unitPrice >= tier.from && (tier.to == null || unitPrice < tier.to) : false);
}

/** The product rule for a line: the colour-specific rule first, then the rule for every colour. */
export function productRuleFor(products: ProductRule[], productId: number, templateId: number): ProductRule | null {
  return products.find((rule) => rule.variantId === productId) ?? products.find((rule) => rule.variantId == null && rule.templateId === templateId) ?? null;
}

/** Highest flat bonus whose [from, to] range holds the sales (to = null → no upper limit). */
export function ladderBonus(steps: Rules["salesBonuses"], sales: number): number {
  return steps.reduce((best, step) => (sales >= step.from && (step.to == null || sales <= step.to) && step.amount > best ? step.amount : best), 0);
}

const pctOf = (part: number, whole: number | null) => (whole && whole > 0 ? (100 * part) / whole : null);
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Slow-moving target is entered for the rep in the month's targets. */
export function slowTargetOf(targets: RepTargets): number | null {
  return targets.slowTarget != null && targets.slowTarget > 0 ? targets.slowTarget : null;
}

export function calculate(settings: CommissionSettings, targets: RepTargets, data: RepData, options: { monthClosed: boolean; targetProgress?: number }): RepResult {
  const { tiers, products, rules } = settings;
  const tierBuckets: BucketResult[] = tiers.map((tier, index) => ({ key: String.fromCharCode(65 + index), qty: 0, amount: 0, commission: 0, rate: tier.rate }));
  const unpriced: BucketResult = { key: "none", qty: 0, amount: 0, commission: 0, rate: null };
  const cat = (key: Category) => ({ key, qty: 0, amount: 0, commission: 0, rate: null });
  const categoryBuckets: Record<Category, BucketResult> = { slow: cat("slow"), digital: cat("digital") };

  let sales = 0;
  let qty = 0;
  let cashSales = 0;
  for (const line of data.lines) {
    sales += line.amount;
    qty += line.qty;
    if (line.cash) cashSales += line.amount;
    const rule = productRuleFor(products, line.productId, line.templateId);
    const unitPrice = line.qty ? Math.abs(line.amount / line.qty) : Math.abs(line.amount);
    const index = tierIndex(tiers, unitPrice);
    let bucket: BucketResult;
    const rate = rule ? settings.categoryRates[rule.category] : index >= 0 ? tiers[index].rate : 0;
    if (rule) {
      bucket = categoryBuckets[rule.category];
    } else {
      bucket = index >= 0 ? tierBuckets[index] : unpriced;
    }
    bucket.qty += line.qty;
    bucket.amount += line.amount;
    bucket.commission += (line.amount * rate) / 100;
  }
  const base = round2([...tierBuckets, ...Object.values(categoryBuckets)].reduce((sum, bucket) => sum + bucket.commission, 0));

  // Achievement per category and in total.
  const targetProgress = options.monthClosed ? 1 : Math.min(1, Math.max(0, options.targetProgress ?? 1));
  const targetToDate = (target: number | null) => target == null ? null : round2(target * targetProgress);
  const categoryTargets: Record<Category, number | null> = { slow: slowTargetOf(targets), digital: targets.digitalTarget && targets.digitalTarget > 0 ? targets.digitalTarget : null };
  const categories = Object.fromEntries(
    (Object.keys(categoryBuckets) as Category[]).map((key) => {
      const bucket = categoryBuckets[key];
      const unit = rules.categoryUnits[key];
      const achieved = unit === "qty" ? bucket.qty : bucket.amount;
      const currentTarget = targetToDate(categoryTargets[key]);
      return [key, { ...bucket, commission: round2(bucket.commission), target: categoryTargets[key], targetToDate: currentTarget, unit, achieved, achievement: pctOf(achieved, currentTarget) }];
    }),
  ) as RepResult["categories"];
  const totalTarget = targets.totalTarget && targets.totalTarget > 0 ? targets.totalTarget : null;
  const totalTargetToDate = targetToDate(totalTarget);
  const achievement = pctOf(sales, totalTargetToDate);
  const tierResults: RangeResult[] = tierBuckets.map((bucket, index) => {
    const raw = targets.rangeTargets?.[index] ?? null;
    const target = raw != null && raw > 0 ? raw : null;
    const currentTarget = targetToDate(target);
    const achieved = rules.rangeUnit === "qty" ? bucket.qty : bucket.amount;
    return { ...bucket, commission: round2(bucket.commission), target, targetToDate: currentTarget, unit: rules.rangeUnit, achieved, achievement: pctOf(achieved, currentTarget) };
  });
  const allTargetsMet =
    achievement != null &&
    achievement >= 100 &&
    (Object.values(categories) as RepResult["categories"][Category][]).every((item) => item.achievement == null || item.achievement >= 100) &&
    tierResults.every((item) => item.achievement == null || item.achievement >= 100);

  const regime: Regime = achievement == null ? "noTarget" : achievement < rules.lowAchievementPct ? "low" : achievement < rules.oldSystemUntilPct ? "old" : "full";
  const fullRules = regime === "full" || regime === "noTarget";

  const cashShare = pctOf(cashSales, sales);
  const collectionRatio = pctOf(data.collections, sales);
  const collectionFactor = sales > 0 ? (100 * Math.max(data.collections, 0)) / sales : 0;
  const slowAchievement = categories.slow.achievement;

  const adjustments: Adjustment[] = [];
  const add = (item: Omit<Adjustment, "amount"> & { value: number }) => {
    const { value, ...rest } = item;
    adjustments.push({ ...rest, amount: item.met && item.applies ? round2(value) : 0 });
  };
  add({ key: "allTargets", met: allTargetsMet, applies: fullRules && totalTarget != null, value: (base * rules.allTargetsBonusPct) / 100, current: achievement, threshold: 100 });
  add({
    key: "slowDeduction",
    met: slowAchievement != null && slowAchievement < rules.slowMinPct,
    applies: true,
    value: -(base * rules.slowDeductionPct) / 100,
    current: slowAchievement,
    threshold: rules.slowMinPct,
  });
  // Cash and collections bonuses: their own condition plus a minimum target achievement (empty = 100 %, the
  // target met). They follow that minimum instead of the commission system, so a modest minimum pays them below 70 %.
  // Without a total target the achievement cannot be checked and only their own condition counts.
  const gateFor = (min: number | null) => {
    const required = min ?? 100;
    return { required, achievement, met: totalTarget == null || (achievement != null && achievement >= required), preset: min != null };
  };
  const cashGate = gateFor(rules.cashMinAchievementPct);
  const cashOwn = cashShare != null && cashShare >= rules.cashSharePct;
  const collectionGate = gateFor(rules.collectionMinAchievementPct);
  add({ key: "cash", met: cashOwn && cashGate.met, applies: true, value: rules.cashBonus, current: cashShare, threshold: rules.cashSharePct, gate: cashGate });
  add({
    key: "collection",
    met: collectionRatio != null && collectionRatio > rules.collectionPct && collectionGate.met,
    applies: true,
    gate: collectionGate,
    value: rules.collectionBonus,
    current: collectionRatio,
    threshold: rules.collectionPct,
  });
  const ladder = ladderBonus(rules.salesBonuses, sales);
  add({ key: "salesLadder", met: ladder > 0, applies: fullRules, value: ladder, current: sales, threshold: nextLadderStep(rules.salesBonuses, sales) });

  let commissionComponent: number;
  if (regime === "low") {
    commissionComponent = round2(Math.max(0, (sales * rules.lowRate) / 100));
    adjustments.push({ key: "lowRate", met: true, applies: true, amount: commissionComponent, current: achievement, threshold: rules.lowAchievementPct });
  } else if (regime === "old" && rules.oldSystemMode === "rate") {
    commissionComponent = round2(Math.max(0, (sales * rules.oldRate) / 100));
    adjustments.push({ key: "oldRate", met: true, applies: true, amount: commissionComponent, current: achievement, threshold: rules.oldSystemUntilPct });
  } else {
    commissionComponent = base;
  }
  const bonusesAndDeductions = adjustments.reduce(
    (sum, item) => sum + (item.key === "lowRate" || item.key === "oldRate" ? 0 : item.amount),
    0,
  );
  const beforeCollection = round2(Math.max(0, commissionComponent + bonusesAndDeductions));
  const total = round2(Math.max(0, (commissionComponent * collectionFactor / 100) + bonusesAndDeductions));
  adjustments.push({
    key: "collectionShare",
    met: collectionFactor >= 100,
    applies: true,
    amount: round2(total - beforeCollection),
    current: collectionFactor,
    threshold: 100,
  });

  return {
    sales: round2(sales),
    qty,
    cashSales: round2(cashSales),
    cashShare,
    collections: round2(data.collections),
    collectionRatio,
    collectionFactor,
    base,
    tiers: tierResults,
    unpriced: { ...unpriced, commission: 0 },
    categories,
    totalTarget,
    totalTargetToDate,
    achievement,
    allTargetsMet,
    regime,
    adjustments,
    beforeCollection,
    total,
    belowMinimum: options.monthClosed && sales < rules.minimumSales,
  };
}

/** The next sales level that pays a higher ladder bonus (null when none is left). */
export function nextLadderStep(steps: Rules["salesBonuses"], sales: number): number | null {
  const current = ladderBonus(steps, sales);
  const ahead = steps.filter((step) => step.from > sales && step.amount > current).map((step) => step.from);
  return ahead.length ? Math.min(...ahead) : null;
}

/** Straight-line month-end projection from the days elapsed so far. */
export function project(value: number, elapsedDays: number, monthDays: number): number {
  if (elapsedDays <= 0) return value;
  return elapsedDays >= monthDays ? value : (value / elapsedDays) * monthDays;
}
