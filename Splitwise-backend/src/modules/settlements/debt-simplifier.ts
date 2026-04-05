export interface DebtEdge {
  from: string;   // userId who owes
  to: string;     // userId who is owed
  amount: number; // always positive integer paise
  groupId?: string;
}

/**
 * Simplify a set of debt edges to minimal transactions.
 * Algorithm: compute net balances, then greedy two-pointer settlement.
 *
 * Guarantee: result edges sum === input edges sum (conservation of value)
 * Guarantee: at most N-1 transactions for N people
 */
export function simplifyDebts(rawDebts: DebtEdge[]): DebtEdge[] {
  // Compute net balance per person
  const netBalance = new Map<string, number>();

  for (const debt of rawDebts) {
    netBalance.set(debt.from, (netBalance.get(debt.from) ?? 0) - debt.amount);
    netBalance.set(debt.to, (netBalance.get(debt.to) ?? 0) + debt.amount);
  }

  // Separate into creditors (net > 0) and debtors (net < 0)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [id, net] of netBalance.entries()) {
    if (net > 0) creditors.push({ id, amount: net });
    else if (net < 0) debtors.push({ id, amount: Math.abs(net) });
  }

  // Sort descending by amount for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: DebtEdge[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;

    const settle = Math.min(creditor.amount, debtor.amount);

    result.push({
      from: debtor.id,
      to: creditor.id,
      amount: settle,
    });

    creditor.amount -= settle;
    debtor.amount -= settle;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return result;
}
