import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from './auth.middleware';
import { authRateLimiter } from '../../shared/middleware/rate-limiter';
import * as controller from './auth.controller';

const router = Router();

const googleOAuthSchema = z.object({
  code: z.string().min(1),
  deviceId: z.string().min(1).max(200),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().min(1).max(200),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

// OAuth and refresh endpoints are rate-limited strictly
router.post('/oauth/google', authRateLimiter, validate(googleOAuthSchema), controller.googleOAuth);
router.post('/refresh', authRateLimiter, validate(refreshSchema), controller.refreshToken);

// Logout requires valid access token
router.post('/logout', authenticate, validate(logoutSchema), controller.logout);

// Get current user — requires auth
router.get('/me', authenticate, controller.me);

export default router;
