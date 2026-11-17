/**
 * AccountingService — async version compatible with both SQLite and PostgreSQL.
 * All methods are now async and use the DbAdapter interface.
 */

import type { DbAdapter } from '../db/adapter.js';

export interface ClientFinancials {
  clientId: string;
  totalBilled: number;
  totalReceived: number;
  pendingReceivables: number;
  travelExpenses: number;
  otherExpenses: number;
  billableExpenses: number;
  nonBillableExpenses: number;
  teamCosts: number;
  totalCost: number;
  netProfit: number;
  profitMarginPercent: number;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
}

export interface ProjectFinancials {
  projectId: string;
  agreedAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  travelExpenses: number;
  otherExpenses: number;
  billableExpenses: number;
  nonBillableExpenses: number;
  teamCosts: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
}

export class AccountingService {
  constructor(private db: DbAdapter) {}

  async getClientFinancials(clientId: string): Promise<ClientFinancials> {
    const [invRow, expRow, teamRow, projCounts] = await Promise.all([
      this.db.queryOne<any>(`
        SELECT
          COALESCE(SUM(total_amount * exchange_rate), 0) as total_billed,
          COALESCE(SUM(amount_paid * exchange_rate), 0) as total_received,
          COALESCE(SUM(balance_due * exchange_rate), 0) as pending_receivables
        FROM invoices
        WHERE client_id = $1 AND status != 'Cancelled'
      `, [clientId]),

      this.db.queryOne<any>(`
        SELECT
          COALESCE(SUM(CASE WHEN expense_type = 'Travel' THEN base_amount ELSE 0 END), 0) as travel_expenses,
          COALESCE(SUM(CASE WHEN expense_type != 'Travel' THEN base_amount ELSE 0 END), 0) as other_expenses,
          COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_expenses,
          COALESCE(SUM(CASE WHEN billing_treatment = 'Business_Expense' THEN base_amount ELSE 0 END), 0) as non_billable_expenses
        FROM expenses
        WHERE client_id = $1
      `, [clientId]),

      this.db.queryOne<any>(`
        SELECT COALESCE(SUM(pm.agreed_rate), 0) as team_costs
        FROM project_members pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.client_id = $1
      `, [clientId]),

      this.db.queryOne<any>(`
        SELECT
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status IN ('Confirmed', 'Scheduled', 'In Progress') THEN 1 END) as ongoing_projects
        FROM projects
        WHERE client_id = $1
      `, [clientId]),
    ]);

    const totalBilled = Number(invRow?.total_billed || 0);
    const totalReceived = Number(invRow?.total_received || 0);
    const pendingReceivables = Number(invRow?.pending_receivables || 0);
    const travelExpenses = Number(expRow?.travel_expenses || 0);
    const otherExpenses = Number(expRow?.other_expenses || 0);
    const billableExpenses = Number(expRow?.billable_expenses || 0);
    const nonBillableExpenses = Number(expRow?.non_billable_expenses || 0);
    const teamCosts = Number(teamRow?.team_costs || 0);

    const totalCost = nonBillableExpenses + teamCosts;
    const netProfit = totalBilled - totalCost;
    const profitMarginPercent = totalBilled > 0 ? (netProfit / totalBilled) * 100 : 0;

    return {
      clientId,
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      pendingReceivables: Math.round(pendingReceivables * 100) / 100,
      travelExpenses: Math.round(travelExpenses * 100) / 100,
      otherExpenses: Math.round(otherExpenses * 100) / 100,
      billableExpenses: Math.round(billableExpenses * 100) / 100,
      nonBillableExpenses: Math.round(nonBillableExpenses * 100) / 100,
      teamCosts: Math.round(teamCosts * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      totalProjects: Number(projCounts?.total_projects || 0),
      completedProjects: Number(projCounts?.completed_projects || 0),
      ongoingProjects: Number(projCounts?.ongoing_projects || 0),
    };
  }

  async getProjectFinancials(projectId: string): Promise<ProjectFinancials> {
    const proj = await this.db.queryOne<any>(
      'SELECT agreed_amount, currency FROM projects WHERE id = $1',
      [projectId]
    );
    const agreedAmount = Number(proj?.agreed_amount || 0);

    const [invRow, payRow, expRow, teamRow] = await Promise.all([
      this.db.queryOne<any>(`
        SELECT
          COALESCE(SUM(total_amount), 0) as invoiced_amount,
          COALESCE(SUM(amount_paid), 0) as received_amount,
          COALESCE(SUM(balance_due), 0) as pending_amount
        FROM invoices
        WHERE project_id = $1 AND status != 'Cancelled'
      `, [projectId]),

      this.db.queryOne<any>(`
        SELECT COALESCE(SUM(pa.amount_allocated), 0) as actual_received
        FROM payment_allocations pa
        JOIN invoices i ON pa.invoice_id = i.id
        WHERE i.project_id = $1
      `, [projectId]),

      this.db.queryOne<any>(`
        SELECT
          COALESCE(SUM(CASE WHEN expense_type = 'Travel' THEN base_amount ELSE 0 END), 0) as travel_expenses,
          COALESCE(SUM(CASE WHEN expense_type != 'Travel' THEN base_amount ELSE 0 END), 0) as other_expenses,
          COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_expenses,
          COALESCE(SUM(CASE WHEN billing_treatment != 'Client_Billable' THEN base_amount ELSE 0 END), 0) as non_billable_expenses
        FROM expenses
        WHERE project_id = $1
      `, [projectId]),

      this.db.queryOne<any>(`
        SELECT COALESCE(SUM(agreed_rate), 0) as team_costs
        FROM project_members
        WHERE project_id = $1
      `, [projectId]),
    ]);

    const invoicedAmount = Number(invRow?.invoiced_amount || 0);
    const receivedAmount = Number(payRow?.actual_received || invRow?.received_amount || 0);
    const pendingAmount = Number(invRow?.pending_amount || 0);
    const travelExpenses = Number(expRow?.travel_expenses || 0);
    const otherExpenses = Number(expRow?.other_expenses || 0);
    const billableExpenses = Number(expRow?.billable_expenses || 0);
    const nonBillableExpenses = Number(expRow?.non_billable_expenses || 0);
    const teamCosts = Number(teamRow?.team_costs || 0);

    const totalCost = nonBillableExpenses + teamCosts;
    const grossProfit = invoicedAmount - totalCost;
    const netProfit = agreedAmount - totalCost;
    const profitMarginPercent = agreedAmount > 0 ? (netProfit / agreedAmount) * 100 : 0;

    return {
      projectId,
      agreedAmount: Math.round(agreedAmount * 100) / 100,
      invoicedAmount: Math.round(invoicedAmount * 100) / 100,
      receivedAmount: Math.round(receivedAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      travelExpenses: Math.round(travelExpenses * 100) / 100,
      otherExpenses: Math.round(otherExpenses * 100) / 100,
      billableExpenses: Math.round(billableExpenses * 100) / 100,
      nonBillableExpenses: Math.round(nonBillableExpenses * 100) / 100,
      teamCosts: Math.round(teamCosts * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    };
  }

  async getDashboardStats(orgId: string, startDate?: string, endDate?: string): Promise<any> {
    const db = this.db;
    const isPg = db.isPg;

    // Build date params
    let dateFilterInv = '';
    let dateFilterExp = '';
    const paramsInvBase = [orgId];
    const paramsExpBase = [orgId];

    if (startDate && endDate) {
      dateFilterInv = isPg ? ` AND issue_date BETWEEN $2 AND $3` : ` AND issue_date BETWEEN ? AND ?`;
      dateFilterExp = isPg ? ` AND expense_date BETWEEN $2 AND $3` : ` AND expense_date BETWEEN ? AND ?`;
      paramsInvBase.push(startDate, endDate);
      paramsExpBase.push(startDate, endDate);
    }

    const ph = (n: number) => isPg ? `$${n}` : '?';

    const [inv, pay, exp, team, counts] = await Promise.all([
      db.queryOne<any>(`
        SELECT
          COALESCE(SUM(total_amount * exchange_rate), 0) as total_invoiced,
          COALESCE(SUM(amount_paid * exchange_rate), 0) as total_received,
          COALESCE(SUM(balance_due * exchange_rate), 0) as pending_receivables,
          COALESCE(SUM(CASE WHEN status IN ('Unpaid','Partially Paid','Overdue') THEN total_amount * exchange_rate ELSE 0 END), 0) as outstanding
        FROM invoices
        WHERE organization_id = ${ph(1)} AND status != 'Cancelled' ${dateFilterInv}
      `, paramsInvBase),

      db.queryOne<any>(`
        SELECT COALESCE(SUM(base_amount), 0) as total_cash_received
        FROM payments
        WHERE organization_id = ${ph(1)} ${dateFilterInv.replace(/issue_date/g, 'payment_date')}
      `, paramsInvBase),

      db.queryOne<any>(`
        SELECT
          COALESCE(SUM(base_amount), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN expense_type = 'Travel' THEN base_amount ELSE 0 END), 0) as travel_expenses,
          COALESCE(SUM(CASE WHEN expense_type = 'Project_Direct' THEN base_amount ELSE 0 END), 0) as project_expenses,
          COALESCE(SUM(CASE WHEN expense_type = 'General_Business' THEN base_amount ELSE 0 END), 0) as overhead_expenses,
          COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_expenses
        FROM expenses
        WHERE organization_id = ${ph(1)} ${dateFilterExp}
      `, paramsExpBase),

      db.queryOne<any>(`
        SELECT COALESCE(SUM(pm.agreed_rate), 0) as team_costs
        FROM project_members pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.organization_id = ${ph(1)}
      `, [orgId]),

      db.queryOne<any>(`
        SELECT
          (SELECT COUNT(*) FROM clients WHERE organization_id = ${ph(1)}) as total_clients,
          (SELECT COUNT(*) FROM clients WHERE organization_id = ${ph(2)} AND status = 'Active') as active_clients,
          (SELECT COUNT(*) FROM projects WHERE organization_id = ${ph(3)}) as total_projects,
          (SELECT COUNT(*) FROM projects WHERE organization_id = ${ph(4)} AND status IN ('Confirmed', 'Scheduled', 'In Progress')) as ongoing_projects,
          (SELECT COUNT(*) FROM projects WHERE organization_id = ${ph(5)} AND status = 'Completed') as completed_projects,
          (SELECT COUNT(*) FROM invoices WHERE organization_id = ${ph(6)} AND status IN ('Unpaid', 'Partially Paid', 'Overdue')) as unpaid_invoices,
          (SELECT COUNT(*) FROM quotations WHERE organization_id = ${ph(7)} AND status = 'Sent') as pending_quotations
      `, [orgId, orgId, orgId, orgId, orgId, orgId, orgId]),
    ]);

    const totalRevenue = Number(inv?.total_invoiced || 0);
    const totalReceived = Number(pay?.total_cash_received || 0);
    const pendingReceivables = Number(inv?.pending_receivables || 0);
    const totalExpenses = Number(exp?.total_expenses || 0);
    const travelExpenses = Number(exp?.travel_expenses || 0);
    const projectExpenses = Number(exp?.project_expenses || 0);
    const overheadExpenses = Number(exp?.overhead_expenses || 0);
    const billableExpenses = Number(exp?.billable_expenses || 0);
    const teamCosts = Number(team?.team_costs || 0);
    const netProfit = totalRevenue - overheadExpenses - teamCosts;

    // Monthly breakdown — last 6 months
    const monthlyStats = await db.query<any>(
      isPg
        ? `
          WITH months AS (
            SELECT to_char(issue_date, 'YYYY-MM') as month, SUM(total_amount * exchange_rate) as revenue
            FROM invoices WHERE organization_id = $1 AND status != 'Cancelled'
            GROUP BY to_char(issue_date, 'YYYY-MM')
          ),
          exp_months AS (
            SELECT to_char(expense_date, 'YYYY-MM') as month, SUM(base_amount) as expenses
            FROM expenses WHERE organization_id = $2
            GROUP BY to_char(expense_date, 'YYYY-MM')
          )
          SELECT
            COALESCE(m.month, e.month) as month,
            COALESCE(m.revenue, 0) as revenue,
            COALESCE(e.expenses, 0) as expenses
          FROM months m
          FULL OUTER JOIN exp_months e ON m.month = e.month
          ORDER BY month DESC LIMIT 6
        `
        : `
          WITH months AS (
            SELECT strftime('%Y-%m', issue_date) as month, SUM(total_amount * exchange_rate) as revenue
            FROM invoices WHERE organization_id = ? AND status != 'Cancelled'
            GROUP BY strftime('%Y-%m', issue_date)
          ),
          exp_months AS (
            SELECT strftime('%Y-%m', expense_date) as month, SUM(base_amount) as expenses
            FROM expenses WHERE organization_id = ?
            GROUP BY strftime('%Y-%m', expense_date)
          )
          SELECT
            COALESCE(m.month, e.month) as month,
            COALESCE(m.revenue, 0) as revenue,
            COALESCE(e.expenses, 0) as expenses
          FROM months m
          FULL OUTER JOIN exp_months e ON m.month = e.month
          ORDER BY month DESC LIMIT 6
        `,
      [orgId, orgId]
    );

    const categoryBreakdown = await db.query<any>(
      `SELECT category, SUM(base_amount) as total, COUNT(*) as count
       FROM expenses WHERE organization_id = ${isPg ? '$1' : '?'}
       GROUP BY category ORDER BY total DESC`,
      [orgId]
    );

    const topClients = await db.query<any>(
      `SELECT c.id, c.name, COALESCE(SUM(i.total_amount * i.exchange_rate), 0) as revenue
       FROM clients c
       JOIN invoices i ON c.id = i.client_id
       WHERE c.organization_id = ${isPg ? '$1' : '?'} AND i.status != 'Cancelled'
       GROUP BY c.id, c.name
       ORDER BY revenue DESC LIMIT 5`,
      [orgId]
    );

    return {
      financials: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalReceived: Math.round(totalReceived * 100) / 100,
        pendingReceivables: Math.round(pendingReceivables * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        travelExpenses: Math.round(travelExpenses * 100) / 100,
        projectExpenses: Math.round(projectExpenses * 100) / 100,
        overheadExpenses: Math.round(overheadExpenses * 100) / 100,
        billableExpenses: Math.round(billableExpenses * 100) / 100,
        teamCosts: Math.round(teamCosts * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        cashMargin: Math.round((totalReceived - totalExpenses) * 100) / 100,
      },
      counts,
      monthlyStats: [...monthlyStats].reverse().map((m) => ({
        month: m.month,
        revenue: Math.round(Number(m.revenue) || 0),
        expenses: Math.round(Number(m.expenses) || 0),
        profit: Math.round((Number(m.revenue) || 0) - (Number(m.expenses) || 0)),
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        total: Math.round(Number(c.total) || 0),
        count: Number(c.count),
      })),
      topClients: topClients.map((c) => ({
        id: c.id,
        name: c.name,
        revenue: Math.round(Number(c.revenue) || 0),
      })),
    };
  }
}
