import "server-only";
import { odooEnv } from "@/lib/env";

/**
 * Read-only Odoo client (JSON-RPC, /jsonrpc).
 *
 * The API key has full access in Odoo, so this module is the ONLY way the app talks to Odoo,
 * and it refuses every method that is not a pure read. Nothing here can create, write, delete,
 * or run actions/buttons on Odoo records.
 *
 * `read_group` is Odoo's read-only aggregate (SUM / COUNT grouped by fields) — the same call the
 * Odoo pivot views use. It changes nothing; it lets the reports total hundreds of thousands of
 * journal items on the Odoo server instead of downloading every row.
 */
const READ_ONLY_METHODS: ReadonlySet<string> = new Set(["search_read", "search_count", "read", "fields_get", "read_group"]);

export class OdooError extends Error {}

type Domain = unknown[];

let uidPromise: Promise<number> | null = null;
let requestId = 0;

async function rpc<T>(service: "common" | "object", method: string, args: unknown[], timeoutMs = 55_000): Promise<T> {
  const { ODOO_URL } = odooEnv();
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: ++requestId }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) throw new OdooError(`Odoo HTTP ${response.status}`);
  const body = (await response.json()) as { result?: T; error?: { message?: string; data?: { message?: string } } };
  if (body.error) throw new OdooError(body.error.data?.message || body.error.message || "Odoo error");
  return body.result as T;
}

async function uid(): Promise<number> {
  if (!uidPromise) {
    const { ODOO_DB, ODOO_USER, ODOO_API_KEY } = odooEnv();
    uidPromise = rpc<number | false>("common", "authenticate", [ODOO_DB, ODOO_USER, ODOO_API_KEY, {}]).then((id) => {
      if (!id) throw new OdooError("Odoo authentication failed — check ODOO_DB / ODOO_USER / ODOO_API_KEY");
      return id;
    });
    uidPromise.catch(() => (uidPromise = null));
  }
  return uidPromise;
}

async function call<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}, timeoutMs?: number): Promise<T> {
  if (!READ_ONLY_METHODS.has(method)) throw new OdooError(`Blocked: "${method}" is not a read-only method`);
  const { ODOO_DB, ODOO_API_KEY } = odooEnv();
  return rpc<T>("object", "execute_kw", [ODOO_DB, await uid(), ODOO_API_KEY, model, method, args, kwargs], timeoutMs);
}

/** Archived records are included (orders cancelled by archiving must still be counted). */
const WITH_ARCHIVED = { active_test: false };

export async function searchRead<T extends Record<string, unknown>>(
  model: string,
  domain: Domain,
  fields: string[],
  options: { order?: string; limit?: number; offset?: number } = {},
): Promise<T[]> {
  return call<T[]>(model, "search_read", [domain], { fields, context: WITH_ARCHIVED, ...options });
}

/** Number of records matching a domain (read-only). */
export async function searchCount(model: string, domain: Domain): Promise<number> {
  return call<number>(model, "search_count", [domain], { context: WITH_ARCHIVED });
}

/** search_read in pages of `pageSize`, walking ids upward (stable on large tables). */
export async function searchReadAll<T extends { id: number }>(
  model: string,
  domain: Domain,
  fields: string[],
  pageSize = 5000,
): Promise<T[]> {
  const out: T[] = [];
  let lastId = 0;
  for (;;) {
    const page = await searchRead<T>(model, [...domain, ["id", ">", lastId]], fields, { order: "id asc", limit: pageSize });
    out.push(...page);
    if (page.length < pageSize) return out;
    lastId = page[page.length - 1].id;
  }
}

/** Field definitions of a model (read-only metadata). */
export async function fieldsGet(model: string, attributes: string[]): Promise<Record<string, Record<string, unknown>>> {
  return call(model, "fields_get", [], { attributes });
}

/** One row of a read_group result: the group-by values, `__count`, and the summed fields. */
export type GroupRow = Record<string, unknown> & { __count: number };

/**
 * Read-only aggregate (Odoo `read_group`, lazy=false): one row per combination of `groupBy`.
 * `fields` are "name:sum" specs; `groupBy` may use date granularity, e.g. "date:month".
 * Date groups come back as the ISO first day of the period ("2026-09-01"), or null for an empty date —
 * never Odoo's display label, which depends on the API user's language.
 */
export async function readGroup(
  model: string,
  domain: Domain,
  fields: string[],
  groupBy: string[],
  options: { orderby?: string; limit?: number; timeoutMs?: number } = {},
): Promise<GroupRow[]> {
  const { timeoutMs, ...rest } = options;
  const rows = await call<GroupRow[]>(model, "read_group", [domain, fields, groupBy], { lazy: false, context: WITH_ARCHIVED, ...rest }, timeoutMs);
  const dateGroups = groupBy.filter((name) => name.includes(":"));
  for (const row of rows) {
    const range = row.__range as Record<string, { from?: string } | false> | undefined;
    for (const name of dateGroups) {
      const value = range?.[name];
      row[name] = value && value.from ? value.from.slice(0, 10) : null;
    }
    // __domain / __range are bulky — drop them before the rows travel further.
    delete row.__domain;
    delete row.__range;
  }
  return rows;
}

/** A many2one value as Odoo returns it: [id, "Name"] or false. */
export type Many2one = [number, string] | false;
export const m2oId = (value: Many2one | undefined) => (Array.isArray(value) ? value[0] : null);
export const m2oName = (value: Many2one | undefined) => (Array.isArray(value) ? value[1] : null);
