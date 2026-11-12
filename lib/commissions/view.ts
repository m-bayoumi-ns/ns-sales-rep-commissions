import "server-only";
import type { AppUser } from "@/lib/auth/types";
import { addMonths, currentMonth, daysBetween, monthBounds, today } from "@/lib/finance/core";
import { calculate, productCommissionRateFor, productRuleFor, project, type RepResult, tierIndex } from "./engine";
import { cleanRepName, matchRep, normalizeName } from "./names";
import { autoMatchProducts, getCollections, getRepCandidates, getReceivables, getSalesLines, getUserNames, type OdooRep, type RepSaleLine } from "./odoo";
import type { Category, CommissionSettings } from "./schema";
import { loadSettings, readTargetSheet, type StoredSettings, type TargetSheet } from "./storage";
import { loadAppSettings } from "@/lib/accounts/app-settings";

export const FIRST_MONTH = "2026-01";

export function resolveMonth(raw: string | undefined): string {
  const now = currentMonth();
  if (!raw || !/^\d{4}-\d{2}$/.test(raw) || raw > now || raw < FIRST_MONTH) return now;
  return raw;
}

export function availableMonths(): string[] {
  const out: string[] = [];
  for (let month = currentMonth(); month >= FIRST_MONTH; month = addMonths(month, -1)) out.push(month);
  return out;
}

export type MonthClock = { month: string; closed: boolean; elapsedDays: number; monthDays: number; remainingDays: number; asOf: string };

export function monthClock(month: string): MonthClock {
  const [start, end] = monthBounds(month);
  const now = today();
  const monthDays = daysBetween(start, end) + 1;
  const closed = now > end;
  const elapsedDays = closed ? monthDays : Math.max(1, daysBetween(start, now) + 1);
  return { month, closed, elapsedDays, monthDays, remainingDays: monthDays - elapsedDays, asOf: closed ? end : now };
}

// ---------------------------------------------------------------- the month's sales reps
export type RepEntry = {
  /** URL key: the Odoo user id, or "n:<name>" while not linked; duplicate links add a name suffix. */
  key: string;
  name: string;
  odooUserId: number | null;
  odooName: string | null;
  linkedBy: "manual" | "auto" | null;
  totalTarget: number | null;
  slowTarget: number | null;
  digitalTarget: number | null;
  rangeTargets: (number | null)[];
};

/** Targets always come from the month's Excel sheet; only the Odoo link is kept in saved settings. */
export function monthReps(stored: StoredSettings, sheet: TargetSheet, candidates: OdooRep[], userNames: Map<number, string>): RepEntry[] {
  const saved = new Map(stored.settings.reps.map((rep) => [normalizeName(rep.name), rep]));
  const names = sheet.reps.length ? sheet.reps : stored.settings.reps.map((rep) => ({ name: rep.name, totalTarget: null, slowTarget: null, digitalTarget: null, rangeTargets: [] as (number | null)[] }));
  const seen = new Set<string>();
  const out: RepEntry[] = [];
  for (const row of names) {
    const norm = normalizeName(row.name);
    if (seen.has(norm)) continue;
    seen.add(norm);
    const own = saved.get(norm);
    const auto = own?.odooUserId ? null : matchRep(row.name, candidates);
    const odooUserId = own?.odooUserId ?? auto?.id ?? null;
    out.push({
      key: odooUserId ? String(odooUserId) : `n:${row.name}`,
      name: row.name,
      odooUserId,
      odooName: odooUserId ? (candidates.find((rep) => rep.id === odooUserId)?.name ?? userNames.get(odooUserId) ?? null) : null,
      linkedBy: own?.odooUserId ? "manual" : auto ? "auto" : null,
      totalTarget: row.totalTarget,
      slowTarget: row.slowTarget,
      digitalTarget: row.digitalTarget,
      rangeTargets: [0, 1, 2].map((index) => row.rangeTargets[index] ?? null),
    });
  }

  const usedKeys = new Set<string>();
  return out.map((rep) => {
    if (!usedKeys.has(rep.key)) {
      usedKeys.add(rep.key);
      return rep;
    }

    const baseKey = `${rep.key}:n:${encodeURIComponent(rep.name)}`;
    let key = baseKey;
    for (let suffix = 1; usedKeys.has(key); suffix += 1) key = `${baseKey}:${suffix}`;
    usedKeys.add(key);
    return { ...rep, key };
  });
}

export async function loadMonthSetup(month: string) {
  const [stored, sheet, candidates] = await Promise.all([loadSettings(month), readTargetSheet(month), getRepCandidates()]);
  const savedProducts = new Map(stored.settings.products.map((product) => [product.key, product]));
  const autoMatches = await autoMatchProducts(
    sheet.productCommission.rows
      .filter((row) => (savedProducts.get(row.key)?.templateId ?? 0) <= 0)
      .map((row) => row.productName),
  );
  const products = sheet.productCommission.rows.map((row) => {
    const saved = savedProducts.get(row.key);
    const auto = (saved?.templateId ?? 0) > 0 ? null : autoMatches.get(normalizeName(row.productName));
    return {
      key: row.key,
      sourceName: row.productName,
      templateId: saved?.templateId || auto?.templateId || 0,
      templateName: saved?.templateName || auto?.name || "",
      code: saved?.code ?? auto?.code ?? null,
      variantId: saved?.variantId ?? null,
      color: saved?.color ?? null,
      category: row.categoryKey,
      price: row.price != null && row.price >= 0 ? row.price : null,
      anyPrice: row.anyPrice,
      commission: row.commission != null && row.commission >= 0 && row.commission <= 1000 ? row.commission : null,
    };
  });
  const effectiveSettings: CommissionSettings = { ...stored.settings, products };
  const effectiveStored: StoredSettings = { ...stored, settings: effectiveSettings };
  const manualIds = stored.settings.reps.map((rep) => rep.odooUserId).filter((id): id is number => id != null && !candidates.some((rep) => rep.id === id));
  const userNames = await getUserNames(manualIds);
  return { stored: effectiveStored, sheet, candidates, reps: monthReps(stored, sheet, candidates, userNames) };
}

/** Which reps a user may see: managers see all; a sales_rep-limited account sees its own reps only. */
export function visibleReps(user: AppUser, reps: RepEntry[]): RepEntry[] {
  if (user.permissionType === "super_admin" || user.permissionType === "all_branches") return reps;
  if (user.branchFilterType !== "sales_rep" || !user.salesReps.length) return [];
  const mine = new Set(user.salesReps.map(normalizeName));
  return reps.filter((rep) => mine.has(normalizeName(rep.name)) || (rep.odooName != null && mine.has(normalizeName(rep.odooName))));
}

// ---------------------------------------------------------------- the dashboard
export type RepSummary = RepEntry & {
  result: RepResult;
  receivables: number | null;
  invoices: number;
  customers: number;
  projectedSales: number;
  projectedAchievement: number | null;
  /** Month still open and the straight-line projection ends below the minimum. */
  minimumRisk: boolean;
  /** Sales needed per remaining day to reach the total target (null when reached or no target). */
  perDayToTarget: number | null;
};

export type ProductRow = {
  key: string;
  productName: string;
  code: string | null;
  color: string | null;
  uom: string | null;
  qty: number;
  amount: number;
  avgPrice: number | null;
  bucket: string;
  rate: number;
  commission: number;
  /** Invoice / credit-note numbers the product appears on. */
  invoices: string[];
};

export type InvoiceRow = { moveId: number; name: string; day: string; customer: string; refund: boolean; qty: number; amount: number; commission: number; lines: number };
export type CustomerRow = { name: string; invoices: number; qty: number; amount: number; commission: number };

export type RepDetail = {
  rep: RepSummary;
  products: ProductRow[];
  daily: { day: string; sales: number; collections: number; cash: number }[];
  customers: { name: string; amount: number; invoices: number }[];
  /** Line commission (before collections and bonuses) by invoice and by customer. */
  invoiceRows: InvoiceRow[];
  customerRows: CustomerRow[];
  collections: { payment: number; refund: number; cheque: number; manual: number };
};

export type CommissionsView = {
  fetchedAt: string;
  clock: MonthClock;
  months: string[];
  settings: CommissionSettings;
  source: StoredSettings["source"];
  inheritedFrom: string | null;
  sheetFound: boolean;
  reps: RepSummary[];
  /** Sheet reps that are not linked to an Odoo user yet. */
  unlinked: string[];
  totals: { sales: number; target: number; targetToDate: number; commission: number; collections: number; onTrack: number; flagged: number };
  detail: RepDetail | null;
};

function bucketOf(settings: CommissionSettings, line: RepSaleLine, useOldSystemTiers = false): { bucket: string; rate: number } {
  const rule = productRuleFor(settings.products, line.productId, line.templateId);
  const unit = line.qty ? Math.abs(line.amount / line.qty) : Math.abs(line.amount);
  const tiers = useOldSystemTiers ? settings.rules.oldSystemTiers : settings.tiers;
  const index = tierIndex(tiers, unit);
  const rate = productCommissionRateFor(settings.products, line.productId, line.templateId, unit) ?? (index >= 0 ? tiers[index].rate : 0);
  if (rule?.category) return { bucket: rule.category, rate };
  return index >= 0 ? { bucket: String.fromCharCode(65 + index), rate } : { bucket: "none", rate: 0 };
}

export async function getCommissionsView(user: AppUser, month: string, repKey: string | undefined): Promise<CommissionsView> {
  const clock = monthClock(month);
  const setup = await loadMonthSetup(month);
  const { settings } = setup.stored;
  const reps = visibleReps(user, setup.reps);
  const ids = [...new Set(reps.map((rep) => rep.odooUserId).filter((id): id is number => id != null))];
  const [lines, collections, receivables] = await Promise.all([
    getSalesLines(month, ids),
    getCollections(month, ids),
    // Debt is "today": only meaningful for the open month.
    clock.closed ? Promise.resolve([]) : getReceivables(ids),
  ]);

  const linesBy = Map.groupBy(lines, (line) => line.repId);
  const collectedBy = Map.groupBy(collections, (row) => row.repId);
  const summaries: RepSummary[] = reps.map((rep) => {
    const own = rep.odooUserId ? (linesBy.get(rep.odooUserId) ?? []) : [];
    const collected = (rep.odooUserId ? (collectedBy.get(rep.odooUserId) ?? []) : []).reduce((sum, row) => sum + row.amount, 0);
    const result = calculate(settings, rep, { lines: own, collections: collected }, {
      monthClosed: clock.closed,
      targetProgress: clock.elapsedDays / clock.monthDays,
    });
    const projectedSales = project(result.sales, clock.elapsedDays, clock.monthDays);
    const left = result.totalTarget != null ? result.totalTarget - result.sales : null;
    return {
      ...rep,
      result,
      receivables: rep.odooUserId ? (receivables.find((row) => row.repId === rep.odooUserId)?.debt ?? (clock.closed ? null : 0)) : null,
      invoices: new Set(own.filter((line) => !line.refund).map((line) => line.moveId)).size,
      customers: new Set(own.map((line) => line.partnerId)).size,
      projectedSales,
      projectedAchievement: result.totalTarget ? (100 * projectedSales) / result.totalTarget : null,
      minimumRisk: !clock.closed && projectedSales < settings.rules.minimumSales,
      perDayToTarget: left != null && left > 0 && clock.remainingDays > 0 ? left / clock.remainingDays : null,
    };
  });
  summaries.sort((a, b) => (b.result.achievement ?? -1) - (a.result.achievement ?? -1) || b.result.sales - a.result.sales);

  // One seller at a time: the chosen one, else the first in the seller list; "all" = the team summary.
  const selected = repKey === ALL_REPS ? undefined : (summaries.find((rep) => rep.key === repKey) ?? summaries.find((rep) => rep.key === repOptions(summaries)[0]?.key));
  const displayName = selected ? (await loadAppSettings()).sellerDisplayNames?.[normalizeName(selected.name)] : undefined;
  let detail: RepDetail | null = null;
  if (selected) {
    const own = selected.odooUserId ? (linesBy.get(selected.odooUserId) ?? []) : [];
    const useOldSystemTiers = selected.result.regime === "old" && settings.rules.oldSystemMode === "tiers";
    const products = new Map<string, ProductRow>();
    for (const line of own) {
      const { bucket, rate } = bucketOf(settings, line, useOldSystemTiers);
      const keyOf = `${line.productId}|${bucket}`;
      const row = products.get(keyOf) ?? { key: keyOf, productName: line.productName, code: line.code, color: line.color, uom: line.uom, qty: 0, amount: 0, avgPrice: null, bucket, rate, commission: 0, invoices: [] };
      row.qty += line.qty;
      row.amount += line.amount;
      row.commission += (line.amount * rate) / 100;
      if (!row.invoices.includes(line.moveName)) row.invoices.push(line.moveName);
      products.set(keyOf, row);
    }
    const invoiceMap = new Map<number, InvoiceRow>();
    const customerMap = new Map<string, CustomerRow & { moves: Set<number> }>();
    for (const line of own) {
      const { rate } = bucketOf(settings, line, useOldSystemTiers);
      const commission = (line.amount * rate) / 100;
      const invoice = invoiceMap.get(line.moveId) ?? { moveId: line.moveId, name: line.moveName, day: line.day, customer: line.partnerName, refund: line.refund, qty: 0, amount: 0, commission: 0, lines: 0 };
      invoice.qty += line.qty;
      invoice.amount += line.amount;
      invoice.commission += commission;
      invoice.lines += 1;
      invoiceMap.set(line.moveId, invoice);
      const customerKey = String(line.partnerId ?? line.partnerName);
      const customer = customerMap.get(customerKey) ?? { name: line.partnerName, invoices: 0, qty: 0, amount: 0, commission: 0, moves: new Set<number>() };
      customer.qty += line.qty;
      customer.amount += line.amount;
      customer.commission += commission;
      if (!line.refund) customer.moves.add(line.moveId);
      customerMap.set(customerKey, customer);
    }
    const invoiceRows = [...invoiceMap.values()].sort((a, b) => b.day.localeCompare(a.day) || b.name.localeCompare(a.name));
    const customerRows = [...customerMap.values()].map(({ moves, ...row }) => ({ ...row, invoices: moves.size })).sort((a, b) => b.amount - a.amount);
    const productRows = [...products.values()].map((row) => ({ ...row, avgPrice: row.qty ? row.amount / row.qty : null })).sort((a, b) => b.amount - a.amount);

    const [start] = monthBounds(month);
    const days = Array.from({ length: clock.monthDays }, (_, index) => {
      const date = new Date(`${start}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
    const collected = selected.odooUserId ? (collectedBy.get(selected.odooUserId) ?? []) : [];
    const daily = days.map((day) => ({
      day,
      sales: own.filter((line) => line.day === day).reduce((sum, line) => sum + line.amount, 0),
      cash: own.filter((line) => line.day === day).reduce((sum, line) => sum + line.cashAmount, 0),
      collections: collected.filter((row) => row.day === day).reduce((sum, row) => sum + row.amount, 0),
    }));
    const customers = [...Map.groupBy(own, (line) => line.partnerId ?? 0).values()]
      .map((group) => ({ name: group[0].partnerName, amount: group.reduce((sum, line) => sum + line.amount, 0), invoices: new Set(group.filter((line) => !line.refund).map((line) => line.moveId)).size }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    const sum = (source: string) => collected.filter((row) => row.source === source).reduce((total, row) => total + row.amount, 0);
    detail = {
      rep: displayName ? { ...selected, name: displayName } : selected,
      products: productRows,
      daily,
      customers,
      invoiceRows,
      customerRows,
      collections: { payment: sum("payment"), refund: sum("refund"), cheque: sum("cheque"), manual: sum("manual") },
    };
  }

  return {
    fetchedAt: new Date().toISOString(),
    clock,
    months: availableMonths(),
    settings,
    source: setup.stored.source,
    inheritedFrom: setup.stored.inheritedFrom,
    sheetFound: setup.sheet.found,
    reps: summaries,
    unlinked: reps.filter((rep) => rep.odooUserId == null).map((rep) => rep.name),
    totals: {
      sales: summaries.reduce((total, rep) => total + rep.result.sales, 0),
      target: summaries.reduce((total, rep) => total + (rep.result.totalTarget ?? 0), 0),
      targetToDate: summaries.reduce((total, rep) => total + (rep.result.totalTargetToDate ?? 0), 0),
      commission: summaries.reduce((total, rep) => total + rep.result.total, 0),
      collections: summaries.reduce((total, rep) => total + rep.result.collections, 0),
      onTrack: summaries.filter((rep) => (rep.projectedAchievement ?? 0) >= 100).length,
      flagged: summaries.filter((rep) => rep.result.belowMinimum || rep.minimumRisk).length,
    },
    detail,
  };
}

/** URL value of the "all sellers" (team summary) choice. */
export const ALL_REPS = "all";

/** The seller filter: every rep the user may see, by name. */
export function repOptions(
  reps: { key: string; name: string; odooUserId: number | null }[],
  displayNames: Record<string, string> = {},
) {
  return [...reps]
    .map(({ key, name, odooUserId }) => ({ key, name: displayNames[normalizeName(name)] ?? name, linked: odooUserId != null }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export const categoryOrder: Category[] = ["slow", "digital"];
export { cleanRepName };
