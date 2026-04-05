import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include our id field
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Attach a unique UUID to every incoming request.
 * The ID is propagated through logs and error responses for tracing.
 */
export function requestId(req: Request, _res: Response, next: NextFunction): void {
  req.id = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
  next();
}
