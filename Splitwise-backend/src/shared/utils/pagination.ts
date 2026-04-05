import { ValidationError } from '../errors/ValidationError';

export interface CursorPayload {
  _id: string;
  date: string; // ISO string
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    count: number;
  };
}

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      '_id' in parsed &&
      'date' in parsed &&
      typeof (parsed as Record<string, unknown>)['_id'] === 'string' &&
      typeof (parsed as Record<string, unknown>)['date'] === 'string'
    ) {
      return parsed as CursorPayload;
    }
    throw new ValidationError('Invalid cursor format');
  } catch {
    throw new ValidationError('Invalid cursor format');
  }
}

export function buildCursorQuery(cursor?: string): Record<string, unknown> {
  if (!cursor) return {};
  const payload = decodeCursor(cursor);
  const cursorDate = new Date(payload.date);
  return {
    $or: [
      { date: { $lt: cursorDate } },
      { date: cursorDate, _id: { $lt: payload._id } },
    ],
  };
}

export function buildPaginatedResult<T extends { _id: unknown; date?: unknown }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasMore = items.length === limit + 1;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];

  const nextCursor =
    hasMore && lastItem != null
      ? encodeCursor({
          _id: String(lastItem._id),
          date: lastItem.date instanceof Date ? lastItem.date.toISOString() : String(lastItem.date ?? ''),
        })
      : null;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor,
      count: data.length,
    },
  };
}
