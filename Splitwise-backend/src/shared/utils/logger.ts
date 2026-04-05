import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] === 'development';
const isTest = process.env['NODE_ENV'] === 'test';

const logger = pino({
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  ...(isDevelopment && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

export default logger;

export function createLogger(module: string): pino.Logger {
  return logger.child({ module });
}
