import "server-only";
import { createHash } from "node:crypto";
import { m2oId, m2oName, type Many2one, readGroup, searchRead, searchReadAll } from "@/lib/odoo/client";
import { type Catalog, getCatalog } from "@/lib/finance/catalog";
import { addMonths, cached, currentMonth, MINUTE, monthBounds, monthTtl } from "@/lib/finance/core";
import { payMethodOf } from "@/lib/finance/methods";
import type { SaleLine } from "./engine";
import { matchProductName, normalizeName } from "./names";
import { paidInvoiceShares } from "./settlement";

/**
 * Everything the commissions read from Odoo — read-only (lib/odoo/client.ts refuses any write).
 *
 *   Sales        posted customer invoices and credit notes whose Salesperson (account.move.sales_rep_id)
 *                is the rep, by invoice date; product lines at their net amount after discount.
 *   Collections  the same receipts as the Customer Payments report, credited to the rep through the
 *                "Commission Users" of the payment / cheque (or, for treasury entries, the customer's
 *                salesperson): payments − refunds, cheques on the day they were collected, treasury receipts.
 *   Receivables  gross debt today of the customers whose salesperson is the rep.
 * Group companies (sister companies) are left out everywhere, as in the finance reports.
 */

const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
const icList = (catalog: Catalog) => [...catalog.intercompanyPartnerIds];
const isWholesale = (name: string) => /جملة|wholesale/i.test(name);
const key = (ids: number[]) => [...ids].sort((a, b) => a - b).join(",");

// ---------------------------------------------------------------- sales reps
export type OdooRep = { id: number; name: string; sales: number };

/** Salespeople on wholesale invoices over the last six months (largest first): the names the target sheet is matched to. */
export function getRepCandidates(): Promise<OdooRep[]> {
  return cached("rep-candidates", 30 * MINUTE, async () => {
    const catalog = await getCatalog();
    const wholesale = catalog.companies.filter((company) => isWholesale(company.name)).map((company) => company.id);
    const [start] = monthBounds(addMonths(currentMonth(), -6));
    const rows = await readGroup(
      "account.move",
      [
        ["move_type", "in", ["out_invoice", "out_refund"]],
        ["state", "=", "posted"],
        ["sales_rep_id", "!=", false],
        ["invoice_date", ">=", start],
        ...(wholesale.length ? [["company_id", "in", wholesale]] : []),
        ["partner_id", "not in", icList(catalog)],
      ],
      ["amount_untaxed_signed:sum"],
      ["sales_rep_id"],
    );
    return rows
      .map((row) => ({ id: m2oId(row.sales_rep_id as Many2one)!, name: m2oName(row.sales_rep_id as Many2one) ?? "", sales: Number(row.amount_untaxed_signed) || 0 }))
      .filter((rep) => rep.id != null && rep.sales > 0)
      .sort((a, b) => b.sales - a.sales);
  });
}

/** Names of specific users (a rep linked by hand to a user who is not among the candidates). */
export async function getUserNames(ids: number[]): Promise<Map<number, string>> {
  if (!ids.length) return new Map();
  const rows = await searchRead<{ id: number; name: string }>("res.users", [["id", "in", ids]], ["id", "name"]);
  return new Map(rows.map((row) => [row.id, row.name]));
}

// ---------------------------------------------------------------- products
export type ProductInfo = { id: number; templateId: number; name: string; code: string | null; color: string | null; uom: string | null };

type VariantRow = { id: number; display_name: string; default_code: string | false; product_tmpl_id: Many2one; product_template_attribute_value_ids: number[]; uom_id: Many2one };

async function readVariants(domain: unknown[]): Promise<ProductInfo[]> {
  const variants = await searchRead<VariantRow>("product.product", domain, ["id", "display_name", "default_code", "product_tmpl_id", "product_template_attribute_value_ids", "uom_id"]);
  const valueIds = [...new Set(variants.flatMap((variant) => variant.product_template_attribute_value_ids))];
  const values = valueIds.length
    ? await searchRead<{ id: number; name: string; attribute_id: Many2one }>("product.template.attribute.value", [["id", "in", valueIds]], ["id", "name", "attribute_id"])
    : [];
  const valueName = new Map(values.map((value) => [value.id, { name: value.name, color: /colou?r|لون/i.test(m2oName(value.attribute_id) ?? "") }]));
  return variants.map((variant) => {
    const own = variant.product_template_attribute_value_ids.map((id) => valueName.get(id)).filter((value) => value != null);
    const colors = own.filter((value) => value.color).map((value) => value.name);
    return {
      id: variant.id,
      templateId: m2oId(variant.product_tmpl_id) ?? variant.id,
      name: m2oName(variant.product_tmpl_id) ?? variant.display_name,
      code: variant.default_code || null,
      color: (colors.length ? colors : own.map((value) => value.name)).join(" · ") || null,
      uom: m2oName(variant.uom_id),
    };
  });
}

const productCache = new Map<number, ProductInfo>();

async function getProducts(ids: number[]): Promise<Map<number, ProductInfo>> {
  const missing = ids.filter((id) => !productCache.has(id));
  for (const part of chunk(missing, 1000)) {
    for (const info of await readVariants([["id", "in", part]])) productCache.set(info.id, info);
  }
  return new Map(ids.flatMap((id) => (productCache.has(id) ? [[id, productCache.get(id)!] as const] : [])));
}

export type ProductSearchResult = { templateId: number; name: string; code: string | null; variants: { id: number; color: string | null }[] };

/** Settings page: products by name or internal code, with their colours (variants). */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const text = query.trim();
  if (text.length < 2) return [];
  const templates = await searchRead<{ id: number; name: string; default_code: string | false }>(
    "product.template",
    [["sale_ok", "=", true], ["active", "=", true], "|", ["name", "ilike", text], ["default_code", "ilike", text]],
    ["id", "name", "default_code"],
    { limit: 25, order: "default_code asc, name asc" },
  );
  if (!templates.length) return [];
  const variants = await readVariants([["product_tmpl_id", "in", templates.map((template) => template.id)], ["active", "=", true]]);
  return templates.map((template) => ({
    templateId: template.id,
    name: template.default_code ? `[${template.default_code}] ${template.name}` : template.name,
    code: template.default_code || null,
    variants: variants
      .filter((variant) => variant.templateId === template.id)
      .map((variant) => ({ id: variant.id, color: variant.color }))
      .sort((a, b) => (a.color ?? "").localeCompare(b.color ?? "", "en", { numeric: true })),
  }));
}

export type AutoProductMatch = { templateId: number; name: string; code: string | null };

/** Exact normalized name/code matching for the product names imported from the target workbook. */
export function autoMatchProducts(names: string[]): Promise<Map<string, AutoProductMatch>> {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  if (!uniqueNames.length) return Promise.resolve(new Map());
  const cacheKey = createHash("sha256").update(uniqueNames.map(normalizeName).sort().join("\u001f")).digest("hex");
  return cached(`product-commission-auto-match:v2:${cacheKey}`, 30 * MINUTE, async () => {
    const matches = new Map<string, AutoProductMatch>();
    for (const batch of chunk(uniqueNames, 5)) {
      const results = await Promise.all(batch.map((name) => searchProducts(name)));
      batch.forEach((name, index) => {
        const found = results[index];
        const match = matchProductName(
          name,
          found.map((product) => ({ id: product.templateId, name: product.name, code: product.code })),
        );
        if (match) {
          const product = found.find((item) => item.templateId === match.id);
          if (product) matches.set(normalizeName(name), { templateId: product.templateId, name: product.name, code: product.code });
        }
      });
    }
    return matches;
  });
}

// ---------------------------------------------------------------- sales
export type RepSaleLine = SaleLine & {
  repId: number;
  moveId: number;
  moveName: string;
  invoiceAmount: number;
  refund: boolean;
  partnerId: number | null;
  partnerName: string;
  productName: string;
  code: string | null;
  color: string | null;
  uom: string | null;
  unitPrice: number | null;
  discount: number | null;
};

type MoveRow = { id: number; name: string; move_type: string; invoice_date: string | false; sales_rep_id: Many2one; partner_id: Many2one; amount_total_signed: number };
type LineRow = { id: number; move_id: Many2one; product_id: Many2one; quantity: number; balance: number; price_unit: number | false; discount: number | false };
type ReceivableLineRow = { id: number; move_id: Many2one; balance: number };
type ReconciliationRow = { id: number; debit_move_id: Many2one; credit_move_id: Many2one; amount: number; max_date: string | false };
type MoveLineDateRow = { id: number; date: string | false };

export function getSalesLines(month: string, repIds: number[]): Promise<RepSaleLine[]> {
  if (!repIds.length) return Promise.resolve([]);
  return cached(`commission-sales:${month}:${key(repIds)}`, monthTtl(month), async () => {
    const catalog = await getCatalog();
    const [start, end] = monthBounds(month);
    const moves = await searchReadAll<MoveRow>(
      "account.move",
      [
        ["move_type", "in", ["out_invoice", "out_refund"]],
        ["state", "=", "posted"],
        ["invoice_date", ">=", start],
        ["invoice_date", "<=", end],
        ["sales_rep_id", "in", repIds],
        ["partner_id", "not in", icList(catalog)],
      ],
      ["id", "name", "move_type", "invoice_date", "sales_rep_id", "partner_id", "amount_total_signed"],
    );
    const moveById = new Map(moves.map((move) => [move.id, move]));
    const invoiceIds = new Set(moves.filter((move) => move.move_type === "out_invoice").map((move) => move.id));
    const [lines, receivableLines] = await Promise.all([
      Promise.all(
        chunk(moves.map((move) => move.id), 800).map((ids) =>
          searchReadAll<LineRow>("account.move.line", [["move_id", "in", ids], ["display_type", "=", "product"]], ["id", "move_id", "product_id", "quantity", "balance", "price_unit", "discount"]),
        ),
      ).then((parts) => parts.flat()),
      Promise.all(
        chunk([...invoiceIds], 800).map((ids) =>
          searchReadAll<ReceivableLineRow>(
            "account.move.line",
            [["move_id", "in", ids], ["account_id.account_type", "=", "asset_receivable"]],
            ["id", "move_id", "balance"],
          ),
        ),
      ).then((parts) => parts.flat()),
    ]);
    const receivableLineIds = receivableLines.map((line) => line.id);
    const [reconciliationParts, products] = await Promise.all([
      Promise.all(
        chunk(receivableLineIds, 800).map((ids) =>
          searchReadAll<ReconciliationRow>(
            "account.partial.reconcile",
            ["|", ["debit_move_id", "in", ids], ["credit_move_id", "in", ids], ["max_date", "<=", end]],
            ["id", "debit_move_id", "credit_move_id", "amount", "max_date"],
          ),
        ),
      ),
      getProducts([...new Set(lines.map((line) => m2oId(line.product_id)).filter((id): id is number => id != null))]),
    ]);
    const rawReconciliations = [...new Map(reconciliationParts.flat().map((row) => [row.id, row])).values()]
      .filter((row): row is ReconciliationRow & { max_date: string } => typeof row.max_date === "string");
    const receivableLineIdSet = new Set(receivableLineIds);
    const counterpartLineIds = [...new Set(rawReconciliations.flatMap((row) => {
      const debitLineId = m2oId(row.debit_move_id);
      const creditLineId = m2oId(row.credit_move_id);
      if (debitLineId != null && receivableLineIdSet.has(debitLineId)) return creditLineId == null ? [] : [creditLineId];
      if (creditLineId != null && receivableLineIdSet.has(creditLineId)) return debitLineId == null ? [] : [debitLineId];
      return [];
    }))];
    const counterpartLines = (
      await Promise.all(
        chunk(counterpartLineIds, 800).map((ids) =>
          searchReadAll<MoveLineDateRow>("account.move.line", [["id", "in", ids]], ["id", "date"]),
        ),
      )
    ).flat();
    const counterpartDateByLine = new Map(counterpartLines.flatMap((line) => (typeof line.date === "string" ? [[line.id, line.date] as const] : [])));
    const reconciliations = rawReconciliations.flatMap((row) => {
      const debitLineId = m2oId(row.debit_move_id);
      const creditLineId = m2oId(row.credit_move_id);
      const invoiceLineId = debitLineId != null && receivableLineIdSet.has(debitLineId) ? debitLineId : creditLineId;
      const counterpartLineId = invoiceLineId === debitLineId ? creditLineId : debitLineId;
      const date = counterpartLineId == null ? undefined : counterpartDateByLine.get(counterpartLineId);
      return invoiceLineId == null || !receivableLineIdSet.has(invoiceLineId) || date == null
        ? []
        : [{ debitLineId, creditLineId, amount: Number(row.amount) || 0, date }];
    });
    const paidInvoiceSharesById = paidInvoiceShares(
      invoiceIds,
      receivableLines.flatMap((line) => {
        const invoiceId = m2oId(line.move_id);
        return invoiceId == null ? [] : [{ id: line.id, invoiceId, balance: Number(line.balance) || 0 }];
      }),
      reconciliations,
      start,
      end,
    );

    const out: RepSaleLine[] = [];
    for (const line of lines) {
      const move = moveById.get(m2oId(line.move_id) ?? -1);
      if (!move) continue;
      const amount = -(Number(line.balance) || 0);
      if (Math.abs(amount) < 0.005 && !line.quantity) continue;
      const refund = move.move_type === "out_refund";
      const productId = m2oId(line.product_id) ?? 0;
      const product = products.get(productId);
      out.push({
        repId: m2oId(move.sales_rep_id)!,
        moveId: move.id,
        moveName: move.name,
        invoiceAmount: (refund ? -1 : 1) * Math.abs(Number(move.amount_total_signed) || 0),
        refund,
        partnerId: m2oId(move.partner_id),
        partnerName: m2oName(move.partner_id) ?? "",
        productId,
        templateId: product?.templateId ?? productId,
        productName: product?.name ?? m2oName(line.product_id) ?? "—",
        code: product?.code ?? null,
        color: product?.color ?? null,
        uom: product?.uom ?? null,
        unitPrice: typeof line.price_unit === "number" && Number.isFinite(line.price_unit) ? Math.abs(line.price_unit) : null,
        discount: typeof line.discount === "number" && Number.isFinite(line.discount) ? line.discount : null,
        qty: (refund ? -1 : 1) * Math.abs(Number(line.quantity) || 0),
        amount,
        cashAmount: !refund ? amount * (paidInvoiceSharesById.get(move.id) ?? 0) : 0,
        day: move.invoice_date || start,
      });
    }
    return out;
  });
}

// ---------------------------------------------------------------- collections
export type Collection = { repId: number; day: string; source: "payment" | "refund" | "cheque" | "manual"; amount: number };

type ChequeRow = { id: number; partner_id: Many2one; commission_users_ids: number[] };

export function getCollections(month: string, repIds: number[]): Promise<Collection[]> {
  if (!repIds.length) return Promise.resolve([]);
  return cached(`commission-collections:${month}:${key(repIds)}`, monthTtl(month), async () => {
    const catalog = await getCatalog();
    const [start, end] = monthBounds(month);
    const wanted = new Set(repIds);
    const ic = icList(catalog);
    const out: Collection[] = [];

    const [payments, chequeLines, manual] = await Promise.all([
      // 1. Customer payments (and refunds paid back), credited to the payment's commission users.
      readGroup(
        "account.payment",
        [
          ["partner_type", "=", "customer"],
          ["payment_type", "in", ["inbound", "outbound"]],
          ["state", "=", "posted"],
          ["is_internal_transfer", "=", false],
          ["date", ">=", start],
          ["date", "<=", end],
          ["partner_id", "not in", ic],
          ["commission_users_ids", "in", repIds],
        ],
        ["amount:sum"],
        ["commission_users_ids", "payment_type", "journal_id", "date:day"],
      ),
      // 2. Money collected from incoming cheques (bank / cash side), on the day it landed.
      readGroup(
        "account.move.line",
        [
          ["cheque_id", "!=", false],
          ["cheque_id.cheque_type", "=", "incoming"],
          ["parent_state", "=", "posted"],
          ["account_id.account_type", "=", "asset_cash"],
          ["date", ">=", start],
          ["date", "<=", end],
        ],
        ["balance:sum"],
        ["move_id", "date:day"],
      ),
      // 3. Customer receipts entered as treasury journal entries (no payment record).
      catalog.customerAccountIds.length
        ? readGroup(
            "account.move.line",
            [
              ["account_id", "in", catalog.customerAccountIds],
              ["parent_state", "=", "posted"],
              ["journal_id.type", "in", ["cash", "bank"]],
              ["move_id.payment_id", "=", false],
              ["date", ">=", start],
              ["date", "<=", end],
              ["partner_id", "not in", ic],
              ["partner_id.user_id", "in", repIds],
            ],
            ["balance:sum"],
            ["partner_id", "journal_id", "date:day"],
          )
        : Promise.resolve([]),
    ]);

    for (const row of payments) {
      const repId = m2oId(row.commission_users_ids as Many2one);
      if (repId == null || !wanted.has(repId)) continue;
      const journal = catalog.journals.get(m2oId(row.journal_id as Many2one) ?? -1);
      if (!journal || !payMethodOf(journal.family)) continue;
      const inbound = row.payment_type === "inbound";
      const amount = Number(row.amount) || 0;
      out.push({ repId, day: String(row["date:day"] ?? start), source: inbound ? "payment" : "refund", amount: inbound ? amount : -amount });
    }

    // Cheques: entry → cheque → its commission users (else the customer's salesperson); split evenly between them.
    const moveIds = [...new Set(chequeLines.map((row) => m2oId(row.move_id as Many2one)).filter((id): id is number => id != null))];
    if (moveIds.length) {
      const moves = (await Promise.all(chunk(moveIds, 1000).map((ids) => searchRead<{ id: number; account_cheque_id: Many2one }>("account.move", [["id", "in", ids]], ["id", "account_cheque_id"])))).flat();
      const chequeOf = new Map(moves.map((move) => [move.id, m2oId(move.account_cheque_id)]));
      const chequeIds = [...new Set([...chequeOf.values()].filter((id): id is number => id != null))];
      const cheques = (await Promise.all(chunk(chequeIds, 1000).map((ids) => searchRead<ChequeRow>("account.cheque", [["id", "in", ids]], ["id", "partner_id", "commission_users_ids"])))).flat();
      const partnerIds = [...new Set(cheques.filter((cheque) => !cheque.commission_users_ids.length).map((cheque) => m2oId(cheque.partner_id)).filter((id): id is number => id != null))];
      const partnerRep = await partnerUsers(partnerIds);
      const byId = new Map(cheques.map((cheque) => [cheque.id, cheque]));
      for (const row of chequeLines) {
        const cheque = byId.get(chequeOf.get(m2oId(row.move_id as Many2one) ?? -1) ?? -1);
        if (!cheque) continue;
        const partnerId = m2oId(cheque.partner_id);
        if (partnerId != null && catalog.intercompanyPartnerIds.has(partnerId)) continue;
        const users = cheque.commission_users_ids.length ? cheque.commission_users_ids : [partnerRep.get(partnerId ?? -1)].filter((id): id is number => id != null);
        const mine = users.filter((id) => wanted.has(id));
        const amount = Number(row.balance) || 0;
        if (!mine.length || Math.abs(amount) < 0.005) continue;
        for (const repId of mine) out.push({ repId, day: String(row["date:day"] ?? start), source: "cheque", amount: amount / users.length });
      }
    }

    if (manual.length) {
      const partnerRep = await partnerUsers([...new Set(manual.map((row) => m2oId(row.partner_id as Many2one)).filter((id): id is number => id != null))]);
      for (const row of manual) {
        const journal = catalog.journals.get(m2oId(row.journal_id as Many2one) ?? -1);
        if (!journal || !payMethodOf(journal.family)) continue;
        const repId = partnerRep.get(m2oId(row.partner_id as Many2one) ?? -1);
        const amount = -(Number(row.balance) || 0);
        if (repId == null || !wanted.has(repId) || Math.abs(amount) < 0.005) continue;
        out.push({ repId, day: String(row["date:day"] ?? start), source: "manual", amount });
      }
    }
    return out;
  });
}

async function partnerUsers(ids: number[]): Promise<Map<number, number>> {
  const rows = (await Promise.all(chunk(ids, 2000).map((part) => searchRead<{ id: number; user_id: Many2one }>("res.partner", [["id", "in", part]], ["id", "user_id"])))).flat();
  return new Map(rows.flatMap((row) => (m2oId(row.user_id) != null ? [[row.id, m2oId(row.user_id)!] as const] : [])));
}

// ---------------------------------------------------------------- receivables
export type RepReceivable = { repId: number; debt: number; customers: number };

/** Gross customer debt today of each rep's customers (customers in credit are not deducted). */
export function getReceivables(repIds: number[]): Promise<RepReceivable[]> {
  if (!repIds.length) return Promise.resolve([]);
  return cached(
    `commission-receivables:${key(repIds)}`,
    15 * MINUTE,
    async () => {
      const catalog = await getCatalog();
      if (!catalog.customerAccountIds.length) return [];
      const rows = await readGroup(
        "account.move.line",
        [
          ["account_id", "in", catalog.customerAccountIds],
          ["parent_state", "=", "posted"],
          ["partner_id", "not in", icList(catalog)],
          ["partner_id.user_id", "in", repIds],
        ],
        ["balance:sum"],
        ["partner_id", "company_id"],
        { timeoutMs: 110_000 },
      );
      const partnerRep = await partnerUsers([...new Set(rows.map((row) => m2oId(row.partner_id as Many2one)).filter((id): id is number => id != null))]);
      const out = new Map<number, RepReceivable>();
      for (const row of rows) {
        const balance = Number(row.balance) || 0;
        if (balance < 0.005) continue;
        const repId = partnerRep.get(m2oId(row.partner_id as Many2one) ?? -1);
        if (repId == null) continue;
        const entry = out.get(repId) ?? { repId, debt: 0, customers: 0 };
        entry.debt += balance;
        entry.customers += 1;
        out.set(repId, entry);
      }
      return [...out.values()];
    },
    { staleMs: 6 * 60 * MINUTE },
  );
}
