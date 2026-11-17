import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const quotationsRouter = Router();

// List quotations
quotationsRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const quotations = db.prepare(`
    SELECT q.*, c.name as client_name, p.name as project_name
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    LEFT JOIN projects p ON q.project_id = p.id
    WHERE q.organization_id = ?
    ORDER BY q.issue_date DESC
  `).all(orgId) as any[];

  res.json(quotations);
});

// Get quotation with items
quotationsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const quotation = db.prepare(`
    SELECT q.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.billing_address as client_address,
           p.name as project_name
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    LEFT JOIN projects p ON q.project_id = p.id
    WHERE q.id = ?
  `).get(id) as any;

  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  const items = db.prepare(`
    SELECT * FROM quotation_items
    WHERE quotation_id = ?
    ORDER BY sort_order ASC
  `).all(id) as any[];

  res.json({ quotation, items });
});

// Create quotation
quotationsRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const {
    client_id, project_id, issue_date, valid_until, currency,
    exchange_rate, tax_percent, discount_amount, terms, notes, items
  } = req.body;

  if (!client_id || !issue_date) {
    return res.status(400).json({ error: 'Client and issue date are required' });
  }

  const id = 'qt-' + crypto.randomBytes(4).toString('hex');
  const count = (db.prepare('SELECT COUNT(*) as c FROM quotations WHERE organization_id = ?').get(orgId) as any).c + 1;
  const quotation_number = `QT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

  const lineItems: any[] = Array.isArray(items) ? items : [];
  let subtotal = 0;
  for (const item of lineItems) {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    const amount = qty * price;
    subtotal += amount;
  }

  const taxRate = Number(tax_percent) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const discount = Number(discount_amount) || 0;
  const totalAmount = Math.max(0, subtotal + taxAmount - discount);

  db.prepare(`
    INSERT INTO quotations (
      id, organization_id, client_id, project_id, quotation_number,
      issue_date, valid_until, currency, exchange_rate, subtotal,
      tax_percent, tax_amount, discount_amount, total_amount, status,
      terms, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, client_id, project_id || null, quotation_number,
    issue_date, valid_until || null, currency || 'INR', Number(exchange_rate) || 1.0,
    subtotal, taxRate, taxAmount, discount, totalAmount, 'Sent',
    terms || '', notes || ''
  );

  let sort = 1;
  for (const item of lineItems) {
    const itemId = 'qti-' + crypto.randomBytes(4).toString('hex');
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    db.prepare(`
      INSERT INTO quotation_items (id, quotation_id, description, quantity, unit_price, amount, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, id, item.description || 'FPV Service', qty, price, qty * price, sort++);
  }

  const created = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Convert quotation to confirmed project and/or invoice
quotationsRouter.post('/:id/convert', (req, res) => {
  const { id } = req.params;
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { createInvoice, shoot_date, project_name } = req.body;

  const quote = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
  if (!quote) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(id) as any[];

  let projectId = quote.project_id;

  // 1. If project doesn't exist, create it
  if (!projectId) {
    projectId = 'prj-' + crypto.randomBytes(4).toString('hex');
    const pCount = (db.prepare('SELECT COUNT(*) as c FROM projects WHERE organization_id = ?').get(orgId) as any).c + 1;
    const pCode = `PRJ-${String(pCount).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO projects (
        id, organization_id, client_id, project_code, name, category,
        shoot_date, currency, agreed_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId, orgId, quote.client_id, pCode, project_name || `Project from ${quote.quotation_number}`,
      'Commercial FPV Shoot', shoot_date || new Date().toISOString().slice(0, 10),
      quote.currency, quote.total_amount, 'Confirmed', `Converted from Quotation ${quote.quotation_number}`
    );

    // Link back to quotation
    db.prepare('UPDATE quotations SET project_id = ? WHERE id = ?').run(projectId, id);
  } else {
    // Update existing project to Confirmed
    db.prepare("UPDATE projects SET status = 'Confirmed', agreed_amount = ? WHERE id = ?").run(quote.total_amount, projectId);
  }

  let invoiceId = null;

  // 2. Optionally create invoice
  if (createInvoice) {
    invoiceId = 'inv-' + crypto.randomBytes(4).toString('hex');
    const invCount = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE organization_id = ?').get(orgId) as any).c + 1;
    const invNumber = `FPV-${new Date().getFullYear()}-${String(invCount).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO invoices (
        id, organization_id, client_id, project_id, quotation_id, invoice_number,
        issue_date, due_date, currency, exchange_rate, subtotal, tax_percent,
        tax_amount, discount_amount, total_amount, amount_paid, balance_due,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId, orgId, quote.client_id, projectId, id, invNumber,
      new Date().toISOString().slice(0, 10), quote.valid_until,
      quote.currency, quote.exchange_rate, quote.subtotal, quote.tax_percent,
      quote.tax_amount, quote.discount_amount, quote.total_amount, 0,
      quote.total_amount, 'Unpaid', `Generated from Quotation ${quote.quotation_number}`
    );

    // Copy line items
    let sort = 1;
    for (const it of items) {
      const itId = 'invi-' + crypto.randomBytes(4).toString('hex');
      db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, item_type, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(itId, invoiceId, it.description, it.quantity, it.unit_price, it.amount, 'Service', sort++);
    }
  }

  // Update quotation status to Converted
  db.prepare("UPDATE quotations SET status = 'Converted', updated_at = datetime('now') WHERE id = ?").run(id);

  res.json({
    success: true,
    projectId,
    invoiceId,
    message: 'Quotation successfully converted!'
  });
});

// Delete quotation
quotationsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM quotations WHERE id = ?').run(id);
  res.json({ success: true });
});
