import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const quotationsRouter = Router();

quotationsRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const quotations = await db.query<any>(
      `SELECT q.*, c.name as client_name, p.name as project_name
       FROM quotations q
       JOIN clients c ON q.client_id = c.id
       LEFT JOIN projects p ON q.project_id = p.id
       WHERE q.organization_id = $1
       ORDER BY q.issue_date DESC`,
      [orgId]
    );
    res.json(quotations);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

quotationsRouter.get('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const [quotation, items] = await Promise.all([
      db.queryOne<any>(
        `SELECT q.*, c.name as client_name, c.billing_address as client_address,
                o.name as org_name, o.address as org_address, o.phone as org_phone, o.email as org_email, o.gstin as org_gstin
         FROM quotations q
         JOIN clients c ON q.client_id = c.id
         JOIN organizations o ON q.organization_id = o.id
         WHERE q.id = $1`, [id]),
      db.query<any>('SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order ASC', [id]),
    ]);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    res.json({ quotation, items });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

quotationsRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      client_id, project_id, issue_date, valid_until,
      currency, exchange_rate, tax_percent, discount_amount, terms, notes, items
    } = req.body;

    if (!client_id || !issue_date) return res.status(400).json({ error: 'Client and issue date are required' });

    const id = 'quo-' + crypto.randomBytes(4).toString('hex');
    const countRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM quotations WHERE organization_id = $1', [orgId]);
    const count = Number(countRow?.c || countRow?.count || 0) + 1;
    const quotation_number = `QUO-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const lineItems: any[] = Array.isArray(items) ? items : [];
    let subtotal = 0;
    for (const item of lineItems) subtotal += (Number(item.quantity) || 1) * (Number(item.unit_price) || 0);

    const taxRate = Number(tax_percent) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = Number(discount_amount) || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);

    const ph = (n: number) => db.isPg ? `$${n}` : '?';
    await db.execute(
      `INSERT INTO quotations (id, organization_id, client_id, project_id, quotation_number,
         issue_date, valid_until, currency, exchange_rate, subtotal,
         tax_percent, tax_amount, discount_amount, total_amount, status, terms, notes)
       VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},
               ${ph(9)},${ph(10)},${ph(11)},${ph(12)},${ph(13)},${ph(14)},${ph(15)},${ph(16)},${ph(17)})`,
      [id, orgId, client_id, project_id || null, quotation_number, issue_date, valid_until || null,
       currency || 'INR', Number(exchange_rate) || 1.0, subtotal, taxRate, taxAmount, discount, totalAmount,
       'Sent', terms || '', notes || '']
    );

    let sort = 1;
    for (const item of lineItems) {
      const itemId = 'qti-' + crypto.randomBytes(4).toString('hex');
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      await db.execute(
        `INSERT INTO quotation_items (id, quotation_id, description, quantity, unit_price, amount, sort_order)
         VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)})`,
        [itemId, id, item.description || 'FPV Service', qty, price, qty * price, sort++]
      );
    }

    const created = await db.queryOne<any>('SELECT * FROM quotations WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

quotationsRouter.post('/:id/convert', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { createInvoice, shoot_date, project_name } = req.body;

    const quote = await db.queryOne<any>('SELECT * FROM quotations WHERE id = $1', [id]);
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    const items = await db.query<any>('SELECT * FROM quotation_items WHERE quotation_id = $1', [id]);
    const ph = (n: number) => db.isPg ? `$${n}` : '?';
    let projectId = quote.project_id;

    if (!projectId) {
      projectId = 'prj-' + crypto.randomBytes(4).toString('hex');
      const pCountRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM projects WHERE organization_id = $1', [orgId]);
      const pCount = Number(pCountRow?.c || pCountRow?.count || 0) + 1;
      const pCode = `PRJ-${String(pCount).padStart(3, '0')}`;

      await db.execute(
        `INSERT INTO projects (id, organization_id, client_id, project_code, name, category,
           shoot_date, currency, agreed_amount, status, notes)
         VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)},${ph(10)},${ph(11)})`,
        [projectId, orgId, quote.client_id, pCode,
         project_name || `Project from ${quote.quotation_number}`,
         'Commercial FPV Shoot', shoot_date || new Date().toISOString().slice(0, 10),
         quote.currency, quote.total_amount, 'Confirmed',
         `Converted from Quotation ${quote.quotation_number}`]
      );
      await db.execute(`UPDATE quotations SET project_id = ${ph(1)} WHERE id = ${ph(2)}`, [projectId, id]);
    } else {
      if (db.isPg) {
        await db.execute(`UPDATE projects SET status='Confirmed', agreed_amount=$1 WHERE id=$2`, [quote.total_amount, projectId]);
      } else {
        await db.execute(`UPDATE projects SET status='Confirmed', agreed_amount=? WHERE id=?`, [quote.total_amount, projectId]);
      }
    }

    let invoiceId = null;
    if (createInvoice) {
      invoiceId = 'inv-' + crypto.randomBytes(4).toString('hex');
      const invCountRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM invoices WHERE organization_id = $1', [orgId]);
      const invCount = Number(invCountRow?.c || invCountRow?.count || 0) + 1;
      const invNumber = `FPV-${new Date().getFullYear()}-${String(invCount).padStart(3, '0')}`;

      await db.execute(
        `INSERT INTO invoices (id, organization_id, client_id, project_id, quotation_id, invoice_number,
           issue_date, due_date, currency, exchange_rate, subtotal, tax_percent, tax_amount,
           discount_amount, total_amount, amount_paid, balance_due, status, notes)
         VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)},
                 ${ph(10)},${ph(11)},${ph(12)},${ph(13)},${ph(14)},${ph(15)},${ph(16)},${ph(17)},${ph(18)},${ph(19)})`,
        [invoiceId, orgId, quote.client_id, projectId, id, invNumber,
         new Date().toISOString().slice(0, 10), quote.valid_until, quote.currency,
         quote.exchange_rate, quote.subtotal, quote.tax_percent, quote.tax_amount,
         quote.discount_amount, quote.total_amount, 0, quote.total_amount, 'Unpaid',
         `Generated from Quotation ${quote.quotation_number}`]
      );

      let sort = 1;
      for (const it of items) {
        const itId = 'invi-' + crypto.randomBytes(4).toString('hex');
        await db.execute(
          `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, item_type, sort_order)
           VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)})`,
          [itId, invoiceId, it.description, it.quantity, it.unit_price, it.amount, 'Service', sort++]
        );
      }
    }

    if (db.isPg) {
      await db.execute(`UPDATE quotations SET status='Converted', updated_at=NOW() WHERE id=$1`, [id]);
    } else {
      await db.execute(`UPDATE quotations SET status='Converted', updated_at=datetime('now') WHERE id=?`, [id]);
    }

    res.json({ success: true, projectId, invoiceId, message: 'Quotation successfully converted!' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

quotationsRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    await db.execute('DELETE FROM quotations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
