import { Router } from 'express';
import { db } from '../db/index.js';
import { AccountingService } from '../services/accounting.js';
import crypto from 'node:crypto';

export const clientsRouter = Router();
const accounting = new AccountingService(db);

// List clients with live financial metrics
clientsRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const clients = db.prepare(`
    SELECT * FROM clients 
    WHERE organization_id = ? 
    ORDER BY created_at DESC
  `).all(orgId) as any[];

  const list = clients.map(client => {
    const financials = accounting.getClientFinancials(client.id);
    return {
      ...client,
      financials
    };
  });

  res.json(list);
});

// Get comprehensive client profile with all 9 tabs
clientsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as any;
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const financials = accounting.getClientFinancials(id);

  // Tab 2: Projects
  const projects = db.prepare(`
    SELECT * FROM projects 
    WHERE client_id = ? 
    ORDER BY shoot_date DESC
  `).all(id) as any[];

  // Tab 3: Quotations
  const quotations = db.prepare(`
    SELECT * FROM quotations 
    WHERE client_id = ? 
    ORDER BY issue_date DESC
  `).all(id) as any[];

  // Tab 4: Invoices
  const invoices = db.prepare(`
    SELECT * FROM invoices 
    WHERE client_id = ? 
    ORDER BY issue_date DESC
  `).all(id) as any[];

  // Tab 5: Payments
  const payments = db.prepare(`
    SELECT * FROM payments 
    WHERE client_id = ? 
    ORDER BY payment_date DESC
  `).all(id) as any[];

  // Tab 6: Travel Expenses
  const travelExpenses = db.prepare(`
    SELECT * FROM expenses 
    WHERE client_id = ? AND expense_type = 'Travel'
    ORDER BY expense_date DESC
  `).all(id) as any[];

  // Tab 7: Other Expenses
  const otherExpenses = db.prepare(`
    SELECT * FROM expenses 
    WHERE client_id = ? AND expense_type != 'Travel'
    ORDER BY expense_date DESC
  `).all(id) as any[];

  // Tab 8: Documents & Notes (client notes + attached records)
  const documents = [
    { title: 'Client Profile Notes', content: client.notes || 'No notes added yet.', date: client.created_at }
  ];

  // Tab 9: Activity / Audit History
  const activities = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE entity_id = ? OR details LIKE ?
    ORDER BY created_at DESC LIMIT 20
  `).all(id, `%${id}%`) as any[];

  res.json({
    client,
    financials,
    projects,
    quotations,
    invoices,
    payments,
    travelExpenses,
    otherExpenses,
    documents,
    activities
  });
});

// Create client
clientsRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const {
    name, company_name, contact_person, phone, whatsapp, email,
    billing_address, city, state, country, gstin, client_type,
    preferred_currency, status, notes
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  const id = 'cl-' + crypto.randomBytes(4).toString('hex');
  const count = (db.prepare('SELECT COUNT(*) as c FROM clients WHERE organization_id = ?').get(orgId) as any).c + 1;
  const client_code = `CL-${String(count).padStart(3, '0')}`;

  db.prepare(`
    INSERT INTO clients (
      id, organization_id, client_code, name, company_name, contact_person,
      phone, whatsapp, email, billing_address, city, state, country, gstin,
      client_type, preferred_currency, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, client_code, name, company_name || '', contact_person || '',
    phone || '', whatsapp || phone || '', email || '', billing_address || '',
    city || '', state || '', country || 'India', gstin || '',
    client_type || 'Individual', preferred_currency || 'INR', status || 'Active', notes || ''
  );

  const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Update client
clientsRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, company_name, contact_person, phone, whatsapp, email,
    billing_address, city, state, country, gstin, client_type,
    preferred_currency, status, notes
  } = req.body;

  db.prepare(`
    UPDATE clients SET
      name = COALESCE(?, name),
      company_name = COALESCE(?, company_name),
      contact_person = COALESCE(?, contact_person),
      phone = COALESCE(?, phone),
      whatsapp = COALESCE(?, whatsapp),
      email = COALESCE(?, email),
      billing_address = COALESCE(?, billing_address),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      country = COALESCE(?, country),
      gstin = COALESCE(?, gstin),
      client_type = COALESCE(?, client_type),
      preferred_currency = COALESCE(?, preferred_currency),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, company_name, contact_person, phone, whatsapp, email,
    billing_address, city, state, country, gstin, client_type,
    preferred_currency, status, notes, id
  );

  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.json(updated);
});

// Delete client
clientsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  // Check if invoices or projects exist
  const invCount = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE client_id = ?').get(id) as any).c;
  if (invCount > 0) {
    return res.status(400).json({ error: 'Cannot delete client with existing invoices. Cancel or archive instead.' });
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  res.json({ success: true, message: 'Client deleted successfully' });
});
