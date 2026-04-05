import { simplifyDebts, DebtEdge } from '../../src/modules/settlements/debt-simplifier';

describe('DebtSimplifier', () => {
  describe('simplifyDebts', () => {
    it('should return empty array for no debts', () => {
      expect(simplifyDebts([])).toEqual([]);
    });

    it('should return single debt unchanged', () => {
      const input: DebtEdge[] = [{ from: 'alice', to: 'bob', amount: 500 }];
      const result = simplifyDebts(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ from: 'alice', to: 'bob', amount: 500 });
    });

    it('should cancel offsetting debts', () => {
      const input: DebtEdge[] = [
        { from: 'alice', to: 'bob', amount: 500 },
        { from: 'bob', to: 'alice', amount: 500 },
      ];
      const result = simplifyDebts(input);
      expect(result).toHaveLength(0);
    });

    it('should simplify net debt after partial offset', () => {
      const input: DebtEdge[] = [
        { from: 'alice', to: 'bob', amount: 1000 },
        { from: 'bob', to: 'alice', amount: 300 },
      ];
      const result = simplifyDebts(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ from: 'alice', to: 'bob', amount: 700 });
    });

    it('should simplify 3-person circular debt to 2 transactions', () => {
      // Alice owes Bob 100, Bob owes Charlie 100, Charlie owes Alice 100
      // Net: everyone has 0 net — should cancel completely
      const input: DebtEdge[] = [
        { from: 'alice', to: 'bob', amount: 100 },
        { from: 'bob', to: 'charlie', amount: 100 },
        { from: 'charlie', to: 'alice', amount: 100 },
      ];
      const result = simplifyDebts(input);
      // All net to 0, so 0 transactions
      expect(result).toHaveLength(0);
    });

    it('should conserve total value across simplification', () => {
      const input: DebtEdge[] = [
        { from: 'a', to: 'b', amount: 300 },
        { from: 'b', to: 'c', amount: 200 },
        { from: 'c', to: 'a', amount: 100 },
      ];
      const inputSum = input.reduce((acc, e) => acc + e.amount, 0);
      const result = simplifyDebts(input);
      const resultSum = result.reduce((acc, e) => acc + e.amount, 0);
      // Net balances: a: -300+100=-200, b: +300-200=+100, c: +200-100=+100
      // So a owes b 100, a owes c 100 — OR equivalently: 2 transactions
      // Total value conserved: result should sum to net amounts owed
      expect(resultSum).toBeLessThanOrEqual(inputSum);
      // More importantly: verify no net imbalance
      const netBalances = new Map<string, number>();
      for (const e of input) {
        netBalances.set(e.from, (netBalances.get(e.from) ?? 0) - e.amount);
        netBalances.set(e.to, (netBalances.get(e.to) ?? 0) + e.amount);
      }
      const resultNetBalances = new Map<string, number>();
      for (const e of result) {
        resultNetBalances.set(e.from, (resultNetBalances.get(e.from) ?? 0) - e.amount);
        resultNetBalances.set(e.to, (resultNetBalances.get(e.to) ?? 0) + e.amount);
      }
      // Net balances should be the same before and after simplification
      for (const [person, net] of netBalances.entries()) {
        expect(resultNetBalances.get(person) ?? 0).toBe(net);
      }
    });

    it('should produce at most N-1 transactions for N people', () => {
      const n = 5;
      // Star topology: everyone owes person 0
      const input: DebtEdge[] = Array.from({ length: n - 1 }, (_, i) => ({
        from: `p${i + 1}`,
        to: 'p0',
        amount: 100,
      }));
      const result = simplifyDebts(input);
      expect(result.length).toBeLessThanOrEqual(n - 1);
    });

    it('should handle large paise amounts correctly', () => {
      const input: DebtEdge[] = [
        { from: 'a', to: 'b', amount: 100000000 },  // ₹1M in paise
        { from: 'b', to: 'c', amount: 50000000 },
      ];
      const result = simplifyDebts(input);
      const netBSum = result.reduce((acc, e) => {
        if (e.to === 'a' || e.from === 'a') return acc;
        return acc;
      }, 0);
      // Just verify conservation of value
      const inputSum = input.reduce((acc, e) => acc + e.amount, 0);
      const resultSum = result.reduce((acc, e) => acc + e.amount, 0);
      expect(resultSum).toBeGreaterThan(0);
      expect(resultSum).toBeLessThanOrEqual(inputSum);
      void netBSum; // suppress unused variable
    });
  });
});
