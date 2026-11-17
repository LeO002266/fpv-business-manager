/**
 * Universal Database Adapter
 * 
 * Provides a unified async interface for both SQLite (local dev) and
 * PostgreSQL/Supabase (production on Vercel).
 * 
 * Usage:
 *   const adapter = createAdapter();
 *   const rows = await adapter.query('SELECT * FROM clients WHERE id = $1', [id]);
 *   const row  = await adapter.queryOne('SELECT * FROM clients WHERE id = $1', [id]);
 *   await adapter.execute('INSERT INTO clients (id) VALUES ($1)', [id]);
 */

import 'dotenv/config';

export interface DbAdapter {
  /** Run a SELECT and return all rows */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  /** Run a SELECT and return first row or undefined */
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  /** Run INSERT / UPDATE / DELETE */
  execute(sql: string, params?: any[]): Promise<void>;
  /** True if backed by PostgreSQL */
  isPg: boolean;
  /** Close the connection (call in Vercel serverless teardown if needed) */
  close(): Promise<void>;
}

// ─── SQLite Adapter (local dev) ───────────────────────────────────────────────

class SqliteAdapter implements DbAdapter {
  isPg = false;
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /** Convert $1, $2 → ?, ? for SQLite compatibility */
  private toSqlite(sql: string, params?: any[]): [string, any[]] {
    // SQLite uses ? placeholders; Express routes already use ? from the old API
    // but AccountingService uses $1-style in some places — normalize both
    let idx = 0;
    const converted = sql.replace(/\$\d+/g, () => '?');
    return [converted, params || []];
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [s, p] = this.toSqlite(sql, params);
    return this.db.prepare(s).all(...p) as T[];
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    const [s, p] = this.toSqlite(sql, params);
    return this.db.prepare(s).get(...p) as T | undefined;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    const [s, p] = this.toSqlite(sql, params);
    this.db.prepare(s).run(...p);
  }

  async close(): Promise<void> {
    // SQLite DatabaseSync has no explicit close in Node 22
  }
}

// ─── PostgreSQL Adapter (Vercel / production) ─────────────────────────────────

class PgAdapter implements DbAdapter {
  isPg = true;
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  /** Convert SQLite datetime('now') → NOW(), strftime → to_char, etc. */
  private toPg(sql: string): string {
    return sql
      // datetime('now') → NOW()
      .replace(/datetime\('now'\)/gi, 'NOW()')
      // COALESCE works the same in PG
      // strftime('%Y-%m', col) → to_char(col, 'YYYY-MM')
      .replace(/strftime\('%Y-%m',\s*([^)]+)\)/gi, "to_char($1, 'YYYY-MM')")
      // FULL OUTER JOIN works the same in PG ✓
      // INTEGER default columns: SQLite stores 0/1 for booleans; PG uses BOOLEAN — handled in schema
      ;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const pgSql = this.toPg(sql);
    const result = await this.pool.query(pgSql, params || []);
    return result.rows as T[];
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    const pgSql = this.toPg(sql);
    const result = await this.pool.query(pgSql, params || []);
    return result.rows[0] as T | undefined;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    const pgSql = this.toPg(sql);
    await this.pool.query(pgSql, params || []);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _adapter: DbAdapter | null = null;

export async function createAdapter(): Promise<DbAdapter> {
  if (_adapter) return _adapter;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    // Production: PostgreSQL via pg pool
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    _adapter = new PgAdapter(pool);
    console.log('[FPV] Connected to PostgreSQL (Supabase)');
  } else {
    // Local dev: SQLite
    const { initDatabase } = await import('./schema.js');
    const { seedDatabase } = await import('./seed.js');
    const db = initDatabase();
    seedDatabase(db);
    _adapter = new SqliteAdapter(db);
    console.log('[FPV] Using SQLite (local dev)');
  }

  return _adapter;
}

export function getAdapter(): DbAdapter {
  if (!_adapter) {
    throw new Error('DB adapter not initialized. Call createAdapter() first.');
  }
  return _adapter;
}
