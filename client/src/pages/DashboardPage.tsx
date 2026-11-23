import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Receipt,
  MapPin,
  Users,
  Film,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { StatCard } from '../components/StatCard.js';
import { FilterChips } from '../components/ui/FilterChips.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { RevenueAreaChart } from '../components/charts/RevenueAreaChart.js';
import { DonutChart, DonutLegend, DonutSlice } from '../components/charts/DonutChart.js';
import { DONUT_PALETTE } from '../components/charts/chartTheme.js';

export const DashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
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

      const [dashRes, invRes, projRes, expRes] = await Promise.all([
        api.getDashboardReports(start, end),
        api.getInvoices(),
        api.getProjects(),
        api.getExpenses(),
      ]);

      setData(dashRes);
      setInvoices(invRes || []);
      setProjects(projRes || []);
      setExpenses(expRes || []);
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
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 font-medium">Loading real-time financial metrics...</span>
        </div>
      </div>
    );
  }

  const {
    financials = {},
    counts = {},
    monthlyStats = [],
    categoryBreakdown = [],
  } = data || {};

  // Pending / unpaid invoices requiring follow-up
  const pendingInvoices = invoices
    .filter((inv) => inv.status !== 'Paid' && inv.status !== 'Cancelled')
    .slice(0, 5);

  // Upcoming / active shoots
  const upcomingShoots = projects
    .filter((p) => p.status !== 'Completed' && p.status !== 'Cancelled')
    .sort((a, b) => new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime())
    .slice(0, 5);

  // Expense breakdown donut slices
  const rawCatSlices = (categoryBreakdown || []).map((c: any, i: number) => ({
    name: c.category,
    value: Number(c.total) || 0,
    color: DONUT_PALETTE[i % DONUT_PALETTE.length],
  }));
  const topCats = rawCatSlices.slice(0, 4);
  let otherCatValue = 0;
  rawCatSlices.slice(4).forEach((s: any) => { otherCatValue += s.value; });
  const expenseSlices: DonutSlice[] =
    otherCatValue > 0
      ? [...topCats, { name: 'Other', value: otherCatValue, color: '#94a3b8' }]
      : topCats;
  const totalSpend = expenseSlices.reduce((t, s) => t + s.value, 0);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Overview
            </span>
            <span className="text-xs text-slate-500">AeroShots FPV Business</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial & Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live business status, upcoming shoots, and pending client receivables.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => onNavigate('projects')}
            icon={Plus}
            variant="primary"
            size="md"
          >
            New Shoot
          </Button>
          <Button
            onClick={() => onNavigate('travel')}
            icon={MapPin}
            variant="secondary"
            size="md"
          >
            Log Travel & Fuel
          </Button>
          <Button
            onClick={() => onNavigate('invoices')}
            icon={Receipt}
            variant="secondary"
            size="md"
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* 4 Big High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Money Collected"
          value={formatCurrency(financials.totalReceived || 0)}
          subtitle="Cash received from clients"
          color="emerald"
          icon={CreditCard}
          badge={`${counts.active_clients || 0} Clients`}
        />
        <StatCard
          label="Pending Due (Receivables)"
          value={formatCurrency(financials.pendingReceivables || 0)}
          subtitle={`${counts.unpaid_invoices || 0} unpaid invoices`}
          color="amber"
          icon={AlertCircle}
          badge="Awaiting Payment"
        />
        <StatCard
          label="Net Business Profit"
          value={formatCurrency(financials.netProfit || 0)}
          subtitle={`Total revenue: ${formatCurrency(financials.totalRevenue || 0)}`}
          color="indigo"
          icon={TrendingUp}
          badge="After Costs"
        />
        <StatCard
          label="Active Shoots"
          value={counts.ongoing_projects || 0}
          subtitle={`${counts.total_projects || 0} total all-time bookings`}
          color="sky"
          icon={Film}
          badge="In Pipeline"
        />
      </div>

      {/* Two Column Action Section: Pending Invoices & Upcoming Shoots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Invoices / Who Owes Money */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Pending Client Payments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Invoices with outstanding balances</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingInvoices.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-800">All invoices are settled!</p>
              <p className="text-xs text-slate-500 mt-1">No outstanding balances currently due.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 -mx-5 px-5 flex-1">
              {pendingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {inv.client_name || 'Client'}
                      </span>
                      <Badge variant={inv.status === 'Partially Paid' ? 'warning' : 'danger'}>
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{inv.invoice_number}</span>
                      <span>•</span>
                      <span>Due: {inv.due_date ? formatDate(inv.due_date) : 'On Receipt'}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(inv.balance_due || inv.total_amount)}
                    </div>
                    <button
                      onClick={() => onNavigate('payments')}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline mt-0.5 cursor-pointer block ml-auto"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Shoots & Schedule */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-600" />
                Upcoming Shoots & Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Confirmed and ongoing bookings</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingShoots.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
              <Calendar className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-800">No active shoots scheduled</p>
              <p className="text-xs text-slate-500 mt-1">Click "New Shoot" to schedule a booking.</p>
              <Button
                onClick={() => onNavigate('projects')}
                size="sm"
                variant="secondary"
                className="mt-4"
              >
                + Schedule Booking
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 -mx-5 px-5 flex-1">
              {upcomingShoots.map((proj) => (
                <div
                  key={proj.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {proj.name}
                      </span>
                      <Badge variant={proj.status === 'In Progress' ? 'info' : 'success'}>
                        {proj.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{proj.client_name || 'Client'}</span>
                      <span>•</span>
                      <span>{proj.location || proj.city || 'Location'}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{formatDate(proj.shoot_date)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(proj.agreed_amount || proj.quoted_amount || 0)}
                    </div>
                    <span className="text-[11px] text-slate-500">Agreed Value</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics: Monthly Trend & Expense Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expense Line Chart */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Revenue vs. Expense Trajectory</h2>
              <p className="text-xs text-slate-500">Monthly billing vs cash expenses with profit curve</p>
            </div>
            <FilterChips
              options={[
                { id: 'all', label: 'All Time' },
                { id: 'year', label: 'This Year' },
                { id: 'month', label: 'This Month' },
              ]}
              value={timeFilter}
              onChange={setTimeFilter}
            />
          </div>
          <RevenueAreaChart data={monthlyStats} />
        </div>

        {/* Expense Category Donut */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Cost Breakdown</h2>
              <p className="text-xs text-slate-500">Where money is spent</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {formatCurrency(financials.totalExpenses || 0)}
            </span>
          </div>

          <DonutChart
            data={expenseSlices}
            centerValue={formatCurrency(totalSpend)}
            centerLabel="Expenses"
          />
          <DonutLegend slices={expenseSlices} total={totalSpend} />

          <div className="pt-4 mt-auto border-t border-slate-100">
            <button
              onClick={() => onNavigate('travel')}
              className="w-full text-xs text-center text-indigo-600 hover:text-indigo-800 font-semibold py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Open Travel & Fuel Log →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
