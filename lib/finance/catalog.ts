import "server-only";
import { m2oId, m2oName, type Many2one, searchRead } from "@/lib/odoo/client";
import { cached, MINUTE, normalizeBranch } from "./core";
import { classifyJournal, type JournalClass } from "./methods";

/**
 * Reference data the reports share: companies, branches, journals (with their payment-method family),
 * customer types and the receivable accounts. Read once every 30 minutes, read-only.
 */
export type Company = { id: number; name: string; partnerId: number | null };
export type Branch = { id: number; name: string; key: string; companyId: number | null };
export type Journal = JournalClass & { id: number; name: string; code: string; type: string; companyId: number | null; accountId: number | null };
export type CustomerType = { id: number; name: string };

export type Catalog = {
  companies: Company[];
  branches: Map<number, Branch>;
  journals: Map<number, Journal>;
  customerTypes: CustomerType[];
  /** Customer receivable accounts (chart code 1204…, "عملاء"). Employee advances, custody and partners' current accounts are excluded. */
  customerAccountIds: number[];
  /** Receivable accounts for customers under legal follow-up ("شئون قانونية" / "Legal Affairs"). */
  legalAccountIds: number[];
  /** Partners that are group companies (inter-company balances, excluded by default). */
  intercompanyPartnerIds: Set<number>;
  /** Customer type ids that mean "sister company". */
  intercompanyTypeIds: Set<number>;
  /** Payment terms that pay in one go now ("Immediate Payment"); everything else is deferred credit. */
  immediateTermIds: Set<number>;
  termNames: Map<number, string>;
};

/** Prefix of the customer receivable accounts in the company chart ("1204 عملاء"). */
export const CUSTOMER_ACCOUNT_PREFIX = "1204";

type CompanyRow = { id: number; name: string; partner_id: Many2one };
type BranchRow = { id: number; name: string; company_id: Many2one };
type JournalRow = { id: number; name: string; code: string; type: string; company_id: Many2one; default_account_id: Many2one };
type AccountRow = { id: number; code: string; name: string };
type TermRow = { id: number; name: string; line_ids: number[] };

export function getCatalog(): Promise<Catalog> {
  return cached("catalog", 30 * MINUTE, async () => {
    const [companies, branches, journals, types, accounts, terms] = await Promise.all([
      searchRead<CompanyRow>("res.company", [], ["id", "name", "partner_id"]),
      searchRead<BranchRow>("res.branch", [], ["id", "name", "company_id"]),
      searchRead<JournalRow>("account.journal", [], ["id", "name", "code", "type", "company_id", "default_account_id"]),
      searchRead<CustomerType & Record<string, unknown>>("customer.type", [], ["id", "name"]).catch(() => [] as CustomerType[]),
      searchRead<AccountRow>("account.account", [["code", "=like", `${CUSTOMER_ACCOUNT_PREFIX}%`], ["account_type", "=", "asset_receivable"]], ["id", "code", "name"]),
      searchRead<TermRow>("account.payment.term", [], ["id", "name", "line_ids"]),
    ]);

    const intercompanyTypeIds = new Set(types.filter((type) => /شقيق|sister|inter.?company/i.test(type.name)).map((type) => type.id));
    const legal = accounts.filter((account) => /قانون|legal/i.test(account.name));
    // Partners typed "sister company" + the group companies' own partners = inter-company.
    const sisterPartners = intercompanyTypeIds.size
      ? await searchRead<{ id: number }>("res.partner", [["customer_type_id", "in", [...intercompanyTypeIds]]], ["id"]).catch(() => [])
      : [];

    return {
      companies: companies
        .map((company) => ({ id: company.id, name: company.name, partnerId: m2oId(company.partner_id) }))
        .sort((a, b) => a.id - b.id),
      branches: new Map(
        branches.map((branch) => [branch.id, { id: branch.id, name: branch.name, key: normalizeBranch(branch.name), companyId: m2oId(branch.company_id) }]),
      ),
      journals: new Map(
        journals.map((journal) => [
          journal.id,
          {
            id: journal.id,
            name: journal.name,
            code: journal.code,
            type: journal.type,
            companyId: m2oId(journal.company_id),
            accountId: m2oId(journal.default_account_id),
            ...classifyJournal(journal),
          },
        ]),
      ),
      customerTypes: types.map(({ id, name }) => ({ id, name })),
      customerAccountIds: accounts.map((account) => account.id),
      legalAccountIds: legal.map((account) => account.id),
      intercompanyPartnerIds: new Set([
        ...companies.map((company) => m2oId(company.partner_id)).filter((id): id is number => id != null),
        ...sisterPartners.map((partner) => partner.id),
      ]),
      intercompanyTypeIds,
      immediateTermIds: new Set(terms.filter((term) => /immediate|فوري|نقدي/i.test(term.name) && term.line_ids.length <= 1).map((term) => term.id)),
      termNames: new Map(terms.map((term) => [term.id, term.name])),
    };
  });
}

export function branchName(catalog: Catalog, id: number | null): string {
  if (id == null) return "—";
  return catalog.branches.get(id)?.name ?? `#${id}`;
}

export function companyName(catalog: Catalog, id: number | null): string {
  if (id == null) return "—";
  return catalog.companies.find((company) => company.id === id)?.name ?? `#${id}`;
}

export { m2oId, m2oName };
