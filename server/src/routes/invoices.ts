import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const invoicesRouter = Router();

invoicesRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const invoices = await db.query<any>(
      `SELECT i.*, c.name as client_name, p.name as project_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       LEFT JOIN projects p ON i.project_id = p.id
       WHERE i.organization_id = $1
       ORDER BY i.issue_date DESC`,
      [orgId]
    );
    res.json(invoices);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.get('/unbilled-expenses', async (req, res) => {
  try {
    const db = getAdapter();
    const { clientId, projectId } = req.query;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });

    const params: any[] = [clientId];
    let extra = '';
    if (projectId) {
      extra = db.isPg
        ? ` AND (project_id = $2 OR project_id IS NULL OR project_id = '')`
        : ` AND (project_id = ? OR project_id IS NULL OR project_id = '')`;
      params.push(projectId);
    }

    const unbilled = await db.query<any>(
      `SELECT * FROM expenses
       WHERE client_id = ${db.isPg ? '$1' : '?'}
         AND billing_treatment = 'Client_Billable'
         AND (invoice_allocation_status = 'Not_Invoiced' OR invoice_id IS NULL OR invoice_id = '')${extra}`,
      params
    );
    res.json(unbilled);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.get('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;

    const [invoice, items, payments] = await Promise.all([
      db.queryOne<any>(
        `SELECT i.*,
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
         WHERE i.id = $1`,
        [id]
      ),
      db.query<any>('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC', [id]),
      db.query<any>(
        `SELECT pa.amount_allocated, p.payment_number, p.payment_date, p.payment_method, p.reference_number
         FROM payment_allocations pa
         JOIN payments p ON pa.payment_id = p.id
         WHERE pa.invoice_id = $1
         ORDER BY p.payment_date DESC`,
        [id]
      ),
    ]);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice, items, payments });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      client_id, project_id, quotation_id, invoice_number, issue_date,
      due_date, currency, exchange_rate, tax_percent, discount_amount,
      notes, payment_terms, items, expense_ids_to_attach
    } = req.body;

    if (!client_id || !issue_date) return res.status(400).json({ error: 'Client and issue date are required' });

    const id = 'inv-' + crypto.randomBytes(4).toString('hex');
    const countRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM invoices WHERE organization_id = $1', [orgId]);
    const count = Number(countRow?.c || countRow?.count || 0) + 1;
    const num = invoice_number || `FPV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const lineItems: any[] = Array.isArray(items) ? [...items] : [];

    if (Array.isArray(expense_ids_to_attach) && expense_ids_to_attach.length > 0) {
      for (const expId of expense_ids_to_attach) {
        const exp = await db.queryOne<any>(
          `SELECT * FROM expenses WHERE id = $1 AND billing_treatment = 'Client_Billable' AND invoice_allocation_status != 'Fully_Invoiced'`,
          [expId]
        );
        if (exp && !lineItems.some((item) => item.expense_id === exp.id)) {
          lineItems.push({
            expense_id: exp.id,
            description: `${exp.category} Travel Reimbursement: ${exp.from_location || 'Base'} to ${exp.to_location || 'Location'}`,
            quantity: 1,
            unit_price: exp.amount,
            item_type: 'Travel_Reimbursement',
          });
        }
      }
    }

    let subtotal = 0;
    for (const item of lineItems) subtotal += (Number(item.quantity) || 1) * (Number(item.unit_price) || 0);

    const taxRate = Number(tax_percent) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = Number(discount_amount) || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);

    const ph = (n: number) => db.isPg ? `$${n}` : '?';
    await db.execute(
      `INSERT INTO invoices (id, organization_id, client_id, project_id, quotation_id, invoice_number,
         issue_date, due_date, currency, exchange_rate, subtotal, tax_percent,
         tax_amount, discount_amount, total_amount, amount_paid, balance_due, status, notes, payment_terms)
       VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)},${ph(10)},
               ${ph(11)},${ph(12)},${ph(13)},${ph(14)},${ph(15)},${ph(16)},${ph(17)},${ph(18)},${ph(19)},${ph(20)})`,
      [id, orgId, client_id, project_id || null, quotation_id || null, num,
       issue_date, due_date || null, currency || 'INR', Number(exchange_rate) || 1.0,
       subtotal, taxRate, taxAmount, discount, totalAmount, 0, totalAmount,
       'Unpaid', notes || '', payment_terms || '']
    );

    let sort = 1;
    for (const item of lineItems) {
      const itemId = 'invi-' + crypto.randomBytes(4).toString('hex');
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      await db.execute(
        `INSERT INTO invoice_items (id, invoice_id, expense_id, description, quantity, unit_price, amount, item_type, sort_order)
         VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)})`,
        [itemId, id, item.expense_id || null, item.description, qty, price, qty * price, item.item_type || 'Service', sort++]
      );

      if (item.expense_id) {
        if (db.isPg) {
          await db.execute(`UPDATE expenses SET invoice_id=$1, invoice_allocation_status='Fully_Invoiced', updated_at=NOW() WHERE id=$2`, [id, item.expense_id]);
        } else {
          await db.execute(`UPDATE expenses SET invoice_id=?, invoice_allocation_status='Fully_Invoiced', updated_at=datetime('now') WHERE id=?`, [id, item.expense_id]);
        }
      }
    }

    const created = await db.queryOne<any>('SELECT * FROM invoices WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.post('/:id/cancel', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    if (db.isPg) {
      await db.execute(`UPDATE expenses SET invoice_id=NULL, invoice_allocation_status='Not_Invoiced', updated_at=NOW() WHERE invoice_id=$1`, [id]);
      await db.execute(`UPDATE invoices SET status='Cancelled', updated_at=NOW() WHERE id=$1`, [id]);
    } else {
      await db.execute(`UPDATE expenses SET invoice_id=NULL, invoice_allocation_status='Not_Invoiced', updated_at=datetime('now') WHERE invoice_id=?`, [id]);
      await db.execute(`UPDATE invoices SET status='Cancelled', updated_at=datetime('now') WHERE id=?`, [id]);
    }
    res.json({ success: true, message: 'Invoice cancelled and expenses released' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    if (db.isPg) {
      await db.execute(`UPDATE expenses SET invoice_id=NULL, invoice_allocation_status='Not_Invoiced', updated_at=NOW() WHERE invoice_id=$1`, [id]);
    } else {
      await db.execute(`UPDATE expenses SET invoice_id=NULL, invoice_allocation_status='Not_Invoiced', updated_at=datetime('now') WHERE invoice_id=?`, [id]);
    }
    await db.execute('DELETE FROM invoices WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
