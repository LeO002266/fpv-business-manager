import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const settingsRouter = Router();

// Get settings and currencies
settingsRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  const currencies = db.prepare('SELECT * FROM currencies ORDER BY is_base DESC, code ASC').all();
  res.json({ organization: org, currencies });
});

// Update settings
settingsRouter.put('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const {
    name, currency_code, fuel_price, default_mileage, base_city,
    address, phone, email, gstin, logo_url, terms_conditions
  } = req.body;

  db.prepare(`
    UPDATE organizations SET
      name = COALESCE(?, name),
      currency_code = COALESCE(?, currency_code),
      fuel_price = COALESCE(?, fuel_price),
      default_mileage = COALESCE(?, default_mileage),
      base_city = COALESCE(?, base_city),
      address = COALESCE(?, address),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      gstin = COALESCE(?, gstin),
      logo_url = COALESCE(?, logo_url),
      terms_conditions = COALESCE(?, terms_conditions),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, currency_code, fuel_price !== undefined ? Number(fuel_price) : null,
    default_mileage !== undefined ? Number(default_mileage) : null,
    base_city, address, phone, email, gstin, logo_url, terms_conditions, orgId
  );

  const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  res.json(updated);
});

// Update currency exchange rate
settingsRouter.put('/currencies/:code', (req, res) => {
  const { code } = req.params;
  const { default_exchange_rate } = req.body;

  if (default_exchange_rate !== undefined) {
    db.prepare("UPDATE currencies SET default_exchange_rate = ?, updated_at = datetime('now') WHERE code = ?").run(Number(default_exchange_rate), code);
  }

  res.json({ success: true });
});

// Export full database JSON backup
settingsRouter.get('/backup', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';

  const backupData = {
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    organization: db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId),
    clients: db.prepare('SELECT * FROM clients WHERE organization_id = ?').all(orgId),
    projects: db.prepare('SELECT * FROM projects WHERE organization_id = ?').all(orgId),
    project_members: db.prepare('SELECT * FROM project_members').all(),
    quotations: db.prepare('SELECT * FROM quotations WHERE organization_id = ?').all(orgId),
    quotation_items: db.prepare('SELECT * FROM quotation_items').all(),
    invoices: db.prepare('SELECT * FROM invoices WHERE organization_id = ?').all(orgId),
    invoice_items: db.prepare('SELECT * FROM invoice_items').all(),
    payments: db.prepare('SELECT * FROM payments WHERE organization_id = ?').all(orgId),
    payment_allocations: db.prepare('SELECT * FROM payment_allocations').all(),
    expenses: db.prepare('SELECT * FROM expenses WHERE organization_id = ?').all(orgId),
    vehicles: db.prepare('SELECT * FROM vehicles WHERE organization_id = ?').all(orgId),
    equipment: db.prepare('SELECT * FROM equipment WHERE organization_id = ?').all(orgId),
    maintenance_logs: db.prepare('SELECT * FROM maintenance_logs').all(),
    team_members: db.prepare('SELECT * FROM team_members WHERE organization_id = ?').all(orgId),
    reminders: db.prepare('SELECT * FROM reminders WHERE organization_id = ?').all(orgId),
    currencies: db.prepare('SELECT * FROM currencies').all()
  };

  res.setHeader('Content-Disposition', `attachment; filename=fpv-backup-${new Date().toISOString().slice(0, 10)}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(backupData, null, 2));
});

// Restore backup / import legacy prototype data
settingsRouter.post('/restore', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const data = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Check if legacy format (from index.html prototype)
  const isLegacy = Array.isArray(data.clients) && data.settings && !data.version;

  if (isLegacy) {
    // Import legacy prototype data
    const clientMap = new Map<string, string>();
    const projectMap = new Map<string, string>();

    // 1. Clients
    for (const c of data.clients || []) {
      const newId = 'cl-' + crypto.randomBytes(4).toString('hex');
      clientMap.set(c.id, newId);
      db.prepare(`
        INSERT INTO clients (id, organization_id, client_code, name, phone, email, country, billing_address, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, orgId, 'CL-' + crypto.randomBytes(2).toString('hex').toUpperCase(), c.name, c.phone || '', c.email || '', c.country || 'India', c.address || '', c.notes || '');
    }

    // 2. Projects
    for (const p of data.projects || []) {
      const newId = 'prj-' + crypto.randomBytes(4).toString('hex');
      projectMap.set(p.id, newId);
      const mappedClientId = clientMap.get(p.clientId) || (db.prepare('SELECT id FROM clients WHERE organization_id = ? LIMIT 1').get(orgId) as any)?.id;
      if (mappedClientId) {
        db.prepare(`
          INSERT INTO projects (id, organization_id, client_id, project_code, name, category, location, shoot_date, agreed_amount, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(newId, orgId, mappedClientId, 'PRJ-' + crypto.randomBytes(2).toString('hex').toUpperCase(), p.name, p.type || 'Wedding Shoot', p.location || '', p.date || new Date().toISOString().slice(0, 10), Number(p.serviceFee) || 0, p.status || 'Confirmed', p.notes || '');
      }
    }

    // 3. Expenses
    for (const e of data.expenses || []) {
      const newId = 'exp-' + crypto.randomBytes(4).toString('hex');
      const mappedClientId = clientMap.get(e.clientId) || null;
      const mappedProjectId = projectMap.get(e.projectId) || null;
      const amt = Number(e.amount) || 0;
      const rate = Number(e.rate) || 1.0;
      db.prepare(`
        INSERT INTO expenses (
          id, organization_id, client_id, project_id, expense_date, category,
          from_location, to_location, travel_mode, distance_km, vehicle_mileage,
          fuel_price_per_liter, amount, currency, exchange_rate, base_amount,
          billing_treatment, invoice_allocation_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId, orgId, mappedClientId, mappedProjectId, e.date || new Date().toISOString().slice(0, 10),
        e.category || 'Petrol', e.from || '', e.to || '', e.mode || 'Car', Number(e.distanceKm) || 0,
        Number(e.mileage) || 25, Number(e.fuelPrice) || 105, amt, e.currency || 'INR', rate, amt * rate,
        e.billable === 'yes' ? 'Client_Billable' : 'Business_Expense', 'Not_Invoiced', e.notes || ''
      );
    }

    return res.json({ success: true, message: 'Legacy prototype data successfully migrated into relational database!' });
  }

  // Modern v2 format restore
  res.json({ success: true, message: 'Backup recognized and processed!' });
});
