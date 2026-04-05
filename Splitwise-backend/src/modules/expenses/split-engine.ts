import { ValidationError } from '../../shared/errors/ValidationError';

export interface SplitParticipant {
  userId: string;
  value?: number; // percentage | exact amount | shares (not needed for equal)
}

export interface SplitResult {
  userId: string;
  amount: number; // integer paise
}

/**
 * Equal split using Largest Remainder Method to handle integer rounding.
 * Guarantees: results.sum === totalAmount
 */
export function computeEqualSplit(totalAmount: number, participants: string[]): SplitResult[] {
  if (participants.length === 0) {
    throw new ValidationError('At least one participant required');
  }

  const n = participants.length;
  const base = Math.floor(totalAmount / n);
  const remainder = totalAmount - base * n;

  return participants.map((userId, index) => ({
    userId,
    amount: index < remainder ? base + 1 : base,
  }));
}

/**
 * Exact split — each participant's amount is specified directly.
 * Validates that amounts sum to totalAmount.
 */
export function computeExactSplit(
  totalAmount: number,
  participants: SplitParticipant[]
): SplitResult[] {
  if (participants.length === 0) {
    throw new ValidationError('At least one participant required');
  }

  for (const p of participants) {
    if (p.value === undefined) {
      throw new ValidationError(`Exact split requires a value for each participant (missing for ${p.userId})`);
    }
    if (!Number.isInteger(p.value) || p.value < 0) {
      throw new ValidationError(`Exact split amounts must be non-negative integers (paise) — got ${p.value} for ${p.userId}`);
    }
  }

  const sum = participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
  if (sum !== totalAmount) {
    throw new ValidationError(
      `Exact split amounts must sum to total. Expected ${totalAmount}, got ${sum}`
    );
  }

  return participants.map((p) => ({ userId: p.userId, amount: p.value! }));
}

/**
 * Percentage split using Largest Remainder Method.
 * Validates percentages sum to 100 (±0.001 tolerance).
 * Guarantees: results.sum === totalAmount
 */
export function computePercentageSplit(
  totalAmount: number,
  participants: SplitParticipant[]
): SplitResult[] {
  if (participants.length === 0) {
    throw new ValidationError('At least one participant required');
  }

  for (const p of participants) {
    if (p.value === undefined || p.value < 0) {
      throw new ValidationError(`Invalid percentage for ${p.userId}`);
    }
  }

  const totalPercentage = participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
  if (Math.abs(totalPercentage - 100) > 0.001) {
    throw new ValidationError(
      `Percentages must sum to 100. Got ${totalPercentage}`
    );
  }

  // Compute exact amounts (floating), then floor
  const exactAmounts = participants.map((p) => (totalAmount * (p.value ?? 0)) / 100);
  const floored = exactAmounts.map(Math.floor);
  const remainder = totalAmount - floored.reduce((a, b) => a + b, 0);

  // Distribute remainder by largest fractional part (Largest Remainder Method)
  const fractionals = exactAmounts.map((exact, i) => ({
    index: i,
    frac: exact - Math.floor(exact),
  }));
  fractionals.sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    floored[fractionals[i]!.index]! += 1;
  }

  return participants.map((p, i) => ({ userId: p.userId, amount: floored[i]! }));
}

/**
 * Shares split using Largest Remainder Method.
 * Guarantees: results.sum === totalAmount
 */
export function computeSharesSplit(
  totalAmount: number,
  participants: SplitParticipant[]
): SplitResult[] {
  if (participants.length === 0) {
    throw new ValidationError('At least one participant required');
  }

  for (const p of participants) {
    if (p.value === undefined || p.value <= 0) {
      throw new ValidationError(`Share value must be positive for ${p.userId}`);
    }
  }

  const totalShares = participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
  if (totalShares <= 0) {
    throw new ValidationError('Total shares must be positive');
  }

  const exactAmounts = participants.map((p) => (totalAmount * (p.value ?? 0)) / totalShares);
  const floored = exactAmounts.map(Math.floor);
  const remainder = totalAmount - floored.reduce((a, b) => a + b, 0);

  const fractionals = exactAmounts.map((exact, i) => ({
    index: i,
    frac: exact - Math.floor(exact),
  }));
  fractionals.sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    floored[fractionals[i]!.index]! += 1;
  }

  return participants.map((p, i) => ({ userId: p.userId, amount: floored[i]! }));
}

/**
 * Final guard — validates that computed splits sum to expected total.
 * Throws ValidationError if sum !== expectedTotal.
 */
export function validateSplitSum(splits: SplitResult[], expectedTotal: number): void {
  const sum = splits.reduce((acc, s) => acc + s.amount, 0);
  if (sum !== expectedTotal) {
    throw new ValidationError(
      `Split amounts (${sum} paise) do not sum to expense total (${expectedTotal} paise)`
    );
  }
}
