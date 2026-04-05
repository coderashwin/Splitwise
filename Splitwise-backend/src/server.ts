import http from 'http';
// Importing env triggers Zod validation — fails fast if any required var is missing
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initFirebase } from './config/fcm';
import { createApp } from './app';
import { createLogger } from './shared/utils/logger';

const log = createLogger('server');

async function start(): Promise<void> {
  log.info(`Starting SplitPro API in ${env.NODE_ENV} environment`);

  // 1. Env already validated by import above

  // 2. Connect MongoDB
  await connectDatabase();

  // 3. Connect Redis
  await connectRedis();

  // 4. Initialize Firebase
  initFirebase();

  // 5. Create Express app
  const app = createApp();

  // 6. Start HTTP server
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    log.info({ port: env.PORT }, 'HTTP server listening');
  });

  // 7. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'Graceful shutdown initiated');

    // Stop accepting new connections
    server.close(async () => {
      log.info('HTTP server closed');

      try {
        // Close Redis
        await disconnectRedis();
        log.info('Redis disconnected');

        // Close Mongoose
        const { mongoose } = await import('./config/database');
        await mongoose.connection.close();
        log.info('MongoDB disconnected');

        log.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        log.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force kill after 30s
    setTimeout(() => {
      log.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000).unref();
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  process.on('uncaughtException', (err) => {
    log.error({ err }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

start().catch((err) => {
  // Can't use logger here since Pino might not be initialized yet
  // eslint-disable-next-line no-console
  console.error('Server failed to start:', err);
  process.exit(1);
});
