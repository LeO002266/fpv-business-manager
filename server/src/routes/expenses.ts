import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const expensesRouter = Router();

expensesRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { category, expense_type, billing_treatment, client_id, project_id, start_date, end_date } = req.query;

    const params: any[] = [orgId];
    const conditions: string[] = [];
    let pIdx = 2;
    const ph = () => db.isPg ? `$${pIdx++}` : '?';

    if (category) { conditions.push(`e.category = ${ph()}`); params.push(category); }
    if (expense_type) { conditions.push(`e.expense_type = ${ph()}`); params.push(expense_type); }
    if (billing_treatment) { conditions.push(`e.billing_treatment = ${ph()}`); params.push(billing_treatment); }
    if (client_id) { conditions.push(`e.client_id = ${ph()}`); params.push(client_id); }
    if (project_id) { conditions.push(`e.project_id = ${ph()}`); params.push(project_id); }
    if (start_date && end_date) {
      conditions.push(`e.expense_date BETWEEN ${ph()} AND ${ph()}`);
      params.push(start_date, end_date);
    }

    const where = conditions.length ? ' AND ' + conditions.join(' AND ') : '';
    const expenses = await db.query<any>(
      `SELECT e.*, c.name as client_name, p.name as project_name, v.name as vehicle_name, tm.name as spent_by_name
       FROM expenses e
       LEFT JOIN clients c ON e.client_id = c.id
       LEFT JOIN projects p ON e.project_id = p.id
       LEFT JOIN vehicles v ON e.vehicle_id = v.id
       LEFT JOIN team_members tm ON e.spent_by_id = tm.id
       WHERE e.organization_id = ${db.isPg ? '$1' : '?'}${where}
       ORDER BY e.expense_date DESC`,
      params
    );
    res.json(expenses);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

expensesRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      client_id, project_id, vehicle_id, spent_by_id, expense_date,
      category, expense_type, description, from_location, to_location,
      travel_mode, trip_type, distance_km, vehicle_mileage,
      fuel_price_per_liter, amount, currency, exchange_rate,
      billing_treatment, receipt_url, vendor_name, payment_method, notes
    } = req.body;

    if (!category || !expense_date) {
      return res.status(400).json({ error: 'Category and expense date are required' });
    }

    const id = 'exp-' + crypto.randomBytes(4).toString('hex');
    const dist = Number(distance_km) || 0;
    const mileage = Number(vehicle_mileage) || 0;
    const fuelPrice = Number(fuel_price_per_liter) || 0;

    let calculatedFuel = 0;
    if (dist > 0 && mileage > 0 && fuelPrice > 0 && ['Petrol', 'Diesel'].includes(category)) {
      calculatedFuel = Math.round(((dist / mileage) * fuelPrice) * 100) / 100;
    }

    const enteredAmount = Number(amount) || 0;
    const finalAmount = enteredAmount > 0 ? enteredAmount : calculatedFuel;
    const exRate = Number(exchange_rate) || 1.0;
    const baseAmount = finalAmount * exRate;

    let finalType = expense_type;
    if (!finalType) {
      const travelCats = ['Petrol', 'Diesel', 'Charging', 'Toll', 'Parking', 'Hotel', 'Food', 'Flight Ticket', 'Train Ticket', 'Bus Ticket', 'Taxi', 'Local Transport'];
      const capCats = ['Equipment Purchase', 'Battery Purchase', 'Accessories'];
      if (travelCats.includes(category)) finalType = 'Travel';
      else if (capCats.includes(category)) finalType = 'Equipment_Capital';
      else if (project_id) finalType = 'Project_Direct';
      else finalType = 'General_Business';
    }

    const vals = [
      id, orgId, client_id || null, project_id || null, vehicle_id || null, spent_by_id || null,
      expense_date, category, finalType, description || '', from_location || '',
      to_location || '', travel_mode || 'Car', trip_type || 'Round-Trip', dist,
      mileage, fuelPrice, calculatedFuel, finalAmount, currency || 'INR',
      exRate, baseAmount, billing_treatment || 'Client_Billable', 'Not_Invoiced',
      receipt_url || '', vendor_name || '', payment_method || 'UPI', notes || ''
    ];

    if (db.isPg) {
      await db.execute(
        `INSERT INTO expenses (id, organization_id, client_id, project_id, vehicle_id, spent_by_id,
           expense_date, category, expense_type, description, from_location,
           to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
           fuel_price_per_liter, calculated_fuel_cost, amount, currency,
           exchange_rate, base_amount, billing_treatment, invoice_allocation_status,
           receipt_url, vendor_name, payment_method, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
        vals
      );
    } else {
      await db.execute(
        `INSERT INTO expenses (id, organization_id, client_id, project_id, vehicle_id, spent_by_id,
           expense_date, category, expense_type, description, from_location,
           to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
           fuel_price_per_liter, calculated_fuel_cost, amount, currency,
           exchange_rate, base_amount, billing_treatment, invoice_allocation_status,
           receipt_url, vendor_name, payment_method, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        vals
      );
    }

    const created = await db.queryOne<any>('SELECT * FROM expenses WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

expensesRouter.put('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const current = await db.queryOne<any>('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!current) return res.status(404).json({ error: 'Expense not found' });

    const {
      client_id, project_id, vehicle_id, spent_by_id, expense_date,
      category, expense_type, description, from_location, to_location,
      travel_mode, trip_type, distance_km, vehicle_mileage,
      fuel_price_per_liter, amount, currency, exchange_rate,
      billing_treatment, receipt_url, vendor_name, payment_method, notes
    } = req.body;

    const finalAmount = amount !== undefined ? Number(amount) : current.amount;
    const exRate = exchange_rate !== undefined ? Number(exchange_rate) : current.exchange_rate;
    const baseAmount = finalAmount * exRate;

    if (db.isPg) {
      await db.execute(
        `UPDATE expenses SET
           client_id = COALESCE($1, client_id),
           project_id = COALESCE($2, project_id),
           vehicle_id = COALESCE($3, vehicle_id),
           spent_by_id = COALESCE($4, spent_by_id),
           expense_date = COALESCE($5, expense_date),
           category = COALESCE($6, category),
           expense_type = COALESCE($7, expense_type),
           description = COALESCE($8, description),
           from_location = COALESCE($9, from_location),
           to_location = COALESCE($10, to_location),
           travel_mode = COALESCE($11, travel_mode),
           trip_type = COALESCE($12, trip_type),
           distance_km = COALESCE($13, distance_km),
           vehicle_mileage = COALESCE($14, vehicle_mileage),
           fuel_price_per_liter = COALESCE($15, fuel_price_per_liter),
           amount = $16, currency = COALESCE($17, currency),
           exchange_rate = $18, base_amount = $19,
           billing_treatment = COALESCE($20, billing_treatment),
           receipt_url = COALESCE($21, receipt_url),
           vendor_name = COALESCE($22, vendor_name),
           payment_method = COALESCE($23, payment_method),
           notes = COALESCE($24, notes),
           updated_at = NOW()
         WHERE id = $25`,
        [client_id, project_id, vehicle_id, spent_by_id, expense_date,
         category, expense_type, description, from_location, to_location,
         travel_mode, trip_type, distance_km, vehicle_mileage,
         fuel_price_per_liter, finalAmount, currency, exRate, baseAmount,
         billing_treatment, receipt_url, vendor_name, payment_method, notes, id]
      );
    } else {
      await db.execute(
        `UPDATE expenses SET
           client_id = COALESCE(?, client_id),
           project_id = COALESCE(?, project_id),
           vehicle_id = COALESCE(?, vehicle_id),
           spent_by_id = COALESCE(?, spent_by_id),
           expense_date = COALESCE(?, expense_date),
           category = COALESCE(?, category),
           expense_type = COALESCE(?, expense_type),
           description = COALESCE(?, description),
           from_location = COALESCE(?, from_location),
           to_location = COALESCE(?, to_location),
           travel_mode = COALESCE(?, travel_mode),
           trip_type = COALESCE(?, trip_type),
           distance_km = COALESCE(?, distance_km),
           vehicle_mileage = COALESCE(?, vehicle_mileage),
           fuel_price_per_liter = COALESCE(?, fuel_price_per_liter),
           amount = ?, currency = COALESCE(?, currency),
           exchange_rate = ?, base_amount = ?,
           billing_treatment = COALESCE(?, billing_treatment),
           receipt_url = COALESCE(?, receipt_url),
           vendor_name = COALESCE(?, vendor_name),
           payment_method = COALESCE(?, payment_method),
           notes = COALESCE(?, notes),
           updated_at = datetime('now')
         WHERE id = ?`,
        [client_id, project_id, vehicle_id, spent_by_id, expense_date,
         category, expense_type, description, from_location, to_location,
         travel_mode, trip_type, distance_km, vehicle_mileage,
         fuel_price_per_liter, finalAmount, currency, exRate, baseAmount,
         billing_treatment, receipt_url, vendor_name, payment_method, notes, id]
      );
    }

    const updated = await db.queryOne<any>('SELECT * FROM expenses WHERE id = $1', [id]);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

expensesRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const exp = await db.queryOne<any>('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!exp) return res.status(404).json({ error: 'Expense not found' });

    if (exp.invoice_allocation_status === 'Fully_Invoiced' && exp.invoice_id) {
      return res.status(400).json({ error: 'Cannot delete an expense that has already been billed on an invoice.' });
    }

    await db.execute('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
