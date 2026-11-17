import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAdapter } from '../db/index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getAdapter();
    const user = await db.queryOne<any>(
      'SELECT * FROM users WHERE email = $1 AND is_active = $2',
      [email, db.isPg ? true : 1]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const org = await db.queryOne<any>(
      'SELECT * FROM organizations WHERE id = $1',
      [user.organization_id]
    );

    const authUser = {
      id: user.id,
      organizationId: user.organization_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(authUser);
    res.json({ token, user: authUser, organization: org });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const db = getAdapter();
    const user = await db.queryOne<any>(
      'SELECT id, organization_id, name, email, role, phone, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );
    const org = await db.queryOne<any>(
      'SELECT * FROM organizations WHERE id = $1',
      [req.user.organizationId]
    );
    res.json({ user, organization: org });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup endpoint — creates the initial org + admin user (only if DB is empty)
authRouter.post('/setup', async (req, res) => {
  try {
    const db = getAdapter();
    const existing = await db.queryOne<any>('SELECT id FROM organizations LIMIT 1');
    if (existing) {
      return res.status(409).json({ error: 'Organization already exists. Use /login.' });
    }

    const { orgName, adminName, adminEmail, adminPassword, basCity, fuelPrice, defaultMileage } = req.body;
    if (!orgName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'orgName, adminEmail, and adminPassword are required' });
    }

    const { randomBytes } = await import('node:crypto');
    const orgId = 'org-' + randomBytes(4).toString('hex');
    const userId = 'usr-' + randomBytes(4).toString('hex');
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const now = new Date().toISOString();

    if (db.isPg) {
      await db.execute(
        `INSERT INTO organizations (id, name, currency_code, fuel_price, default_mileage, base_city, address, phone, email, gstin, logo_url, terms_conditions, created_at, updated_at)
         VALUES ($1,$2,'INR',$3,$4,$5,'','','','','','', $6, $7)`,
        [orgId, orgName, Number(fuelPrice) || 105, Number(defaultMileage) || 25, basCity || 'Your City', now, now]
      );
      await db.execute(
        `INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, avatar_url, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'Owner','','', true, $6, $7)`,
        [userId, orgId, adminName || 'Admin', adminEmail, passwordHash, now, now]
      );
    } else {
      await db.execute(
        `INSERT INTO organizations (id, name, currency_code, fuel_price, default_mileage, base_city) VALUES (?,?,?,?,?,?)`,
        [orgId, orgName, 'INR', Number(fuelPrice) || 105, Number(defaultMileage) || 25, basCity || 'Your City']
      );
      await db.execute(
        `INSERT INTO users (id, organization_id, name, email, password_hash, role, is_active) VALUES (?,?,?,?,?,'Owner',1)`,
        [userId, orgId, adminName || 'Admin', adminEmail, passwordHash]
      );
    }

    const authUser = { id: userId, organizationId: orgId, name: adminName || 'Admin', email: adminEmail, role: 'Owner' };
    const token = generateToken(authUser);
    res.status(201).json({ token, user: authUser, message: 'Setup complete! You can now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
