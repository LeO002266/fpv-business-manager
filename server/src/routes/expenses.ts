import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const expensesRouter = Router();

// List expenses with filters
expensesRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { category, expense_type, billing_treatment, client_id, project_id, start_date, end_date } = req.query;

  let query = `
    SELECT e.*, c.name as client_name, p.name as project_name, v.name as vehicle_name, tm.name as spent_by_name
    FROM expenses e
    LEFT JOIN clients c ON e.client_id = c.id
    LEFT JOIN projects p ON e.project_id = p.id
    LEFT JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN team_members tm ON e.spent_by_id = tm.id
    WHERE e.organization_id = ?
  `;
  const params: any[] = [orgId];

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }
  if (expense_type) {
    query += ' AND e.expense_type = ?';
    params.push(expense_type);
  }
  if (billing_treatment) {
    query += ' AND e.billing_treatment = ?';
    params.push(billing_treatment);
  }
  if (client_id) {
    query += ' AND e.client_id = ?';
    params.push(client_id);
  }
  if (project_id) {
    query += ' AND e.project_id = ?';
    params.push(project_id);
  }
  if (start_date && end_date) {
    query += ' AND e.expense_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' ORDER BY e.expense_date DESC';

  const expenses = db.prepare(query).all(...params) as any[];
  res.json(expenses);
});

// Create expense
expensesRouter.post('/', (req, res) => {
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

  // Determine expense_type if not explicitly passed
  let finalType = expense_type;
  if (!finalType) {
    const travelCategories = ['Petrol', 'Diesel', 'Charging', 'Toll', 'Parking', 'Hotel', 'Food', 'Flight Ticket', 'Train Ticket', 'Bus Ticket', 'Taxi', 'Local Transport'];
    const capitalCategories = ['Equipment Purchase', 'Battery Purchase', 'Accessories'];
    if (travelCategories.includes(category)) {
      finalType = 'Travel';
    } else if (capitalCategories.includes(category)) {
      finalType = 'Equipment_Capital';
    } else if (project_id) {
      finalType = 'Project_Direct';
    } else {
      finalType = 'General_Business';
    }
  }

  db.prepare(`
    INSERT INTO expenses (
      id, organization_id, client_id, project_id, vehicle_id, spent_by_id,
      expense_date, category, expense_type, description, from_location,
      to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
      fuel_price_per_liter, calculated_fuel_cost, amount, currency,
      exchange_rate, base_amount, billing_treatment, invoice_allocation_status,
      receipt_url, vendor_name, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, client_id || null, project_id || null, vehicle_id || null, spent_by_id || null,
    expense_date, category, finalType, description || '', from_location || '',
    to_location || '', travel_mode || 'Car', trip_type || 'Round-Trip', dist,
    mileage, fuelPrice, calculatedFuel, finalAmount, currency || 'INR',
    exRate, baseAmount, billing_treatment || 'Client_Billable', 'Not_Invoiced',
    receipt_url || '', vendor_name || '', payment_method || 'UPI', notes || ''
  );

  const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Update expense
expensesRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    client_id, project_id, vehicle_id, spent_by_id, expense_date,
    category, expense_type, description, from_location, to_location,
    travel_mode, trip_type, distance_km, vehicle_mileage,
    fuel_price_per_liter, amount, currency, exchange_rate,
    billing_treatment, receipt_url, vendor_name, payment_method, notes
  } = req.body;

  const current = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
  if (!current) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const finalAmount = amount !== undefined ? Number(amount) : current.amount;
  const exRate = exchange_rate !== undefined ? Number(exchange_rate) : current.exchange_rate;
  const baseAmount = finalAmount * exRate;

  db.prepare(`
    UPDATE expenses SET
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
      amount = ?,
      currency = COALESCE(?, currency),
      exchange_rate = ?,
      base_amount = ?,
      billing_treatment = COALESCE(?, billing_treatment),
      receipt_url = COALESCE(?, receipt_url),
      vendor_name = COALESCE(?, vendor_name),
      payment_method = COALESCE(?, payment_method),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    client_id, project_id, vehicle_id, spent_by_id, expense_date,
    category, expense_type, description, from_location, to_location,
    travel_mode, trip_type, distance_km, vehicle_mileage,
    fuel_price_per_liter, finalAmount, currency, exRate, baseAmount,
    billing_treatment, receipt_url, vendor_name, payment_method, notes, id
  );

  const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  res.json(updated);
});

// Delete expense (protect if already on an invoice)
expensesRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const exp = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
  if (!exp) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  if (exp.invoice_allocation_status === 'Fully_Invoiced' && exp.invoice_id) {
    return res.status(400).json({ error: 'Cannot delete an expense that has already been billed on an invoice. Remove it from the invoice or cancel the invoice first.' });
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  res.json({ success: true });
});
