import winston from 'winston';
import { env, isDevelopment, isProduction } from '../../config/env';

/**
 * Custom log format for development
 * Colorized and easy to read
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Custom log format for production
 * JSON format for log aggregation services
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance
 *
 * Features:
 * - Structured logging with metadata
 * - Different formats for development vs production
 * - Automatic stack trace capture for errors
 * - Request correlation ID support
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'trip-hub-api',
    environment: env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  // Don't exit on error
  exitOnError: false,
});

/**
 * Log levels:
 * - error: Error messages that need immediate attention
 * - warn: Warning messages that might need attention
 * - info: General informational messages
 * - debug: Detailed debug information (only in development)
 */

/**
 * Helper function to log HTTP requests
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param duration - Request duration in ms
 * @param userId - Optional user ID
 * @param metadata - Additional metadata
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    duration,
    userId,
    ...metadata,
  });
}

/**
 * Helper function to log database queries
 *
 * @param query - Query string or description
 * @param duration - Query duration in ms
 * @param metadata - Additional metadata
 */
export function logQuery(
  query: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  if (isDevelopment) {
    logger.debug('Database Query', {
      query,
      duration,
      ...metadata,
    });
  }
}

/**
 * Helper function to log cache operations
 *
 * @param operation - Cache operation (get, set, del)
 * @param key - Cache key
 * @param hit - Whether it was a cache hit (for get operations)
 * @param metadata - Additional metadata
 */
export function logCache(
  operation: 'get' | 'set' | 'del',
  key: string,
  hit?: boolean,
  metadata?: Record<string, unknown>
): void {
  if (isDevelopment) {
    logger.debug('Cache Operation', {
      operation,
      key,
      hit,
      ...metadata,
    });
  }
}

/**
 * Helper function to log authentication events
 *
 * @param event - Auth event type
 * @param userId - User ID
 * @param success - Whether the operation was successful
 * @param metadata - Additional metadata
 */
export function logAuth(
  event: 'register' | 'login' | 'logout' | 'refresh' | 'verify',
  userId: string,
  success: boolean,
  metadata?: Record<string, unknown>
): void {
  logger.info('Auth Event', {
    event,
    userId,
    success,
    ...metadata,
  });
}

/**
 * Helper function to log errors with stack traces
 *
 * @param error - Error object
 * @param context - Context where error occurred
 * @param metadata - Additional metadata
 */
export function logError(
  error: Error,
  context: string,
  metadata?: Record<string, unknown>
): void {
  logger.error('Error occurred', {
    context,
    message: error.message,
    stack: error.stack,
    ...metadata,
  });
}

/**
 * Helper function to log business events
 *
 * @param event - Event name
 * @param metadata - Event metadata
 */
export function logEvent(event: string, metadata?: Record<string, unknown>): void {
  logger.info('Business Event', {
    event,
    ...metadata,
  });
}

/**
 * Stream for Morgan HTTP logger middleware
 * Redirects Morgan output to Winston
 */
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
