import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const paymentsRouter = Router();

paymentsRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const payments = await db.query<any>(
      `SELECT p.*, c.name as client_name,
              (SELECT i.invoice_number FROM invoices i JOIN payment_allocations pa ON pa.invoice_id = i.id WHERE pa.payment_id = p.id LIMIT 1) as invoice_number
       FROM payments p
       JOIN clients c ON p.client_id = c.id
       WHERE p.organization_id = $1
       ORDER BY p.payment_date DESC`,
      [orgId]
    );
    res.json(payments);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

paymentsRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      client_id, invoice_id, amount, payment_date, payment_method,
      reference_number, currency, exchange_rate, notes, allocations
    } = req.body;

    if (!client_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Client and positive payment amount are required' });
    }

    const payAmount = Number(amount);
    const exRate = Number(exchange_rate) || 1.0;
    const baseAmount = payAmount * exRate;

    const paymentId = 'pay-' + crypto.randomBytes(4).toString('hex');
    const countRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM payments WHERE organization_id = $1', [orgId]);
    const count = Number(countRow?.c || countRow?.count || 0) + 1;
    const payNumber = `PAY-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const pDate = payment_date || new Date().toISOString().slice(0, 10);

    const ph = (n: number) => db.isPg ? `$${n}` : '?';
    await db.execute(
      `INSERT INTO payments (id, organization_id, client_id, payment_number, payment_date,
         amount, currency, exchange_rate, base_amount, payment_method, reference_number, notes)
       VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)},${ph(10)},${ph(11)},${ph(12)})`,
      [paymentId, orgId, client_id, payNumber, pDate, payAmount, currency || 'INR',
       exRate, baseAmount, payment_method || 'UPI', reference_number || '', notes || '']
    );

    const targets: { invoice_id: string; amount: number }[] = [];
    if (Array.isArray(allocations) && allocations.length > 0) {
      for (const a of allocations) {
        if (a.invoice_id && Number(a.amount) > 0) targets.push({ invoice_id: a.invoice_id, amount: Number(a.amount) });
      }
    } else if (invoice_id) {
      targets.push({ invoice_id, amount: payAmount });
    }

    for (const t of targets) {
      const allocId = 'pa-' + crypto.randomBytes(4).toString('hex');
      await db.execute(
        `INSERT INTO payment_allocations (id, payment_id, invoice_id, amount_allocated)
         VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)})`,
        [allocId, paymentId, t.invoice_id, t.amount]
      );

      const inv = await db.queryOne<any>('SELECT total_amount, amount_paid FROM invoices WHERE id = $1', [t.invoice_id]);
      if (inv) {
        const newPaid = Number(inv.amount_paid) + t.amount;
        const total = Number(inv.total_amount);
        const newBalance = Math.max(0, total - newPaid);
        const status = newPaid >= total ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';

        if (db.isPg) {
          await db.execute(
            `UPDATE invoices SET amount_paid = $1, balance_due = $2, status = $3, updated_at = NOW() WHERE id = $4`,
            [newPaid, newBalance, status, t.invoice_id]
          );
        } else {
          await db.execute(
            `UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
            [newPaid, newBalance, status, t.invoice_id]
          );
        }
      }
    }

    const created = await db.queryOne<any>('SELECT * FROM payments WHERE id = $1', [paymentId]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

paymentsRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const allocs = await db.query<any>('SELECT * FROM payment_allocations WHERE payment_id = $1', [id]);

    for (const a of allocs) {
      const inv = await db.queryOne<any>('SELECT total_amount, amount_paid FROM invoices WHERE id = $1', [a.invoice_id]);
      if (inv) {
        const newPaid = Math.max(0, Number(inv.amount_paid) - Number(a.amount_allocated));
        const total = Number(inv.total_amount);
        const newBalance = Math.max(0, total - newPaid);
        const status = newPaid >= total ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';
        if (db.isPg) {
          await db.execute(`UPDATE invoices SET amount_paid=$1, balance_due=$2, status=$3, updated_at=NOW() WHERE id=$4`, [newPaid, newBalance, status, a.invoice_id]);
        } else {
          await db.execute(`UPDATE invoices SET amount_paid=?, balance_due=?, status=?, updated_at=datetime('now') WHERE id=?`, [newPaid, newBalance, status, a.invoice_id]);
        }
      }
    }

    await db.execute('DELETE FROM payments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
