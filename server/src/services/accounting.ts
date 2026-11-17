import { DatabaseSync } from 'node:sqlite';

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
  constructor(private db: DatabaseSync) {}

  getClientFinancials(clientId: string): ClientFinancials {
    const invRow = this.db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount * exchange_rate), 0) as total_billed,
        COALESCE(SUM(amount_paid * exchange_rate), 0) as total_received,
        COALESCE(SUM(balance_due * exchange_rate), 0) as pending_receivables
      FROM invoices 
      WHERE client_id = ? AND status != 'Cancelled'
    `).get(clientId) as any;

    const expRow = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN expense_type = 'Travel' THEN base_amount ELSE 0 END), 0) as travel_expenses,
        COALESCE(SUM(CASE WHEN expense_type != 'Travel' THEN base_amount ELSE 0 END), 0) as other_expenses,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_expenses,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Business_Expense' THEN base_amount ELSE 0 END), 0) as non_billable_expenses
      FROM expenses
      WHERE client_id = ?
    `).get(clientId) as any;

    const teamRow = this.db.prepare(`
      SELECT COALESCE(SUM(pm.agreed_rate), 0) as team_costs
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.client_id = ?
    `).get(clientId) as any;

    const projCounts = this.db.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status IN ('Confirmed', 'Scheduled', 'In Progress') THEN 1 END) as ongoing_projects
      FROM projects
      WHERE client_id = ?
    `).get(clientId) as any;

    const totalBilled = Number(invRow?.total_billed || 0);
    const totalReceived = Number(invRow?.total_received || 0);
    const pendingReceivables = Number(invRow?.pending_receivables || 0);
    const travelExpenses = Number(expRow?.travel_expenses || 0);
    const otherExpenses = Number(expRow?.other_expenses || 0);
    const billableExpenses = Number(expRow?.billable_expenses || 0);
    const nonBillableExpenses = Number(expRow?.non_billable_expenses || 0);
    const teamCosts = Number(teamRow?.team_costs || 0);

    // Accounting rule from brief:
    // Billable expenses are recovered from client via invoice.
    // Business expenses and team costs reduce actual profit.
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
      totalProjects: projCounts?.total_projects || 0,
      completedProjects: projCounts?.completed_projects || 0,
      ongoingProjects: projCounts?.ongoing_projects || 0
    };
  }

  getProjectFinancials(projectId: string): ProjectFinancials {
    const proj = this.db.prepare('SELECT agreed_amount, currency FROM projects WHERE id = ?').get(projectId) as any;
    const agreedAmount = Number(proj?.agreed_amount || 0);

    const invRow = this.db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as invoiced_amount,
        COALESCE(SUM(amount_paid), 0) as received_amount,
        COALESCE(SUM(balance_due), 0) as pending_amount
      FROM invoices 
      WHERE project_id = ? AND status != 'Cancelled'
    `).get(projectId) as any;

    const expRow = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN expense_type = 'Travel' THEN amount ELSE 0 END), 0) as travel_expenses,
        COALESCE(SUM(CASE WHEN expense_type != 'Travel' THEN amount ELSE 0 END), 0) as other_expenses,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN amount ELSE 0 END), 0) as billable_expenses,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Business_Expense' THEN amount ELSE 0 END), 0) as non_billable_expenses
      FROM expenses
      WHERE project_id = ?
    `).get(projectId) as any;

    const teamRow = this.db.prepare(`
      SELECT COALESCE(SUM(agreed_rate), 0) as team_costs
      FROM project_members
      WHERE project_id = ?
    `).get(projectId) as any;

    const invoicedAmount = Number(invRow?.invoiced_amount || 0);
    const receivedAmount = Number(invRow?.received_amount || 0);
    const pendingAmount = Number(invRow?.pending_amount || 0);
    const travelExpenses = Number(expRow?.travel_expenses || 0);
    const otherExpenses = Number(expRow?.other_expenses || 0);
    const billableExpenses = Number(expRow?.billable_expenses || 0);
    const nonBillableExpenses = Number(expRow?.non_billable_expenses || 0);
    const teamCosts = Number(teamRow?.team_costs || 0);

    // Internal costs borne by business
    const totalCost = nonBillableExpenses + teamCosts;
    const effectiveRevenue = invoicedAmount > 0 ? invoicedAmount : agreedAmount;
    const grossProfit = agreedAmount - totalCost;
    const netProfit = effectiveRevenue - totalCost;
    const profitMarginPercent = effectiveRevenue > 0 ? (netProfit / effectiveRevenue) * 100 : 0;

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
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10
    };
  }

  getExecutiveDashboard(orgId: string, startDate?: string, endDate?: string) {
    let dateFilterInv = "";
    let dateFilterExp = "";
    let dateFilterPay = "";
    const paramsInv: any[] = [orgId];
    const paramsExp: any[] = [orgId];
    const paramsPay: any[] = [orgId];

    if (startDate && endDate) {
      dateFilterInv = " AND issue_date BETWEEN ? AND ?";
      dateFilterExp = " AND expense_date BETWEEN ? AND ?";
      dateFilterPay = " AND payment_date BETWEEN ? AND ?";
      paramsInv.push(startDate, endDate);
      paramsExp.push(startDate, endDate);
      paramsPay.push(startDate, endDate);
    }

    const inv = this.db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount * exchange_rate), 0) as total_invoiced,
        COALESCE(SUM(amount_paid * exchange_rate), 0) as total_paid_on_invoices,
        COALESCE(SUM(balance_due * exchange_rate), 0) as pending_receivables
      FROM invoices 
      WHERE organization_id = ? AND status != 'Cancelled' ${dateFilterInv}
    `).get(...paramsInv) as any;

    const pay = this.db.prepare(`
      SELECT COALESCE(SUM(base_amount), 0) as total_cash_received
      FROM payments 
      WHERE organization_id = ? ${dateFilterPay}
    `).get(...paramsPay) as any;

    const exp = this.db.prepare(`
      SELECT 
        COALESCE(SUM(base_amount), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN expense_type = 'Travel' THEN base_amount ELSE 0 END), 0) as travel_expenses,
        COALESCE(SUM(CASE WHEN expense_type != 'Travel' THEN base_amount ELSE 0 END), 0) as project_expenses,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Business_Expense' THEN base_amount ELSE 0 END), 0) as overhead_expenses,
        COALESCE(SUM(CASE WHEN billing_treatment = 'Client_Billable' THEN base_amount ELSE 0 END), 0) as billable_expenses
      FROM expenses
      WHERE organization_id = ? ${dateFilterExp}
    `).get(...paramsExp) as any;

    const team = this.db.prepare(`
      SELECT COALESCE(SUM(pm.agreed_rate), 0) as team_costs
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.organization_id = ?
    `).get(orgId) as any;

    const counts = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM clients WHERE organization_id = ?) as total_clients,
        (SELECT COUNT(*) FROM clients WHERE organization_id = ? AND status = 'Active') as active_clients,
        (SELECT COUNT(*) FROM projects WHERE organization_id = ?) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE organization_id = ? AND status IN ('Confirmed', 'Scheduled', 'In Progress')) as ongoing_projects,
        (SELECT COUNT(*) FROM projects WHERE organization_id = ? AND status = 'Completed') as completed_projects,
        (SELECT COUNT(*) FROM invoices WHERE organization_id = ? AND status IN ('Unpaid', 'Partially Paid', 'Overdue')) as unpaid_invoices,
        (SELECT COUNT(*) FROM quotations WHERE organization_id = ? AND status = 'Sent') as pending_quotations
    `).get(orgId, orgId, orgId, orgId, orgId, orgId, orgId) as any;

    const totalRevenue = Number(inv?.total_invoiced || 0);
    const totalReceived = Number(pay?.total_cash_received || 0);
    const pendingReceivables = Number(inv?.pending_receivables || 0);
    const totalExpenses = Number(exp?.total_expenses || 0);
    const travelExpenses = Number(exp?.travel_expenses || 0);
    const projectExpenses = Number(exp?.project_expenses || 0);
    const overheadExpenses = Number(exp?.overhead_expenses || 0);
    const billableExpenses = Number(exp?.billable_expenses || 0);
    const teamCosts = Number(team?.team_costs || 0);

    // Business net profit = Revenue earned minus unbilled overhead/internal costs & team costs
    const netProfit = totalRevenue - overheadExpenses - teamCosts;

    // Monthly breakdown for charts
    const monthlyStats = this.db.prepare(`
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
    `).all(orgId, orgId) as any[];

    // Expense category breakdown
    const categoryBreakdown = this.db.prepare(`
      SELECT category, SUM(base_amount) as total, COUNT(*) as count
      FROM expenses
      WHERE organization_id = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(orgId) as any[];

    // Top clients
    const topClients = this.db.prepare(`
      SELECT c.id, c.name, COALESCE(SUM(i.total_amount * i.exchange_rate), 0) as revenue
      FROM clients c
      JOIN invoices i ON c.id = i.client_id
      WHERE c.organization_id = ? AND i.status != 'Cancelled'
      GROUP BY c.id
      ORDER BY revenue DESC LIMIT 5
    `).all(orgId) as any[];

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
        cashMargin: Math.round((totalReceived - totalExpenses) * 100) / 100
      },
      counts,
      monthlyStats: monthlyStats.map(m => ({
        month: m.month,
        revenue: Math.round(m.revenue || 0),
        expenses: Math.round(m.expenses || 0),
        profit: Math.round((m.revenue || 0) - (m.expenses || 0))
      })).reverse(),
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c.category,
        total: Math.round(c.total || 0),
        count: c.count
      })),
      topClients: topClients.map(c => ({
        id: c.id,
        name: c.name,
        revenue: Math.round(c.revenue || 0)
      }))
    };
  }
}
