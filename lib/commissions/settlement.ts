export type ReceivableLineForSettlement = { id: number; invoiceId: number; balance: number };
export type ReconciliationForSettlement = { debitLineId: number | null; creditLineId: number | null; amount: number; date: string };

/** Returns the share of each invoice paid through reconciliations dated within the selected month. */
export function paidInvoiceShares(
  invoiceIds: ReadonlySet<number>,
  receivableLines: ReceivableLineForSettlement[],
  reconciliations: ReconciliationForSettlement[],
  start: string,
  end: string,
): Map<number, number> {
  const linesById = new Map(receivableLines.map((line) => [line.id, line]));
  const totalsByInvoice = new Map<number, number>();
  const paidByInvoice = new Map<number, number>();

  for (const line of receivableLines) {
    if (!invoiceIds.has(line.invoiceId)) continue;
    totalsByInvoice.set(line.invoiceId, (totalsByInvoice.get(line.invoiceId) ?? 0) + Math.abs(line.balance));
  }

  for (const reconciliation of reconciliations) {
    if (reconciliation.date < start || reconciliation.date > end) continue;
    const lineIds = new Set([reconciliation.debitLineId, reconciliation.creditLineId]);
    const reconciledInvoices = new Set<number>();
    for (const lineId of lineIds) {
      if (lineId == null) continue;
      const line = linesById.get(lineId);
      if (line && invoiceIds.has(line.invoiceId)) reconciledInvoices.add(line.invoiceId);
    }
    for (const invoiceId of reconciledInvoices) {
      paidByInvoice.set(invoiceId, (paidByInvoice.get(invoiceId) ?? 0) + Math.abs(reconciliation.amount));
    }
  }

  return new Map(
    [...paidByInvoice].flatMap(([invoiceId, paid]) => {
      const total = totalsByInvoice.get(invoiceId) ?? 0;
      return total < 0.005 ? [] : [[invoiceId, Math.min(paid / total, 1)] as const];
    }),
  );
}
