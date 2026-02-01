import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { env } from './env';
import type { DB } from './database.types';

/**
 * Kysely Database Instance
 *
 * Temporary replacement for Prisma Client due to P1010 permission error.
 * See docs/CRITICAL_CHANGES.md for migration path back to Prisma.
 */

/**
 * Parse DATABASE_URL to extract connection parameters
 * Supports standard PostgreSQL connection string format:
 * postgresql://user:password@host:port/database?options
 */
function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 5432,
    database: parsed.pathname.slice(1), // Remove leading "/"
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
  };
}

const dbConfig = parseDatabaseUrl(env.DATABASE_URL);

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: 20,
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool,
  }),
});

/**
 * Graceful database shutdown
 */
export async function disconnectKysely(): Promise<void> {
  await db.destroy();
}

/**
 * Test database connection
 */
export async function testKyselyConnection(): Promise<boolean> {
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch (error) {
    console.error('Kysely connection test failed:', error);
    return false;
  }
}
