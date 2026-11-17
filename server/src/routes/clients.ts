import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import { AccountingService } from '../services/accounting.js';
import crypto from 'node:crypto';

export const clientsRouter = Router();

// List clients with live financial metrics
clientsRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const accounting = new AccountingService(db);

    const clients = await db.query<any>(
      'SELECT * FROM clients WHERE organization_id = $1 ORDER BY created_at DESC',
      [orgId]
    );

    const list = await Promise.all(
      clients.map(async (client) => {
        const financials = await accounting.getClientFinancials(client.id);
        return { ...client, financials };
      })
    );

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get comprehensive client profile with all 9 tabs
clientsRouter.get('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const accounting = new AccountingService(db);

    const client = await db.queryOne<any>('SELECT * FROM clients WHERE id = $1', [id]);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const [financials, projects, quotations, invoices, payments, travelExpenses, otherExpenses, activities] = await Promise.all([
      accounting.getClientFinancials(id),
      db.query<any>('SELECT * FROM projects WHERE client_id = $1 ORDER BY shoot_date DESC', [id]),
      db.query<any>('SELECT * FROM quotations WHERE client_id = $1 ORDER BY issue_date DESC', [id]),
      db.query<any>('SELECT * FROM invoices WHERE client_id = $1 ORDER BY issue_date DESC', [id]),
      db.query<any>('SELECT * FROM payments WHERE client_id = $1 ORDER BY payment_date DESC', [id]),
      db.query<any>("SELECT * FROM expenses WHERE client_id = $1 AND expense_type = 'Travel' ORDER BY expense_date DESC", [id]),
      db.query<any>("SELECT * FROM expenses WHERE client_id = $1 AND expense_type != 'Travel' ORDER BY expense_date DESC", [id]),
      db.query<any>('SELECT * FROM audit_logs WHERE entity_id = $1 ORDER BY created_at DESC LIMIT 20', [id]),
    ]);

    const documents = [
      { title: 'Client Profile Notes', content: client.notes || 'No notes added yet.', date: client.created_at }
    ];

    res.json({ client, financials, projects, quotations, invoices, payments, travelExpenses, otherExpenses, documents, activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create client
clientsRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      name, company_name, contact_person, phone, whatsapp, email,
      billing_address, city, state, country, gstin, client_type,
      preferred_currency, status, notes
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Client name is required' });

    const id = 'cl-' + crypto.randomBytes(4).toString('hex');
    const countRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM clients WHERE organization_id = $1', [orgId]);
    const count = Number(countRow?.c || countRow?.count || 0) + 1;
    const client_code = `CL-${String(count).padStart(3, '0')}`;

    if (db.isPg) {
      await db.execute(
        `INSERT INTO clients (id, organization_id, client_code, name, company_name, contact_person,
           phone, whatsapp, email, billing_address, city, state, country, gstin,
           client_type, preferred_currency, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [id, orgId, client_code, name, company_name||'', contact_person||'',
         phone||'', whatsapp||phone||'', email||'', billing_address||'',
         city||'', state||'', country||'India', gstin||'',
         client_type||'Individual', preferred_currency||'INR', status||'Active', notes||'']
      );
    } else {
      await db.execute(
        `INSERT INTO clients (id, organization_id, client_code, name, company_name, contact_person,
           phone, whatsapp, email, billing_address, city, state, country, gstin,
           client_type, preferred_currency, status, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, orgId, client_code, name, company_name||'', contact_person||'',
         phone||'', whatsapp||phone||'', email||'', billing_address||'',
         city||'', state||'', country||'India', gstin||'',
         client_type||'Individual', preferred_currency||'INR', status||'Active', notes||'']
      );
    }

    const created = await db.queryOne<any>('SELECT * FROM clients WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update client
clientsRouter.put('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const {
      name, company_name, contact_person, phone, whatsapp, email,
      billing_address, city, state, country, gstin, client_type,
      preferred_currency, status, notes
    } = req.body;

    if (db.isPg) {
      await db.execute(
        `UPDATE clients SET
           name = COALESCE($1, name),
           company_name = COALESCE($2, company_name),
           contact_person = COALESCE($3, contact_person),
           phone = COALESCE($4, phone),
           whatsapp = COALESCE($5, whatsapp),
           email = COALESCE($6, email),
           billing_address = COALESCE($7, billing_address),
           city = COALESCE($8, city),
           state = COALESCE($9, state),
           country = COALESCE($10, country),
           gstin = COALESCE($11, gstin),
           client_type = COALESCE($12, client_type),
           preferred_currency = COALESCE($13, preferred_currency),
           status = COALESCE($14, status),
           notes = COALESCE($15, notes),
           updated_at = NOW()
         WHERE id = $16`,
        [name, company_name, contact_person, phone, whatsapp, email,
         billing_address, city, state, country, gstin, client_type,
         preferred_currency, status, notes, id]
      );
    } else {
      await db.execute(
        `UPDATE clients SET
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
         WHERE id = ?`,
        [name, company_name, contact_person, phone, whatsapp, email,
         billing_address, city, state, country, gstin, client_type,
         preferred_currency, status, notes, id]
      );
    }

    const updated = await db.queryOne<any>('SELECT * FROM clients WHERE id = $1', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete client
clientsRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const invRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM invoices WHERE client_id = $1', [id]);
    const invCount = Number(invRow?.c || invRow?.count || 0);
    if (invCount > 0) {
      return res.status(400).json({ error: 'Cannot delete client with existing invoices. Cancel or archive instead.' });
    }
    await db.execute('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
