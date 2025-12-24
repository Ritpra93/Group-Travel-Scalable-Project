import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './env';

/**
 * Prisma Client Singleton
 *
 * Prevents multiple instances in development due to hot-reloading
 * Connection pooling is configured via DATABASE_URL query params:
 * ?connection_limit=20&pool_timeout=20
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma Client with logging configuration
 *
 * Development: Log all queries for debugging
 * Production: Log errors and warnings only
 */
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: isDevelopment
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
    errorFormat: isDevelopment ? 'colorless' : 'minimal',
  });
};

/**
 * Database client instance
 * Reuses existing instance in development to prevent connection exhaustion
 */
export const prisma = global.prisma || createPrismaClient();

if (isDevelopment) {
  global.prisma = prisma;
}

/**
 * Graceful database connection shutdown
 * Call this during application shutdown to close all connections
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Test database connection
 * Useful for health checks
 *
 * @returns true if connection is successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Execute a function within a database transaction
 * Automatically handles commit/rollback
 *
 * @param fn - Function to execute within transaction context
 * @returns Result of the transaction function
 */
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await fn(tx as PrismaClient);
  });
}
