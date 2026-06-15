import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import pg from 'pg';

const globalForDb = global as unknown as { pool: pg.Pool | undefined };

const pool =
  globalForDb.pool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: process.env.NODE_ENV === 'development' ? 5 : 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV === 'development') globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export type Database = typeof db;
