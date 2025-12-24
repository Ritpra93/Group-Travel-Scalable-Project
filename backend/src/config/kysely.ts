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

const pool = new Pool({
  host: 'localhost',
  port: 5433, // Docker PostgreSQL mapped to 5433 to avoid conflict with local PostgreSQL
  database: 'group_travel',
  user: 'postgres',
  password: 'postgres',
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
