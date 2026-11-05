import "server-only";
import { m2oId, type Many2one, readGroup, searchRead } from "@/lib/odoo/client";
import { type Catalog, getCatalog } from "./catalog";
import { cached, monthBounds, monthTtl } from "./core";

/**
 * Money flows by month — read-only aggregates, cached per month:
 *   payments  : customer receipts and refunds (account.payment, posted), per journal / branch / day
 * Every row says whether it is inter-company, so the filter can drop those without a new read.
 */
export type PaymentRow = {
  companyId: number | null;
  branchId: number | null;
  journalId: number | null;
  day: string;
  inbound: boolean;
  ic: boolean;
  amount: number;
  count: number;
};

const icDomain = (catalog: Catalog, ic: boolean): unknown[] => [["partner_id", ic ? "in" : "not in", [...catalog.intercompanyPartnerIds]]];

export function getPaymentsMonth(month: string): Promise<PaymentRow[]> {
  return cached(`payments:${month}`, monthTtl(month), async () => {
    const catalog = await getCatalog();
    const [start, end] = monthBounds(month);
    const base: unknown[] = [
      ["partner_type", "=", "customer"],
      ["payment_type", "in", ["inbound", "outbound"]],
      ["state", "=", "posted"],
      ["is_internal_transfer", "=", false],
      ["date", ">=", start],
      ["date", "<=", end],
    ];
    const groupBy = ["company_id", "branch_id", "journal_id", "payment_type", "date:day"];
    const [external, internal] = await Promise.all(
      [false, true].map((ic) => readGroup("account.payment", [...base, ...icDomain(catalog, ic)], ["amount:sum"], groupBy)),
    );
    const rows: PaymentRow[] = [];
    for (const [ic, list] of [[false, external], [true, internal]] as const) {
      for (const row of list) {
        rows.push({
          companyId: m2oId(row.company_id as Many2one),
          branchId: m2oId(row.branch_id as Many2one),
          journalId: m2oId(row.journal_id as Many2one),
          day: String(row["date:day"] ?? start),
          inbound: row.payment_type === "inbound",
          ic,
          amount: Number(row.amount) || 0,
          count: row.__count,
        });
      }
    }
    return rows;
  });
}

/** Loads several months in parallel (each month is cached on its own). */
export async function getPayments(months: string[]): Promise<PaymentRow[]> {
  return (await Promise.all(months.map(getPaymentsMonth))).flat();
}

/**
 * Incoming cheques by the day they were received (account.cheque, read-only aggregate). Cheques are
 * kept in their own register rather than as customer payments, so they are read separately.
 * Draft, cancelled and returned cheques are left out. Cheques carry no branch.
 */
export type ChequeRow = { companyId: number | null; bankId: number | null; bankName: string | null; day: string; ic: boolean; amount: number; count: number };

const CHEQUE_COUNTED = ["register", "deposit", "bank_collect", "cash", "transfer"];

export function getChequesMonth(month: string): Promise<ChequeRow[]> {
  return cached(`cheques-received:${month}`, monthTtl(month), async () => {
    const catalog = await getCatalog();
    const [start, end] = monthBounds(month);
    const base: unknown[] = [
      ["cheque_type", "=", "incoming"],
      ["state", "in", CHEQUE_COUNTED],
      ["cheque_receive_date", ">=", start],
      ["cheque_receive_date", "<=", end],
    ];
    const groupBy = ["company_id", "bank_id", "cheque_receive_date:day"];
    const [external, internal] = await Promise.all([false, true].map((ic) => readGroup("account.cheque", [...base, ...icDomain(catalog, ic)], ["amount:sum"], groupBy)));
    const rows: ChequeRow[] = [];
    for (const [ic, list] of [[false, external], [true, internal]] as const) {
      for (const row of list) {
        rows.push({
          companyId: m2oId(row.company_id as Many2one),
          bankId: m2oId(row.bank_id as Many2one),
          bankName: Array.isArray(row.bank_id) ? (row.bank_id as [number, string])[1] : null,
          day: String(row["cheque_receive_date:day"] ?? start),
          ic,
          amount: Number(row.amount) || 0,
          count: row.__count,
        });
      }
    }
    return rows;
  });
}

export async function getChequesReceived(months: string[]): Promise<ChequeRow[]> {
  return (await Promise.all(months.map(getChequesMonth))).flat();
}

/**
 * Money actually collected from incoming cheques: the amounts that landed in a bank or cash account from a
 * cheque (journal items linked to the cheque on a bank / cash account), on the day they landed. This counts
 * a cheque when it is really collected — not when it was entered, which is often early or with an old date —
 * and counts partial cash collections of one cheque at their own amounts and dates. Read-only aggregate.
 */
export function getChequesCollectedMonth(month: string): Promise<ChequeRow[]> {
  return cached(`cheques-collected-cash:${month}`, monthTtl(month), async () => {
    const catalog = await getCatalog();
    const [start, end] = monthBounds(month);
    const lines = await readGroup(
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
      // cheque_id on journal items is not stored (can filter, cannot group): group by entry, then read its cheque.
      ["company_id", "move_id", "date:day"],
    );
    const moveIds = [...new Set(lines.map((row) => m2oId(row.move_id as Many2one)).filter((id): id is number => id != null))];
    const moves = moveIds.length ? await searchRead<{ id: number; account_cheque_id: Many2one }>("account.move", [["id", "in", moveIds]], ["id", "account_cheque_id"]) : [];
    const chequeOf = new Map(moves.map((move) => [move.id, m2oId(move.account_cheque_id)]));
    const ids = [...new Set([...chequeOf.values()].filter((id): id is number => id != null))];
    const cheques = ids.length ? await searchRead<{ id: number; bank_id: Many2one; partner_id: Many2one }>("account.cheque", [["id", "in", ids]], ["id", "bank_id", "partner_id"]) : [];
    const byId = new Map(cheques.map((cheque) => [cheque.id, cheque]));
    const rows = new Map<string, ChequeRow>();
    for (const line of lines) {
      const amount = Number(line.balance) || 0;
      if (Math.abs(amount) < 0.005) continue;
      const cheque = byId.get(chequeOf.get(m2oId(line.move_id as Many2one) ?? -1) ?? -1);
      const partnerId = cheque ? m2oId(cheque.partner_id) : null;
      const row: ChequeRow = {
        companyId: m2oId(line.company_id as Many2one),
        bankId: cheque ? m2oId(cheque.bank_id) : null,
        bankName: cheque && Array.isArray(cheque.bank_id) ? cheque.bank_id[1] : null,
        day: String(line["date:day"] ?? start),
        ic: partnerId != null && catalog.intercompanyPartnerIds.has(partnerId),
        amount,
        count: amount > 0 ? line.__count : 0,
      };
      const key = `${row.companyId}|${row.bankId}|${row.day}|${row.ic}`;
      const entry = rows.get(key);
      if (entry) {
        entry.amount += row.amount;
        entry.count += row.count;
      } else rows.set(key, row);
    }
    return [...rows.values()];
  });
}

export async function getChequesCollected(months: string[]): Promise<ChequeRow[]> {
  return (await Promise.all(months.map(getChequesCollectedMonth))).flat();
}

/**
 * Customer receipts entered as manual journal entries in cash or bank journals (not as payments) —
 * e.g. "دفعه تحت حساب" in the main wholesale treasury. Read from the customer receivable lines of those
 * entries: a credit is money received from the customer, a debit money paid back. Without these the
 * report would miss real collections.
 */
export type ManualRow = { companyId: number | null; branchId: number | null; journalId: number | null; day: string; ic: boolean; amount: number; count: number };

export function getManualReceiptsMonth(month: string): Promise<ManualRow[]> {
  return cached(`manual-receipts:${month}`, monthTtl(month), async () => {
    const catalog = await getCatalog();
    if (!catalog.customerAccountIds.length) return [];
    const [start, end] = monthBounds(month);
    const base: unknown[] = [
      ["account_id", "in", catalog.customerAccountIds],
      ["parent_state", "=", "posted"],
      ["journal_id.type", "in", ["cash", "bank"]],
      ["move_id.payment_id", "=", false],
      ["date", ">=", start],
      ["date", "<=", end],
    ];
    const groupBy = ["company_id", "branch_id", "journal_id", "date:day"];
    const [external, internal] = await Promise.all([false, true].map((ic) => readGroup("account.move.line", [...base, ...icDomain(catalog, ic)], ["balance:sum"], groupBy)));
    const rows: ManualRow[] = [];
    for (const [ic, list] of [[false, external], [true, internal]] as const) {
      for (const row of list) {
        const amount = -(Number(row.balance) || 0);
        if (Math.abs(amount) < 0.005) continue;
        rows.push({
          companyId: m2oId(row.company_id as Many2one),
          branchId: m2oId(row.branch_id as Many2one),
          journalId: m2oId(row.journal_id as Many2one),
          day: String(row["date:day"] ?? start),
          ic,
          amount,
          count: amount > 0 ? row.__count : 0,
        });
      }
    }
    return rows;
  });
}

export async function getManualReceipts(months: string[]): Promise<ManualRow[]> {
  return (await Promise.all(months.map(getManualReceiptsMonth))).flat();
}
