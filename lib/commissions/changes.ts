import type { CommissionSettings, Rules } from "./schema";

/**
 * What changed in the commission rates between two versions of a month's settings —
 * the content of a rate-change notification. Pure (shared by the server and tests).
 */
export type RateChange =
  | { kind: "tier"; key: string; from: string; to: string }
  | { kind: "oldTier"; key: string; from: string; to: string }
  | { kind: "categoryRate"; key: "slow" | "digital"; from: number; to: number }
  | { kind: "productRate"; name: string; price: string; from: number | null; to: number | null }
  | { kind: "productAdded" | "productRemoved"; name: string; category: string }
  | { kind: "productMoved"; name: string; from: string; to: string }
  | { kind: "rule"; key: keyof Rules; from: string; to: string }
  | { kind: "ladder"; from: string; to: string };

const tierText = (tier: CommissionSettings["tiers"][number]) => `${tier.from}–${tier.to ?? "∞"} @ ${tier.rate}%`;
const oldTierText = (tier: Rules["oldSystemTiers"][number]) => `${tier.from}–${tier.to ?? "∞"} @ ${tier.rate}%`;
const ladderText = (rules: Rules) => rules.salesBonuses.map((step) => `${step.from}–${step.to ?? "∞"}: ${step.amount}`).join(" · ") || "—";
const productName = (product: CommissionSettings["products"][number]) => `${product.templateName || product.sourceName}${product.color ? ` · ${product.color}` : ""}`;
const productKey = (product: CommissionSettings["products"][number]) => product.key;
const productPrice = (product: CommissionSettings["products"][number]) => product.anyPrice ? "any price" : product.price == null ? "—" : String(product.price);

const RULE_KEYS: (keyof Rules)[] = [
  "allTargetsBonusPct",
  "slowMinPct",
  "slowDeductionPct",
  "cashSharePct",
  "cashBonus",
  "collectionPct",
  "collectionBonus",
  "lowAchievementPct",
  "lowRate",
  "oldSystemUntilPct",
  "oldSystemMode",
  "oldRate",
  "minimumSales",
];

export function rateChanges(before: CommissionSettings, after: CommissionSettings): RateChange[] {
  const changes: RateChange[] = [];
  after.tiers.forEach((tier, index) => {
    const old = before.tiers[index];
    if (!old || old.from !== tier.from || old.to !== tier.to || old.rate !== tier.rate) {
      changes.push({ kind: "tier", key: String.fromCharCode(65 + index), from: old ? tierText(old) : "—", to: tierText(tier) });
    }
  });
  const oldTierCount = Math.max(before.rules.oldSystemTiers.length, after.rules.oldSystemTiers.length);
  for (let index = 0; index < oldTierCount; index++) {
    const old = before.rules.oldSystemTiers[index];
    const tier = after.rules.oldSystemTiers[index];
    if (!old || !tier || old.from !== tier.from || old.to !== tier.to || old.rate !== tier.rate) {
      changes.push({ kind: "oldTier", key: String.fromCharCode(65 + index), from: old ? oldTierText(old) : "—", to: tier ? oldTierText(tier) : "—" });
    }
  }
  for (const key of ["slow", "digital"] as const) {
    const from = before.categoryRates?.[key] ?? 0;
    const to = after.categoryRates?.[key] ?? 0;
    if (from !== to) changes.push({ kind: "categoryRate", key, from, to });
  }
  const oldProducts = new Map(before.products.map((product) => [productKey(product), product]));
  const newProducts = new Map(after.products.map((product) => [productKey(product), product]));
  for (const [key, product] of newProducts) {
    const old = oldProducts.get(key);
    if (!old) changes.push({ kind: "productAdded", name: productName(product), category: product.category ?? "unclassified" });
    else {
      if (old.category !== product.category) changes.push({ kind: "productMoved", name: productName(product), from: old.category ?? "unclassified", to: product.category ?? "unclassified" });
      if (old.commission !== product.commission) changes.push({ kind: "productRate", name: productName(product), price: productPrice(product), from: old.commission, to: product.commission });
    }
  }
  for (const [key, product] of oldProducts) if (!newProducts.has(key)) changes.push({ kind: "productRemoved", name: productName(product), category: product.category ?? "unclassified" });
  for (const key of RULE_KEYS) {
    const from = String(before.rules[key]);
    const to = String(after.rules[key]);
    if (from !== to) changes.push({ kind: "rule", key, from, to });
  }
  if (ladderText(before.rules) !== ladderText(after.rules)) changes.push({ kind: "ladder", from: ladderText(before.rules), to: ladderText(after.rules) });
  return changes;
}
