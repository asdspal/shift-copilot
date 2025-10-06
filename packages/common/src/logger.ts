import pino from 'pino';
import type { LogContext } from '@shiftcopilot/types';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export function createLogger(service: string) {
  return logger.child({ service });
}

export function logWithContext(
  logger: pino.Logger,
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: LogContext
) {
  logger[level]({ ...context }, message);
}
