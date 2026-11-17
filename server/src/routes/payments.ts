import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const paymentsRouter = Router();

// List payments
paymentsRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const payments = db.prepare(`
    SELECT p.*, c.name as client_name,
           (SELECT invoice_number FROM invoices i JOIN payment_allocations pa ON pa.invoice_id = i.id WHERE pa.payment_id = p.id LIMIT 1) as invoice_number
    FROM payments p
    JOIN clients c ON p.client_id = c.id
    WHERE p.organization_id = ?
    ORDER BY p.payment_date DESC
  `).all(orgId) as any[];

  res.json(payments);
});

// Record a payment and allocate to invoice(s)
paymentsRouter.post('/', (req, res) => {
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
  const count = (db.prepare('SELECT COUNT(*) as c FROM payments WHERE organization_id = ?').get(orgId) as any).c + 1;
  const payNumber = `PAY-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

  db.prepare(`
    INSERT INTO payments (
      id, organization_id, client_id, payment_number, payment_date,
      amount, currency, exchange_rate, base_amount, payment_method,
      reference_number, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    paymentId, orgId, client_id, payNumber, payment_date || new Date().toISOString().slice(0, 10),
    payAmount, currency || 'INR', exRate, baseAmount, payment_method || 'UPI',
    reference_number || '', notes || ''
  );

  // If specific allocations are passed or single invoice_id is passed
  const targets: { invoice_id: string; amount: number }[] = [];

  if (Array.isArray(allocations) && allocations.length > 0) {
    for (const a of allocations) {
      if (a.invoice_id && Number(a.amount) > 0) {
        targets.push({ invoice_id: a.invoice_id, amount: Number(a.amount) });
      }
    }
  } else if (invoice_id) {
    targets.push({ invoice_id, amount: payAmount });
  }

  for (const t of targets) {
    const allocId = 'pa-' + crypto.randomBytes(4).toString('hex');
    db.prepare(`
      INSERT INTO payment_allocations (id, payment_id, invoice_id, amount_allocated)
      VALUES (?, ?, ?, ?)
    `).run(allocId, paymentId, t.invoice_id, t.amount);

    // Update invoice balance and status
    const inv = db.prepare('SELECT total_amount, amount_paid FROM invoices WHERE id = ?').get(t.invoice_id) as any;
    if (inv) {
      const newPaid = Number(inv.amount_paid) + t.amount;
      const total = Number(inv.total_amount);
      const newBalance = Math.max(0, total - newPaid);
      let status = 'Unpaid';
      if (newPaid >= total) {
        status = 'Paid';
      } else if (newPaid > 0) {
        status = 'Partially Paid';
      }

      db.prepare(`
        UPDATE invoices 
        SET amount_paid = ?, balance_due = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newPaid, newBalance, status, t.invoice_id);
    }
  }

  const created = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  res.status(201).json(created);
});

// Delete payment and recalculate invoice balances
paymentsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const allocs = db.prepare('SELECT * FROM payment_allocations WHERE payment_id = ?').all(id) as any[];
  for (const a of allocs) {
    const inv = db.prepare('SELECT total_amount, amount_paid FROM invoices WHERE id = ?').get(a.invoice_id) as any;
    if (inv) {
      const newPaid = Math.max(0, Number(inv.amount_paid) - Number(a.amount_allocated));
      const total = Number(inv.total_amount);
      const newBalance = Math.max(0, total - newPaid);
      let status = 'Unpaid';
      if (newPaid >= total) {
        status = 'Paid';
      } else if (newPaid > 0) {
        status = 'Partially Paid';
      }
      db.prepare(`
        UPDATE invoices 
        SET amount_paid = ?, balance_due = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newPaid, newBalance, status, a.invoice_id);
    }
  }

  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  res.json({ success: true });
});
