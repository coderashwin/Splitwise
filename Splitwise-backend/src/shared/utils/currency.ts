import { ValidationError } from '../errors/ValidationError';

/**
 * Validate that an amount is a non-negative integer (in paise).
 * Throws ValidationError if invalid.
 */
export function validatePaise(amount: unknown, fieldName = 'amount'): void {
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) {
    throw new ValidationError(
      `${fieldName} must be a non-negative integer (paise)`,
      { field: fieldName, received: amount }
    );
  }
}

/**
 * Validate that an amount is a positive integer (in paise, min 1).
 */
export function validatePositivePaise(amount: unknown, fieldName = 'amount'): void {
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1) {
    throw new ValidationError(
      `${fieldName} must be a positive integer (paise, minimum 1)`,
      { field: fieldName, received: amount }
    );
  }
}

/**
 * Format paise as a human-readable INR string (e.g. 10050 → "₹100.50").
 */
export function formatInr(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toFixed(2)}`;
}

/**
 * Convert rupees to paise (safe integer conversion).
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Ensure a number is a valid paise integer (no decimals).
 */
export function assertInteger(value: number, fieldName = 'amount'): number {
  if (!Number.isInteger(value)) {
    throw new ValidationError(
      `${fieldName} must be an integer, got ${value}`,
      { field: fieldName }
    );
  }
  return value;
}
