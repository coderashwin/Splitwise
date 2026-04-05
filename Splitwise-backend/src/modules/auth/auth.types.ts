export interface JwtPayload {
  sub: string;     // userId
  deviceId: string;
  iat: number;
  exp: number;
  iss: string;     // env.JWT_ISSUER
  jti: string;     // uuid — for future blacklisting
}

export interface RefreshTokenPayload {
  userId: string;
  deviceId: string;
  issuedAt: number; // Unix timestamp
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface GoogleOAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthenticatedRequest {
  userId: string;
  deviceId: string;
  jti: string;
}

// Augment Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedRequest;
    }
  }
}
