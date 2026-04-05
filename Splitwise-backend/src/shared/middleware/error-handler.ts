import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { createLogger } from '../utils/logger';

const log = createLogger('error-handler');

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = (req as Request & { id?: string }).id ?? 'unknown';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error({ err, requestId }, 'Application error');
    } else {
      log.warn({ err: { code: err.code, message: err.message }, requestId }, 'Client error');
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
        requestId,
      },
    });
    return;
  }

  // Unknown errors — log full stack, never expose to client
  log.error({ err, requestId }, 'Unexpected error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: null,
      requestId,
    },
  });
}
