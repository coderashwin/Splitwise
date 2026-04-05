import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError';
import { JwtPayload } from './auth.types';
import './auth.types'; // ensure global augmentation is applied

const publicKey = Buffer.from(env.JWT_PUBLIC_KEY_BASE64, 'base64').toString('utf-8');

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: env.JWT_ISSUER,
    });
    return payload as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Required auth middleware — throws 401 if no valid token.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }
  const payload = verifyToken(token);
  req.user = {
    userId: payload.sub,
    deviceId: payload.deviceId,
    jti: payload.jti,
  };
  next();
}

/**
 * Optional auth middleware — sets req.user if valid token present, continues regardless.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = {
        userId: payload.sub,
        deviceId: payload.deviceId,
        jti: payload.jti,
      };
    } catch {
      // Optional auth — silently ignore invalid token
    }
  }
  next();
}
