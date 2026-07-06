/**
 * Structured logger for Smart Retail OS.
 * Emits JSON log lines with consistent fields: timestamp, level, message, context.
 * All production code must use this logger — never bare console.log.
 *
 * Usage:
 *   import { logger } from '@packages/shared-kernel';
 *   logger.info('Order completed', { orderId, companyId });
 *   logger.error('DB connection failed', { error: err.message });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ?? {}),
  });

  // In production (NODE_ENV=production), debug is suppressed
  if (level === 'debug' && process.env.NODE_ENV === 'production') return;

  if (level === 'error' || level === 'warn') {
    process.stderr.write(entry + '\n');
  } else {
    process.stdout.write(entry + '\n');
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
} as const;
