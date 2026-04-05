import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { upsertOAuthUser } from '../users/user.service';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { JwtPayload, RefreshTokenPayload, TokenPair, GoogleOAuthUserInfo } from './auth.types';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('auth.service');

const privateKey = Buffer.from(env.JWT_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');

// Redis key prefix for refresh tokens
const refreshTokenKey = (token: string): string => `refreshToken:${token}`;

/**
 * Issue a new JWT access + refresh token pair.
 */
export async function issueTokenPair(userId: string, deviceId: string): Promise<TokenPair> {
  const jti = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: userId,
    deviceId,
    iss: env.JWT_ISSUER,
    jti,
  };

  const accessToken = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_TOKEN_TTL_SECONDS,
  });

  const refreshToken = crypto.randomBytes(32).toString('hex');
  const refreshPayload: RefreshTokenPayload = {
    userId,
    deviceId,
    issuedAt: now,
  };

  await redis.set(
    refreshTokenKey(refreshToken),
    JSON.stringify(refreshPayload),
    'EX',
    env.JWT_REFRESH_TOKEN_TTL_SECONDS
  );

  log.info({ userId, deviceId }, 'Token pair issued');

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_ACCESS_TOKEN_TTL_SECONDS,
  };
}

/**
 * Rotate a refresh token — one-time use enforced.
 */
export async function rotateRefreshToken(oldToken: string, deviceId: string): Promise<TokenPair> {
  const key = refreshTokenKey(oldToken);
  const raw = await redis.get(key);

  if (!raw) {
    throw new UnauthorizedError('Refresh token invalid or expired');
  }

  const payload = JSON.parse(raw) as RefreshTokenPayload;

  if (payload.deviceId !== deviceId) {
    // Possible token theft — delete the token to prevent reuse
    await redis.del(key);
    throw new UnauthorizedError('Device mismatch — refresh token revoked');
  }

  // Delete immediately — one-time use
  await redis.del(key);

  return issueTokenPair(payload.userId, deviceId);
}

/**
 * Revoke a refresh token (logout).
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await redis.del(refreshTokenKey(token));
  log.info('Refresh token revoked');
}

/**
 * Exchange a Google OAuth authorization code for tokens.
 */
export async function exchangeGoogleCode(code: string, deviceId: string): Promise<TokenPair> {
  // Step 1: Exchange code for Google tokens
  const tokenResponse = await axios.post<{
    access_token: string;
    id_token: string;
    token_type: string;
  }>('https://oauth2.googleapis.com/token', {
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: 'postmessage', // Standard for mobile apps
    grant_type: 'authorization_code',
  });

  const { access_token } = tokenResponse.data;

  // Step 2: Get user info
  const profileResponse = await axios.get<GoogleOAuthUserInfo>(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const profile = profileResponse.data;

  if (!profile.email) {
    throw new ValidationError('Google account must have a verified email');
  }

  // Step 3: Upsert user
  const user = await upsertOAuthUser({
    provider: 'google',
    providerId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarKey: undefined, // Google avatar URL is not stored — use our S3
  });

  // Step 4: Issue token pair
  return issueTokenPair(String(user._id), deviceId);
}
