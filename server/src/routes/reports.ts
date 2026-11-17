import { Router } from 'express';
import { db } from '../db/index.js';
import { AccountingService } from '../services/accounting.js';

export const reportsRouter = Router();
const accounting = new AccountingService(db);

// Main executive dashboard metrics
reportsRouter.get('/dashboard', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { start_date, end_date } = req.query;

  const data = accounting.getExecutiveDashboard(
    orgId,
    typeof start_date === 'string' ? start_date : undefined,
    typeof end_date === 'string' ? end_date : undefined
  );

  res.json(data);
});

// Profit & Loss Report
reportsRouter.get('/profit-loss', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { start_date, end_date } = req.query;

  let dateFilterInv = "";
  let dateFilterExp = "";
  const paramsInv: any[] = [orgId];
  const paramsExp: any[] = [orgId];

  if (start_date && end_date) {
    dateFilterInv = " AND issue_date BETWEEN ? AND ?";
    dateFilterExp = " AND expense_date BETWEEN ? AND ?";
    paramsInv.push(start_date, end_date);
    paramsExp.push(start_date, end_date);
  }

  const revenue = db.prepare(`
    SELECT 
      COALESCE(SUM(total_amount * exchange_rate), 0) as total_invoiced,
      COALESCE(SUM(subtotal * exchange_rate), 0) as service_revenue,
      COALESCE(SUM(tax_amount * exchange_rate), 0) as tax_collected,
      COALESCE(SUM(discount_amount * exchange_rate), 0) as discounts_given
    FROM invoices
    WHERE organization_id = ? AND status != 'Cancelled' ${dateFilterInv}
  `).get(...paramsInv) as any;

  const expenses = db.prepare(`
    SELECT 
      category,
      expense_type,
      billing_treatment,
      COALESCE(SUM(base_amount), 0) as total
    FROM expenses
    WHERE organization_id = ? ${dateFilterExp}
    GROUP BY category, expense_type, billing_treatment
    ORDER BY total DESC
  `).all(...paramsExp) as any[];

  const team = db.prepare(`
    SELECT COALESCE(SUM(pm.agreed_rate), 0) as team_payouts
    FROM project_members pm
    JOIN projects p ON pm.project_id = p.id
    WHERE p.organization_id = ?
  `).get(orgId) as any;

  const totalInvoiced = Number(revenue?.total_invoiced || 0);
  const teamPayouts = Number(team?.team_payouts || 0);

  let billableExpenses = 0;
  let nonBillableOverhead = 0;

  for (const exp of expenses) {
    if (exp.billing_treatment === 'Client_Billable') {
      billableExpenses += Number(exp.total);
    } else {
      nonBillableOverhead += Number(exp.total);
    }
  }

  const totalCosts = nonBillableOverhead + teamPayouts;
  const netProfit = totalInvoiced - totalCosts;

  res.json({
    revenue: {
      totalInvoiced,
      serviceRevenue: Number(revenue?.service_revenue || 0),
      taxCollected: Number(revenue?.tax_collected || 0),
      discountsGiven: Number(revenue?.discounts_given || 0)
    },
    expensesBreakdown: expenses,
    billableExpenses,
    nonBillableOverhead,
    teamPayouts,
    totalCosts,
    netProfit
  });
});

// Client-wise profitability report
reportsRouter.get('/client-profitability', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const clients = db.prepare('SELECT id, name, company_name, preferred_currency FROM clients WHERE organization_id = ?').all(orgId) as any[];

  const report = clients.map(c => {
    const financials = accounting.getClientFinancials(c.id);
    return {
      id: c.id,
      name: c.name,
      company: c.company_name,
      currency: c.preferred_currency,
      ...financials
    };
  }).sort((a, b) => b.netProfit - a.netProfit);

  res.json(report);
});

// Project-wise profitability report
reportsRouter.get('/project-profitability', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const projects = db.prepare(`
    SELECT p.id, p.name, p.category, p.shoot_date, p.currency, c.name as client_name
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.organization_id = ?
    ORDER BY p.shoot_date DESC
  `).all(orgId) as any[];

  const report = projects.map(p => {
    const financials = accounting.getProjectFinancials(p.id);
    return {
      ...p,
      ...financials
    };
  }).sort((a, b) => b.netProfit - a.netProfit);

  res.json(report);
});

// Travel & Fuel report
reportsRouter.get('/travel-expenses', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { start_date, end_date } = req.query;

  let dateFilter = "";
  const params: any[] = [orgId];
  if (start_date && end_date) {
    dateFilter = " AND expense_date BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }

  const travelSummary = db.prepare(`
    SELECT 
      COALESCE(SUM(base_amount), 0) as total_travel_cost,
      COALESCE(SUM(CASE WHEN category IN ('Petrol', 'Diesel') THEN base_amount ELSE 0 END), 0) as fuel_cost,
      COALESCE(SUM(CASE WHEN category NOT IN ('Petrol', 'Diesel') THEN base_amount ELSE 0 END), 0) as non_fuel_cost,
      COALESCE(SUM(distance_km), 0) as total_distance_km,
      COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_travel,
      COALESCE(SUM(CASE WHEN billing_treatment = 'Business_Expense' THEN base_amount ELSE 0 END), 0) as business_travel
    FROM expenses
    WHERE organization_id = ? AND expense_type = 'Travel' ${dateFilter}
  `).get(...params) as any;

  const modeBreakdown = db.prepare(`
    SELECT travel_mode, COUNT(*) as trips, SUM(distance_km) as distance, SUM(base_amount) as total_cost
    FROM expenses
    WHERE organization_id = ? AND expense_type = 'Travel' ${dateFilter}
    GROUP BY travel_mode
  `).all(...params) as any[];

  const vehicleBreakdown = db.prepare(`
    SELECT v.name, v.type, v.license_plate, COUNT(e.id) as trips, SUM(e.distance_km) as total_distance, SUM(e.base_amount) as total_fuel_cost
    FROM expenses e
    JOIN vehicles v ON e.vehicle_id = v.id
    WHERE e.organization_id = ? ${dateFilter}
    GROUP BY v.id
  `).all(...params) as any[];

  res.json({
    summary: travelSummary,
    byMode: modeBreakdown,
    byVehicle: vehicleBreakdown
  });
});
