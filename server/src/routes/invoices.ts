import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const invoicesRouter = Router();

// List invoices
invoicesRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name, p.name as project_name
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    LEFT JOIN projects p ON i.project_id = p.id
    WHERE i.organization_id = ?
    ORDER BY i.issue_date DESC
  `).all(orgId) as any[];

  res.json(invoices);
});

// Get unbilled client-billable expenses for auto-inclusion
invoicesRouter.get('/unbilled-expenses', (req, res) => {
  const { clientId, projectId } = req.query;
  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }

  let query = `
    SELECT * FROM expenses
    WHERE client_id = ? 
      AND billing_treatment = 'Client_Billable'
      AND (invoice_allocation_status = 'Not_Invoiced' OR invoice_id IS NULL OR invoice_id = '')
  `;
  const params: any[] = [clientId];

  if (projectId) {
    query += ' AND (project_id = ? OR project_id IS NULL OR project_id = "")';
    params.push(projectId);
  }

  const unbilled = db.prepare(query).all(...params) as any[];
  res.json(unbilled);
});

// Get invoice detail with line items and organization info for PDF rendering
invoicesRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const invoice = db.prepare(`
    SELECT i.*, 
           c.name as client_name, c.company_name as client_company, c.contact_person,
           c.phone as client_phone, c.email as client_email, c.billing_address as client_address,
           c.city as client_city, c.state as client_state, c.country as client_country, c.gstin as client_gstin,
           p.name as project_name, p.shoot_date, p.location as project_location,
           o.name as org_name, o.address as org_address, o.phone as org_phone,
           o.email as org_email, o.gstin as org_gstin, o.logo_url as org_logo,
           o.terms_conditions as org_terms
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    LEFT JOIN projects p ON i.project_id = p.id
    JOIN organizations o ON i.organization_id = o.id
    WHERE i.id = ?
  `).get(id) as any;

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const items = db.prepare(`
    SELECT * FROM invoice_items
    WHERE invoice_id = ?
    ORDER BY sort_order ASC
  `).all(id) as any[];

  const payments = db.prepare(`
    SELECT pa.amount_allocated, p.payment_number, p.payment_date, p.payment_method, p.reference_number
    FROM payment_allocations pa
    JOIN payments p ON pa.payment_id = p.id
    WHERE pa.invoice_id = ?
    ORDER BY p.payment_date DESC
  `).all(id) as any[];

  res.json({ invoice, items, payments });
});

// Create invoice
invoicesRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const {
    client_id, project_id, quotation_id, invoice_number, issue_date,
    due_date, currency, exchange_rate, tax_percent, discount_amount,
    notes, payment_terms, items, expense_ids_to_attach
  } = req.body;

  if (!client_id || !issue_date) {
    return res.status(400).json({ error: 'Client and issue date are required' });
  }

  const id = 'inv-' + crypto.randomBytes(4).toString('hex');
  const count = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE organization_id = ?').get(orgId) as any).c + 1;
  const num = invoice_number || `FPV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

  const lineItems: any[] = Array.isArray(items) ? [...items] : [];

  // If specific expense IDs were selected for auto-inclusion
  if (Array.isArray(expense_ids_to_attach) && expense_ids_to_attach.length > 0) {
    for (const expId of expense_ids_to_attach) {
      const exp = db.prepare(`
        SELECT * FROM expenses 
        WHERE id = ? AND billing_treatment = 'Client_Billable' AND invoice_allocation_status != 'Fully_Invoiced'
      `).get(expId) as any;
      
      if (exp) {
        // Prevent duplicate addition in items
        const alreadyInItems = lineItems.some(item => item.expense_id === exp.id);
        if (!alreadyInItems) {
          const desc = `${exp.category} Travel Reimbursement: ${exp.from_location || 'Base'} to ${exp.to_location || 'Location'}`;
          lineItems.push({
            expense_id: exp.id,
            description: desc,
            quantity: 1,
            unit_price: exp.amount,
            item_type: 'Travel_Reimbursement'
          });
        }
      }
    }
  }

  let subtotal = 0;
  for (const item of lineItems) {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    subtotal += qty * price;
  }

  const taxRate = Number(tax_percent) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const discount = Number(discount_amount) || 0;
  const totalAmount = Math.max(0, subtotal + taxAmount - discount);

  db.prepare(`
    INSERT INTO invoices (
      id, organization_id, client_id, project_id, quotation_id, invoice_number,
      issue_date, due_date, currency, exchange_rate, subtotal, tax_percent,
      tax_amount, discount_amount, total_amount, amount_paid, balance_due,
      status, notes, payment_terms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, client_id, project_id || null, quotation_id || null, num,
    issue_date, due_date || null, currency || 'INR', Number(exchange_rate) || 1.0,
    subtotal, taxRate, taxAmount, discount, totalAmount, 0, totalAmount,
    'Unpaid', notes || '', payment_terms || ''
  );

  let sort = 1;
  for (const item of lineItems) {
    const itemId = 'invi-' + crypto.randomBytes(4).toString('hex');
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, expense_id, description, quantity, unit_price, amount, item_type, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, id, item.expense_id || null, item.description, qty, price, qty * price, item.item_type || 'Service', sort++);

    // Lock expense if attached
    if (item.expense_id) {
      db.prepare(`
        UPDATE expenses 
        SET invoice_id = ?, invoice_allocation_status = 'Fully_Invoiced', updated_at = datetime('now')
        WHERE id = ?
      `).run(id, item.expense_id);
    }
  }

  const created = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Cancel invoice and release attached expenses
invoicesRouter.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  
  // Release any attached expenses back to Not_Invoiced
  db.prepare(`
    UPDATE expenses 
    SET invoice_id = NULL, invoice_allocation_status = 'Not_Invoiced', updated_at = datetime('now')
    WHERE invoice_id = ?
  `).run(id);

  db.prepare("UPDATE invoices SET status = 'Cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  res.json({ success: true, message: 'Invoice cancelled and expenses released' });
});

// Delete invoice
invoicesRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Release expenses
  db.prepare(`
    UPDATE expenses 
    SET invoice_id = NULL, invoice_allocation_status = 'Not_Invoiced', updated_at = datetime('now')
    WHERE invoice_id = ?
  `).run(id);

  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  res.json({ success: true });
});
