import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/ValidationError';

/**
 * Zod validation middleware factory.
 * Parses and replaces req[target] with the validated/transformed data.
 *
 * Usage:
 *   router.post('/route', validate(mySchema), controller.handler)
 *   router.get('/route', validate(querySchema, 'query'), controller.handler)
 */
export function validate(
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new ValidationError('Validation failed', result.error.issues);
    }
    // Replace with parsed/transformed data (e.g. coerced types, defaults applied)
    // Double-cast required because Express.Request has no index signature
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
