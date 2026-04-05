import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './shared/utils/logger';
import { requestId } from './shared/middleware/request-id';
import { globalRateLimiter } from './shared/middleware/rate-limiter';
import { errorHandler } from './shared/middleware/error-handler';

// Route imports
import authRouter from './modules/auth/auth.routes';
import userRouter from './modules/users/user.routes';
import friendRouter from './modules/friends/friendship.routes';
import groupRouter from './modules/groups/group.routes';
import expenseRouter from './modules/expenses/expense.routes';
import settlementRouter from './modules/settlements/settlement.routes';
import notificationRouter from './modules/notifications/notification.routes';
import uploadRouter from './modules/uploads/upload.routes';
import syncRouter from './modules/sync/sync.routes';

// Group-scoped routes (expenses, balances, settlements by group)
import { listGroupExpenses, listPersonalExpenses } from './modules/expenses/expense.controller';
import { getGroupSettlements, getSimplifiedDebts, getPersonalSettlements, getGroupBalances } from './modules/settlements/settlement.controller';
import { authenticate } from './modules/auth/auth.middleware';

// Notification event listeners
import { registerEventListeners } from './modules/notifications/notification.service';

export function createApp(): Application {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. CORS
  app.use(cors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  }));

  // 3. Body parser (1MB limit)
  app.use(express.json({ limit: '1mb' }));

  // 4. Request ID
  app.use(requestId);

  // 5. HTTP logging
  app.use(pinoHttp({
    logger,
    // Don't log health check
    autoLogging: { ignore: (req) => req.url === '/health' },
  }));

  // 6. Global rate limiter
  app.use(globalRateLimiter);

  // 7. Health check (unauthenticated)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // 8. Mount routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/friends', friendRouter);
  app.use('/api/v1/groups', groupRouter);
  app.use('/api/v1/expenses', expenseRouter);
  app.use('/api/v1/settlements', settlementRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/uploads', uploadRouter);
  app.use('/api/v1/sync', syncRouter);

  // Group-scoped routes mounted on /api/v1/groups/:id
  app.get('/api/v1/groups/:id/expenses', authenticate, listGroupExpenses);
  app.get('/api/v1/groups/:id/balances', authenticate, getGroupBalances);
  app.get('/api/v1/groups/:id/settlements', authenticate, getGroupSettlements);
  app.get('/api/v1/groups/:id/simplified', authenticate, getSimplifiedDebts);

  // User personal routes
  app.get('/api/v1/users/me/expenses', authenticate, listPersonalExpenses);
  app.get('/api/v1/users/me/settlements', authenticate, getPersonalSettlements);

  // Register notification event listeners
  registerEventListeners();

  // 9. 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found', details: null },
    });
  });

  // 10. Global error handler (must be last, 4 arguments)
  app.use(errorHandler);

  return app;
}
