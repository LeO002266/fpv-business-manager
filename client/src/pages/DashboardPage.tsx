import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Receipt,
  MapPin,
  Users,
  Film,
  Calendar,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { StatCard } from '../components/StatCard.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

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

  const { financials = {}, counts = {}, monthlyStats = [], categoryBreakdown = [], topClients = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Executive Overview
            </span>
            <span className="text-xs text-slate-400">Rajnagar Base & Global Operations</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1">Financial & Shoot Operations Hub</h2>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeFilter === f.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
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
        {/* Monthly Revenue vs Expense Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Revenue vs. Expense Trajectory</h3>
              <p className="text-xs text-slate-400">Monthly billing vs actual cash outlays</p>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
              Live Trend
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => formatCurrency(val)}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Invoiced Revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Total Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Expense Category Allocation</h3>
                <p className="text-xs text-slate-400">Top operational costs</p>
              </div>
              <PieChartIcon className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 mt-2">
              {categoryBreakdown.slice(0, 5).map((cat: any, i: number) => {
                const totalExp = financials.totalExpenses || 1;
                const pct = Math.round((cat.total / totalExp) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat.category}</span>
                      <span className="text-slate-400 font-mono">{formatCurrency(cat.total)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={() => onNavigate('travel')}
              className="w-full text-xs text-center text-emerald-400 hover:text-emerald-300 font-medium py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
            >
              View Route & Mileage Details →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity: Invoices & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Invoices</h3>
              <p className="text-xs text-slate-400">Latest billings & payment status</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              All Invoices ({invoices.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Invoice</th>
                  <th className="pb-2.5">Client</th>
                  <th className="pb-2.5 text-right">Total</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-mono font-medium text-slate-200">{inv.invoice_number}</td>
                    <td className="py-2.5 text-slate-300 font-medium">{inv.client_name}</td>
                    <td className="py-2.5 text-right font-mono text-slate-200">{formatCurrency(inv.total_amount, inv.currency)}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Travel & Expenses */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Travel & Project Expenses</h3>
              <p className="text-xs text-slate-400">Routes, fuel, toll, and operational outlays</p>
            </div>
            <button
              onClick={() => onNavigate('travel')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              All Expenses ({expenses.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Route / Details</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-center">Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.slice(0, 5).map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">{formatDate(exp.expense_date)}</td>
                    <td className="py-2.5 text-slate-200 font-medium">{exp.category}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[150px]">
                      {exp.from_location ? `${exp.from_location} → ${exp.to_location}` : exp.description || '—'}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-200">{formatCurrency(exp.amount, exp.currency)}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exp.billing_treatment === 'Client_Billable'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {exp.billing_treatment === 'Client_Billable' ? 'Billable' : 'Overhead'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
