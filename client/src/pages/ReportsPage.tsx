import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Film,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { StatCard } from '../components/StatCard.js';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'pnl' | 'client' | 'project' | 'travel'>('pnl');
  const [pnlData, setPnlData] = useState<any>(null);
  const [clientData, setClientData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any[]>([]);
  const [travelData, setTravelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [reportType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      if (reportType === 'pnl') {
        const res = await api.getProfitLoss();
        setPnlData(res);
      } else if (reportType === 'client') {
        const res = await api.getClientProfitability();
        setClientData(res);
      } else if (reportType === 'project') {
        const res = await api.getProjectProfitability();
        setProjectData(res);
      } else if (reportType === 'travel') {
        const res = await api.getTravelExpensesReport();
        setTravelData(res);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrent = () => {
    if (reportType === 'client') {
      const headers = ['Client Name', 'Company', 'Currency', 'Total Billed', 'Total Received', 'Pending', 'Net Profit', 'Profit Margin %'];
      const rows = clientData.map(c => [
        c.name, c.company || '', c.currency, c.totalBilled, c.totalReceived, c.pendingReceivables, c.netProfit, `${c.profitMarginPercent}%`
      ]);
      exportCSV('fpv-client-profitability', headers, rows);
    } else if (reportType === 'project') {
      const headers = ['Project Name', 'Client', 'Category', 'Shoot Date', 'Agreed Fee', 'Invoiced', 'Received', 'Net Profit', 'Margin %'];
      const rows = projectData.map(p => [
        p.name, p.client_name, p.category, p.shoot_date, p.agreedAmount, p.invoicedAmount, p.receivedAmount, p.netProfit, `${p.profitMarginPercent}%`
      ]);
      exportCSV('fpv-project-profitability', headers, rows);
    } else if (reportType === 'pnl' && pnlData) {
      const headers = ['Line Item', 'Amount (INR)'];
      const rows = [
        ['Total Invoiced Revenue', pnlData.revenue?.totalInvoiced || 0],
        ['Service Revenue', pnlData.revenue?.serviceRevenue || 0],
        ['Tax Collected', pnlData.revenue?.taxCollected || 0],
        ['Reimbursed Client-Billable Travel', pnlData.billableExpenses || 0],
        ['Internal Business Overhead Expenses', pnlData.nonBillableOverhead || 0],
        ['Crew & Pilot Payouts', pnlData.teamPayouts || 0],
        ['Net Accounting Profit', pnlData.netProfit || 0]
      ];
      exportCSV('fpv-profit-and-loss-statement', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Financial & Operational Analytics Reports</h2>
          <p className="text-xs text-slate-400">Profit & loss statements, client-wise profit rankings, project profitability, and travel auditing</p>
        </div>

        <button
          onClick={handleExportCurrent}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        {[
          { id: 'pnl', label: '1. Profit & Loss Statement' },
          { id: 'client', label: '2. Client Profitability Ranking' },
          { id: 'project', label: '3. Project-wise Margins' },
          { id: 'travel', label: '4. Fuel & Route Logistics' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-3 py-2 rounded-xl font-medium transition-all ${
              reportType === tab.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT 1: P&L STATEMENT */}
      {reportType === 'pnl' && pnlData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Gross Invoiced"
              value={formatCurrency(pnlData.revenue?.totalInvoiced || 0)}
              color="sky"
            />
            <StatCard
              label="Total Costs & Overhead"
              value={formatCurrency(pnlData.totalCosts || 0)}
              subtitle="Overhead + crew payouts"
              color="rose"
            />
            <StatCard
              label="Net Operating Profit"
              value={formatCurrency(pnlData.netProfit || 0)}
              color="emerald"
            />
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Detailed Financial Statement</h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-800/80">
                <tr className="py-2.5">
                  <td className="py-2.5 font-bold text-white">Gross Invoiced Revenue (Services + Travel)</td>
                  <td className="py-2.5 text-right font-mono font-bold text-sky-400">{formatCurrency(pnlData.revenue?.totalInvoiced || 0)}</td>
                </tr>
                <tr className="py-2.5 text-slate-400">
                  <td className="py-2.5 pl-4">Pass-Through Reimbursed Travel Charges</td>
                  <td className="py-2.5 text-right font-mono text-emerald-400">+{formatCurrency(pnlData.billableExpenses || 0)}</td>
                </tr>
                <tr className="py-2.5 text-slate-400">
                  <td className="py-2.5 pl-4">Applicable Taxes (GST) Collected</td>
                  <td className="py-2.5 text-right font-mono text-slate-300">{formatCurrency(pnlData.revenue?.taxCollected || 0)}</td>
                </tr>
                <tr className="py-2.5 border-t border-slate-700">
                  <td className="py-2.5 font-bold text-rose-400">Less: Non-Billable Overhead Expenses</td>
                  <td className="py-2.5 text-right font-mono font-bold text-rose-400">-{formatCurrency(pnlData.nonBillableOverhead || 0)}</td>
                </tr>
                <tr className="py-2.5 border-t border-slate-700">
                  <td className="py-2.5 font-bold text-rose-400">Less: Pilot & Crew Project Payouts</td>
                  <td className="py-2.5 text-right font-mono font-bold text-rose-400">-{formatCurrency(pnlData.teamPayouts || 0)}</td>
                </tr>
                <tr className="py-3 bg-slate-950/60 font-bold border-t-2 border-emerald-500/40">
                  <td className="py-3 px-3 text-white text-sm">NET BUSINESS PROFIT</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 text-base">{formatCurrency(pnlData.netProfit || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: CLIENT PROFITABILITY */}
      {reportType === 'client' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-right">Cash Received</th>
                  <th className="py-3 px-4 text-right">Pending Receivables</th>
                  <th className="py-3 px-4 text-right">Direct Costs</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-center">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {clientData.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{c.company}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">{formatCurrency(c.totalBilled, c.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatCurrency(c.totalReceived, c.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{formatCurrency(c.pendingReceivables, c.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">{formatCurrency(c.totalCost, c.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(c.netProfit, c.currency)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {c.profitMarginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: PROJECT PROFITABILITY */}
      {reportType === 'project' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Shoot Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Agreed Fee</th>
                  <th className="py-3 px-4 text-right">Invoiced</th>
                  <th className="py-3 px-4 text-right">Crew & Direct Cost</th>
                  <th className="py-3 px-4 text-right">Net Shoot Profit</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projectData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{formatDate(p.shoot_date)}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{p.client_name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.category}</td>
                    <td className="py-3 px-4 text-right font-mono text-white">{formatCurrency(p.agreedAmount, p.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sky-400">{formatCurrency(p.invoicedAmount, p.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">{formatCurrency(p.totalCost, p.currency)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(p.netProfit, p.currency)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {p.profitMarginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: TRAVEL & FUEL LOGISTICS */}
      {reportType === 'travel' && travelData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Fuel Outlay"
              value={formatCurrency(travelData.summary?.fuel_cost || 0)}
              color="amber"
            />
            <StatCard
              label="Total Km Logged"
              value={`${travelData.summary?.total_distance_km || 0} km`}
              color="sky"
            />
            <StatCard
              label="Client Reimbursed"
              value={formatCurrency(travelData.summary?.billable_travel || 0)}
              color="emerald"
            />
            <StatCard
              label="Business Absorbed"
              value={formatCurrency(travelData.summary?.business_travel || 0)}
              color="rose"
            />
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Vehicle-wise Mileage & Fuel Expenditure</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Vehicle</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">License Plate</th>
                  <th className="pb-2 text-right">Trips</th>
                  <th className="pb-2 text-right">Total Distance</th>
                  <th className="pb-2 text-right">Fuel Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {travelData.byVehicle?.map((veh: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-white">{veh.name}</td>
                    <td className="py-2.5 text-slate-300">{veh.type}</td>
                    <td className="py-2.5 font-mono text-slate-400">{veh.license_plate}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{veh.trips}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{veh.total_distance} km</td>
                    <td className="py-2.5 text-right font-mono font-bold text-amber-400">{formatCurrency(veh.total_fuel_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
