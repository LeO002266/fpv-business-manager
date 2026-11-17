import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import { AccountingService } from '../services/accounting.js';

export const reportsRouter = Router();

// Main executive dashboard metrics
reportsRouter.get('/dashboard', async (req, res) => {
  try {
    const db = getAdapter();
    const accounting = new AccountingService(db);
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { start_date, end_date } = req.query;

    const data = await accounting.getDashboardStats(
      orgId,
      typeof start_date === 'string' ? start_date : undefined,
      typeof end_date === 'string' ? end_date : undefined
    );

    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Profit & Loss Report
reportsRouter.get('/profit-loss', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { start_date, end_date } = req.query;

    let dateFilterInv = "";
    let dateFilterExp = "";
    const paramsInv: any[] = [orgId];
    const paramsExp: any[] = [orgId];

    if (start_date && end_date) {
      dateFilterInv = " AND issue_date BETWEEN $2 AND $3";
      dateFilterExp = " AND expense_date BETWEEN $2 AND $3";
      paramsInv.push(start_date, end_date);
      paramsExp.push(start_date, end_date);
    }

    const revenue = await db.queryOne<any>(`
      SELECT 
        COALESCE(SUM(total_amount * exchange_rate), 0) as total_invoiced,
        COALESCE(SUM(subtotal * exchange_rate), 0) as service_revenue,
        COALESCE(SUM(tax_amount * exchange_rate), 0) as tax_collected,
        COALESCE(SUM(discount_amount * exchange_rate), 0) as discounts_given
      FROM invoices
      WHERE organization_id = $1 AND status != 'Cancelled' ${dateFilterInv}
    `, paramsInv);

    const expenses = await db.query<any>(`
      SELECT 
        category,
        expense_type,
        billing_treatment,
        COALESCE(SUM(base_amount), 0) as total
      FROM expenses
      WHERE organization_id = $1 ${dateFilterExp}
      GROUP BY category, expense_type, billing_treatment
      ORDER BY total DESC
    `, paramsExp);

    const team = await db.queryOne<any>(`
      SELECT COALESCE(SUM(pm.agreed_rate), 0) as team_payouts
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.organization_id = $1
    `, [orgId]);

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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Client-wise profitability report
reportsRouter.get('/client-profitability', async (req, res) => {
  try {
    const db = getAdapter();
    const accounting = new AccountingService(db);
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const clients = await db.query<any>('SELECT id, name, company_name, preferred_currency FROM clients WHERE organization_id = $1', [orgId]);

    const report = (await Promise.all(clients.map(async (c) => {
      const financials = await accounting.getClientFinancials(c.id);
      return {
        id: c.id,
        name: c.name,
        company: c.company_name,
        currency: c.preferred_currency,
        ...financials
      };
    }))).sort((a, b) => b.netProfit - a.netProfit);

    res.json(report);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Project-wise profitability report
reportsRouter.get('/project-profitability', async (req, res) => {
  try {
    const db = getAdapter();
    const accounting = new AccountingService(db);
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const projects = await db.query<any>(`
      SELECT p.id, p.name, p.category, p.shoot_date, p.currency, c.name as client_name
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      WHERE p.organization_id = $1
      ORDER BY p.shoot_date DESC
    `, [orgId]);

    const report = (await Promise.all(projects.map(async (p) => {
      const financials = await accounting.getProjectFinancials(p.id);
      return {
        ...p,
        ...financials
      };
    }))).sort((a, b) => b.netProfit - a.netProfit);

    res.json(report);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Travel & Fuel report
reportsRouter.get('/travel-expenses', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { start_date, end_date } = req.query;

    let dateFilter = "";
    const params: any[] = [orgId];
    if (start_date && end_date) {
      dateFilter = " AND expense_date BETWEEN $2 AND $3";
      params.push(start_date, end_date);
    }

    const travelSummary = await db.queryOne<any>(`
      SELECT 
        COALESCE(SUM(base_amount), 0) as total_travel_cost,
        COALESCE(SUM(CASE WHEN category IN ('Petrol', 'Diesel') THEN base_amount ELSE 0 END), 0) as fuel_cost,
        COALESCE(SUM(CASE WHEN category NOT IN ('Petrol', 'Diesel') THEN base_amount ELSE 0 END), 0) as non_fuel_cost,
        COALESCE(SUM(distance_km), 0) as total_distance_km,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_travel,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Business_Expense' THEN base_amount ELSE 0 END), 0) as business_travel
      FROM expenses
      WHERE organization_id = $1 AND expense_type = 'Travel' ${dateFilter}
    `, params);

    const modeBreakdown = await db.query<any>(`
      SELECT travel_mode, COUNT(*) as trips, SUM(distance_km) as distance, SUM(base_amount) as total_cost
      FROM expenses
      WHERE organization_id = $1 AND expense_type = 'Travel' ${dateFilter}
      GROUP BY travel_mode
    `, params);

    const vehicleBreakdown = await db.query<any>(`
      SELECT v.name, v.type, v.license_plate, COUNT(e.id) as trips, SUM(e.distance_km) as total_distance, SUM(e.base_amount) as total_fuel_cost
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.organization_id = $1 ${dateFilter}
      GROUP BY v.id
    `, params);

    res.json({
      summary: travelSummary,
      byMode: modeBreakdown,
      byVehicle: vehicleBreakdown
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
