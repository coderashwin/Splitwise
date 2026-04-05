import {
  computeEqualSplit,
  computeExactSplit,
  computePercentageSplit,
  computeSharesSplit,
  validateSplitSum,
} from '../../src/modules/expenses/split-engine';
import { ValidationError } from '../../src/shared/errors/ValidationError';

describe('SplitEngine', () => {
  // ============================================================
  // computeEqualSplit
  // ============================================================
  describe('computeEqualSplit', () => {
    it('should split evenly among participants', () => {
      const result = computeEqualSplit(300, ['u1', 'u2', 'u3']);
      expect(result).toHaveLength(3);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(300);
      result.forEach((r) => expect(r.amount).toBe(100));
    });

    it('should distribute remainder paise to first participants', () => {
      // 100 paise among 3 people = 33, 33, 34
      const result = computeEqualSplit(100, ['u1', 'u2', 'u3']);
      expect(result[0]!.amount).toBe(34); // first gets extra
      expect(result[1]!.amount).toBe(33);
      expect(result[2]!.amount).toBe(33);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(100);
    });

    it('should handle remainder of 2 paise among 3 people', () => {
      // 101 paise among 3 = 34, 34, 33
      const result = computeEqualSplit(101, ['u1', 'u2', 'u3']);
      expect(result[0]!.amount).toBe(34);
      expect(result[1]!.amount).toBe(34);
      expect(result[2]!.amount).toBe(33);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(101);
    });

    it('should handle single participant', () => {
      const result = computeEqualSplit(500, ['u1']);
      expect(result).toHaveLength(1);
      expect(result[0]!.amount).toBe(500);
    });

    it('should handle large numbers', () => {
      const total = 999999999; // ~₹10M in paise
      const participants = Array.from({ length: 7 }, (_, i) => `u${i}`);
      const result = computeEqualSplit(total, participants);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(total);
    });

    it('should throw if no participants', () => {
      expect(() => computeEqualSplit(100, [])).toThrow(ValidationError);
    });
  });

  // ============================================================
  // computeExactSplit
  // ============================================================
  describe('computeExactSplit', () => {
    it('should return exact amounts when they sum correctly', () => {
      const result = computeExactSplit(1000, [
        { userId: 'u1', value: 600 },
        { userId: 'u2', value: 400 },
      ]);
      expect(result[0]!.amount).toBe(600);
      expect(result[1]!.amount).toBe(400);
    });

    it('should throw when amounts do not sum to total', () => {
      expect(() =>
        computeExactSplit(1000, [
          { userId: 'u1', value: 600 },
          { userId: 'u2', value: 300 }, // 900 !== 1000
        ])
      ).toThrow(ValidationError);
    });

    it('should throw when value is missing for a participant', () => {
      expect(() =>
        computeExactSplit(1000, [{ userId: 'u1' }])
      ).toThrow(ValidationError);
    });

    it('should throw when value is not an integer', () => {
      expect(() =>
        computeExactSplit(1000, [{ userId: 'u1', value: 333.33 }, { userId: 'u2', value: 666.67 }])
      ).toThrow(ValidationError);
    });

    it('should allow 0 amount for a participant', () => {
      const result = computeExactSplit(1000, [
        { userId: 'u1', value: 1000 },
        { userId: 'u2', value: 0 },
      ]);
      expect(result[0]!.amount).toBe(1000);
      expect(result[1]!.amount).toBe(0);
    });
  });

  // ============================================================
  // computePercentageSplit
  // ============================================================
  describe('computePercentageSplit', () => {
    it('should split by percentage and guarantee sum', () => {
      const result = computePercentageSplit(1000, [
        { userId: 'u1', value: 50 },
        { userId: 'u2', value: 50 },
      ]);
      expect(result[0]!.amount).toBe(500);
      expect(result[1]!.amount).toBe(500);
    });

    it('should use Largest Remainder Method for rounding', () => {
      // 1000 paise: 33.33%, 33.33%, 33.34%
      const result = computePercentageSplit(1000, [
        { userId: 'u1', value: 33.33 },
        { userId: 'u2', value: 33.33 },
        { userId: 'u3', value: 33.34 },
      ]);
      const sum = result.reduce((a, b) => a + b.amount, 0);
      expect(sum).toBe(1000);
    });

    it('should guarantee sum with awkward 3-way split', () => {
      // Each 33.333...%
      const result = computePercentageSplit(100, [
        { userId: 'u1', value: 100 / 3 },
        { userId: 'u2', value: 100 / 3 },
        { userId: 'u3', value: 100 / 3 },
      ]);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(100);
    });

    it('should throw when percentages do not sum to 100', () => {
      expect(() =>
        computePercentageSplit(1000, [
          { userId: 'u1', value: 60 },
          { userId: 'u2', value: 30 }, // 90 !== 100
        ])
      ).toThrow(ValidationError);
    });

    it('should allow small floating point imprecision (±0.001)', () => {
      // 0.001 + 0.001 + 99.999 ≈ 100.001 — just at boundary
      const result = computePercentageSplit(10000, [
        { userId: 'u1', value: 0.001 },
        { userId: 'u2', value: 0.001 },
        { userId: 'u3', value: 99.998 },
      ]);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(10000);
    });
  });

  // ============================================================
  // computeSharesSplit
  // ============================================================
  describe('computeSharesSplit', () => {
    it('should split proportionally by shares', () => {
      // 1000 paise: 1 share vs 1 share = 500 each
      const result = computeSharesSplit(1000, [
        { userId: 'u1', value: 1 },
        { userId: 'u2', value: 1 },
      ]);
      expect(result[0]!.amount).toBe(500);
      expect(result[1]!.amount).toBe(500);
    });

    it('should split 2:1 correctly', () => {
      const result = computeSharesSplit(900, [
        { userId: 'u1', value: 2 },
        { userId: 'u2', value: 1 },
      ]);
      expect(result[0]!.amount).toBe(600);
      expect(result[1]!.amount).toBe(300);
    });

    it('should guarantee sum for awkward share ratio', () => {
      const result = computeSharesSplit(100, [
        { userId: 'u1', value: 1 },
        { userId: 'u2', value: 1 },
        { userId: 'u3', value: 1 },
      ]);
      expect(result.reduce((a, b) => a + b.amount, 0)).toBe(100);
    });

    it('should throw for zero share value', () => {
      expect(() =>
        computeSharesSplit(1000, [{ userId: 'u1', value: 0 }, { userId: 'u2', value: 1 }])
      ).toThrow(ValidationError);
    });

    it('should throw for undefined share value', () => {
      expect(() =>
        computeSharesSplit(1000, [{ userId: 'u1' }])
      ).toThrow(ValidationError);
    });
  });

  // ============================================================
  // validateSplitSum
  // ============================================================
  describe('validateSplitSum', () => {
    it('should not throw when sum matches', () => {
      expect(() =>
        validateSplitSum([{ userId: 'u1', amount: 500 }, { userId: 'u2', amount: 500 }], 1000)
      ).not.toThrow();
    });

    it('should throw when sum does not match', () => {
      expect(() =>
        validateSplitSum([{ userId: 'u1', amount: 400 }], 1000)
      ).toThrow(ValidationError);
    });

    it('should throw for empty splits with non-zero total', () => {
      expect(() => validateSplitSum([], 100)).toThrow(ValidationError);
    });
  });
});
