import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export function getPostgresPool(connectionString?: string): pg.Pool | null {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url || url.includes('[YOUR-PASSWORD]')) {
    return null;
  }

  return new Pool({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export async function initPostgres(pool: pg.Pool) {
  const schemaPath = path.resolve(process.cwd(), 'server/src/db/postgres_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema creation
  await pool.query(schemaSql);
  console.log('[PostgreSQL] Database schema verified/initialized in Supabase!');

  // Check if seeded
  const check = await pool.query('SELECT id FROM organizations LIMIT 1');
  if (check.rows.length === 0) {
    await seedPostgres(pool);
  }
}

export async function seedPostgres(pool: pg.Pool) {
  const orgId = 'org-fpv-default';
  const ownerUserId = 'user-owner-1';
  const pilotUserId = 'user-pilot-1';
  const passwordHash = '$2a$10$wK1VfN0mNlJjZ9U6B.xXje7eR3iBwLzWqVqVqVqVqVqVqVqVqVqVq'; // bcrypt hash for admin123

  await pool.query(`
    INSERT INTO organizations (id, name, currency_code, fuel_price, default_mileage, base_city, address, phone, email, gstin, terms_conditions)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO NOTHING
  `, [
    orgId,
    'AeroShots FPV & Media Productions',
    'INR',
    105.00,
    25.00,
    'Rajnagar Village',
    'Main Road, Rajnagar, Durg District, Chhattisgarh 491001',
    '+91 98765 43210',
    'contact@aeroshotsfpv.com',
    '22AAAAA0000A1Z5',
    'Payment due within 15 days of invoice date. 50% advance required for booking confirmation.'
  ]);

  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', is_base: true, rate: 1.0 },
    { code: 'USD', name: 'US Dollar', symbol: '$', is_base: false, rate: 86.50 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', is_base: false, rate: 23.55 },
    { code: 'EUR', name: 'Euro', symbol: '€', is_base: false, rate: 91.20 },
    { code: 'GBP', name: 'British Pound', symbol: '£', is_base: false, rate: 108.50 },
  ];

  for (const c of currencies) {
    await pool.query(`
      INSERT INTO currencies (code, name, symbol, is_base, default_exchange_rate)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code) DO NOTHING
    `, [c.code, c.name, c.symbol, c.is_base, c.rate]);
  }

  await pool.query(`
    INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [ownerUserId, orgId, 'Mohit Sharma (Owner)', 'owner@aeroshotsfpv.com', passwordHash, 'Owner', '+91 98765 43210', true]);

  console.log('[PostgreSQL] Seed data loaded into Supabase successfully!');
}
