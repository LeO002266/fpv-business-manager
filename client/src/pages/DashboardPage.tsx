import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Receipt,
  MapPin,
  Users,
  Film,
  PieChart as PieChartIcon
} from 'lucide-react';
import { StatCard } from '../components/StatCard.js';
import { FilterChips } from '../components/ui/FilterChips.js';
import { Badge } from '../components/ui/Badge.js';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { RevenueAreaChart } from '../components/charts/RevenueAreaChart.js';
import { DonutChart, DonutLegend, DonutSlice } from '../components/charts/DonutChart.js';
import { TopClientsChart } from '../components/charts/TopClientsChart.js';
import { CHART_COLORS, DONUT_PALETTE } from '../components/charts/chartTheme.js';

export const DashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [timeFilter]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      let start: string | undefined;
      let end: string | undefined;
      const today = new Date();

      if (timeFilter === 'today') {
        start = today.toISOString().slice(0, 10);
        end = start;
      } else if (timeFilter === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
      } else if (timeFilter === 'year') {
        start = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
      }

      const [dashRes, invRes, expRes] = await Promise.all([
        api.getDashboardReports(start, end),
        api.getInvoices(),
        api.getExpenses()
      ]);

      setData(dashRes);
      setInvoices(invRes);
      setExpenses(expRes);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Computing real-time ERP financial metrics...</span>
        </div>
      </div>
    );
  }

  const {
    financials = {},
    counts = {},
    monthlyStats = [],
    categoryBreakdown = [],
    topClients = []
  } = data || {};

  // Invoice status totals (base currency, excluding cancelled)
  const statusColors: Record<string, string> = {
    'Paid': CHART_COLORS.paid,
    'Partially Paid': CHART_COLORS.partial,
    'Unpaid': CHART_COLORS.unpaid,
    'Overdue': CHART_COLORS.overdue,
  };
  const statusTotals: Record<string, number> = {};
  invoices
    .filter((i) => i.status !== 'Cancelled')
    .forEach((i) => {
      const base = Number(i.total_amount) * Number(i.exchange_rate || 1);
      statusTotals[i.status] = (statusTotals[i.status] || 0) + base;
    });
  const invoiceSlices: DonutSlice[] = Object.entries(statusTotals)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: statusColors[name] || CHART_COLORS.other,
    }))
    .sort((a, b) => b.value - a.value);
  const totalBilled = invoiceSlices.reduce((t, s) => t + s.value, 0);

  // Expense category donut: top 5 + Other
  const rawCatSlices = categoryBreakdown.map((c: any, i: number) => ({
    name: c.category,
    value: Number(c.total) || 0,
    color: DONUT_PALETTE[i % DONUT_PALETTE.length],
  }));
  const topCats = rawCatSlices.slice(0, 5);
  let otherCatValue = 0;
rawCatSlices.slice(5).forEach((s: any) => { otherCatValue += (s as any).value; });
  const expenseSlices: DonutSlice[] =
    otherCatValue > 0
      ? [...topCats, { name: 'Other', value: otherCatValue, color: CHART_COLORS.other }]
      : topCats;
  const totalSpend = expenseSlices.reduce((t, s) => t + s.value, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute -top-24 left-1/3 w-96 h-44 bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-emerald-500/60 via-teal-500/30 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Executive Overview
              </span>
              <span className="text-xs text-slate-400">Rajnagar Base & Global Operations</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-2 tracking-tight">
              Financial & Shoot Operations Hub
            </h2>
          </div>

          <FilterChips
            options={[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
            ]}
            value={timeFilter}
            onChange={setTimeFilter}
          />
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoiced Revenue"
          value={formatCurrency(financials.totalRevenue || 0)}
          subtitle="Issued client billings"
          color="sky"
          icon={Receipt}
        />
        <StatCard
          label="Cash Received"
          value={formatCurrency(financials.totalReceived || 0)}
          subtitle="Actual payments collected"
          color="emerald"
          icon={CreditCard}
        />
        <StatCard
          label="Pending Receivables"
          value={formatCurrency(financials.pendingReceivables || 0)}
          subtitle="Uncollected invoice balances"
          color="amber"
          icon={AlertCircle}
        />
        <StatCard
          label="Net Business Profit"
          value={formatCurrency(financials.netProfit || 0)}
          subtitle="Revenue − Internal costs"
          color="emerald"
          icon={TrendingUp}
        />
      </div>

      {/* Secondary Cost & Operations Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Travel & Fuel Cost"
          value={formatCurrency(financials.travelExpenses || 0)}
          subtitle={`${formatCurrency(financials.billableExpenses || 0)} billable`}
          color="slate"
          icon={MapPin}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(financials.totalExpenses || 0)}
          subtitle="Travel + overhead + assets"
          color="rose"
        />
        <StatCard
          label="Active Shoots"
          value={counts.ongoing_projects || 0}
          subtitle={`${counts.total_projects || 0} total bookings`}
          color="slate"
          icon={Film}
        />
        <StatCard
          label="Active Clients"
          value={counts.active_clients || 0}
          subtitle={`${counts.total_clients || 0} registered CRM`}
          color="slate"
          icon={Users}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expense Trend */}
        <div className="glass lg:col-span-2 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Revenue vs. Expense Trajectory</h3>
              <p className="text-xs text-slate-400">Monthly billing vs cash outlays with profit trend</p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono border border-emerald-500/20">
              Live Trend
            </span>
          </div>
          <RevenueAreaChart data={monthlyStats} />
        </div>

        {/* Expense Category Donut */}
        <div className="glass p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Expense Allocation</h3>
              <p className="text-xs text-slate-400">Top operational cost categories</p>
            </div>
            <PieChartIcon className="w-4 h-4 text-slate-400" />
          </div>
          <DonutChart
            data={expenseSlices}
            centerValue={formatCurrency(totalSpend)}
            centerLabel="Total Spend"
          />
          <DonutLegend slices={expenseSlices} total={totalSpend} />
          <div className="pt-3 mt-auto">
            <button
              onClick={() => onNavigate('travel')}
              className="w-full text-xs text-center text-emerald-400 hover:text-emerald-300 font-semibold py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
            >
              View Route & Mileage Details →
            </button>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div className="glass lg:col-span-2 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Top Clients by Revenue</h3>
              <p className="text-xs text-slate-400">Highest-billing clients of all time</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <TopClientsChart data={topClients} />
        </div>

        {/* Invoice Status Donut */}
        <div className="glass p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Invoice Status</h3>
              <p className="text-xs text-slate-400">Outstanding vs collected billings</p>
            </div>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <DonutChart
            data={invoiceSlices}
            centerValue={formatCurrency(totalBilled)}
            centerLabel="Total Billed"
          />
          <DonutLegend slices={invoiceSlices} total={totalBilled} />
        </div>
      </div>

      {/* Recent Activity: Invoices & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Invoices</h3>
              <p className="text-xs text-slate-400">Latest billings & payment status</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              All Invoices ({invoices.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            {invoices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No invoices yet</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Client</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-center">Status</Th>
                  </tr>
                </THead>
                <TBody>
                  {invoices.slice(0, 5).map(inv => (
                    <Tr key={inv.id}>
                      <Td className="font-mono font-medium text-slate-200">{inv.invoice_number}</Td>
                      <Td className="text-slate-300 font-medium">{inv.client_name}</Td>
                      <Td className="text-right font-mono text-slate-200">{formatCurrency(inv.total_amount, inv.currency)}</Td>
                      <Td className="text-center">
                        <Badge variant={
                          inv.status === 'Paid' ? 'success'
                          : inv.status === 'Partially Paid' ? 'warning'
                          : 'danger'
                        }>
                          {inv.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </div>

        {/* Recent Travel & Expenses */}
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Travel & Project Expenses</h3>
              <p className="text-xs text-slate-400">Routes, fuel, toll, and operational outlays</p>
            </div>
            <button
              onClick={() => onNavigate('travel')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              All Expenses ({expenses.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No expenses recorded yet</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Category</Th>
                    <Th>Route / Details</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="text-center">Billing</Th>
                  </tr>
                </THead>
                <TBody>
                  {expenses.slice(0, 5).map(exp => (
                    <Tr key={exp.id}>
                      <Td className="text-slate-400 font-mono text-[11px]">{formatDate(exp.expense_date)}</Td>
                      <Td className="text-slate-200 font-medium">{exp.category}</Td>
                      <Td className="text-slate-400 truncate max-w-[150px]">
                        {exp.from_location ? `${exp.from_location} → ${exp.to_location}` : exp.description || '—'}
                      </Td>
                      <Td className="text-right font-mono text-slate-200">{formatCurrency(exp.amount, exp.currency)}</Td>
                      <Td className="text-center">
                        <Badge variant={exp.billing_treatment === 'Client_Billable' ? 'success' : 'neutral'}>
                          {exp.billing_treatment === 'Client_Billable' ? 'Billable' : 'Overhead'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
