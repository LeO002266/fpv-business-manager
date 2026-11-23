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
import {
  Button,
  PageHeader,
  FilterChips,
  Badge,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td
} from '../components/ui/index.js';

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
      <PageHeader
        title="Financial & Operational Analytics Reports"
        subtitle="Profit & loss statements, client-wise profit rankings, project profitability, and travel auditing"
        actions={
          <Button onClick={handleExportCurrent} icon={Download}>
            Export CSV Report
          </Button>
        }
      />

      {/* Report Switcher Tabs */}
      <FilterChips
        options={[
          { id: 'pnl', label: '1. Profit & Loss Statement' },
          { id: 'client', label: '2. Client Profitability Ranking' },
          { id: 'project', label: '3. Project-wise Margins' },
          { id: 'travel', label: '4. Fuel & Route Logistics' }
        ]}
        value={reportType}
        onChange={(id) => setReportType(id as any)}
      />

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

          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Detailed Financial Statement</h3>
            <Table>
              <TBody>
                <Tr>
                  <Td className="font-bold text-white">Gross Invoiced Revenue (Services + Travel)</Td>
                  <Td className="text-right font-mono font-bold text-sky-400">{formatCurrency(pnlData.revenue?.totalInvoiced || 0)}</Td>
                </Tr>
                <Tr className="text-slate-400">
                  <Td className="pl-4">Pass-Through Reimbursed Travel Charges</Td>
                  <Td className="text-right font-mono text-emerald-400">+{formatCurrency(pnlData.billableExpenses || 0)}</Td>
                </Tr>
                <Tr className="text-slate-400">
                  <Td className="pl-4">Applicable Taxes (GST) Collected</Td>
                  <Td className="text-right font-mono text-slate-300">{formatCurrency(pnlData.revenue?.taxCollected || 0)}</Td>
                </Tr>
                <Tr>
                  <Td className="border-t border-white/[0.06] font-bold text-rose-400">Less: Non-Billable Overhead Expenses</Td>
                  <Td className="border-t border-white/[0.06] text-right font-mono font-bold text-rose-400">-{formatCurrency(pnlData.nonBillableOverhead || 0)}</Td>
                </Tr>
                <Tr>
                  <Td className="border-t border-white/[0.06] font-bold text-rose-400">Less: Pilot & Crew Project Payouts</Td>
                  <Td className="border-t border-white/[0.06] text-right font-mono font-bold text-rose-400">-{formatCurrency(pnlData.teamPayouts || 0)}</Td>
                </Tr>
                <Tr className="bg-white/[0.03] font-bold">
                  <Td className="px-3 bg-white/[0.03] border-t-2 border-emerald-500/40 text-white text-sm">NET BUSINESS PROFIT</Td>
                  <Td className="px-3 bg-white/[0.03] border-t-2 border-emerald-500/40 text-right font-mono text-emerald-400 text-base">{formatCurrency(pnlData.netProfit || 0)}</Td>
                </Tr>
              </TBody>
            </Table>
          </div>
        </div>
      )}

      {/* REPORT 2: CLIENT PROFITABILITY */}
      {reportType === 'client' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr className="bg-white/[0.03]">
                  <Th className="px-4 pt-3">Client Name</Th>
                  <Th className="px-4 pt-3 text-right">Total Billed</Th>
                  <Th className="px-4 pt-3 text-right">Cash Received</Th>
                  <Th className="px-4 pt-3 text-right">Pending Receivables</Th>
                  <Th className="px-4 pt-3 text-right">Direct Costs</Th>
                  <Th className="px-4 pt-3 text-right">Net Profit</Th>
                  <Th className="px-4 pt-3 text-center">Profit Margin</Th>
                </tr>
              </THead>
              <TBody>
                {clientData.map(c => (
                  <Tr key={c.id}>
                    <Td className="px-4 font-bold text-white">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{c.company}</div>
                    </Td>
                    <Td className="px-4 text-right font-mono text-slate-200">{formatCurrency(c.totalBilled, c.currency)}</Td>
                    <Td className="px-4 text-right font-mono text-emerald-400">{formatCurrency(c.totalReceived, c.currency)}</Td>
                    <Td className="px-4 text-right font-mono text-amber-400">{formatCurrency(c.pendingReceivables, c.currency)}</Td>
                    <Td className="px-4 text-right font-mono text-rose-400">{formatCurrency(c.totalCost, c.currency)}</Td>
                    <Td className="px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(c.netProfit, c.currency)}</Td>
                    <Td className="px-4 text-center">
                      <Badge variant="success" className="font-mono">
                        {c.profitMarginPercent}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

      {/* REPORT 3: PROJECT PROFITABILITY */}
      {reportType === 'project' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr className="bg-white/[0.03]">
                  <Th className="px-4 pt-3">Shoot Name</Th>
                  <Th className="px-4 pt-3">Client</Th>
                  <Th className="px-4 pt-3">Category</Th>
                  <Th className="px-4 pt-3 text-right">Agreed Fee</Th>
                  <Th className="px-4 pt-3 text-right">Invoiced</Th>
                  <Th className="px-4 pt-3 text-right">Crew & Direct Cost</Th>
                  <Th className="px-4 pt-3 text-right">Net Shoot Profit</Th>
                  <Th className="px-4 pt-3 text-center">Margin %</Th>
                </tr>
              </THead>
              <TBody>
                {projectData.map(p => (
                  <Tr key={p.id}>
                    <Td className="px-4 font-bold text-white">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{formatDate(p.shoot_date)}</div>
                    </Td>
                    <Td className="px-4 text-slate-300">{p.client_name}</Td>
                    <Td className="px-4 text-slate-400">{p.category}</Td>
                    <Td className="px-4 text-right font-mono text-white">{formatCurrency(p.agreedAmount, p.currency)}</Td>
                    <Td className="px-4 text-right font-mono text-sky-400">{formatCurrency(p.invoicedAmount, p.currency)}</Td>
                    <Td className="px-4 text-right font-mono text-rose-400">{formatCurrency(p.totalCost, p.currency)}</Td>
                    <Td className="px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(p.netProfit, p.currency)}</Td>
                    <Td className="px-4 text-center">
                      <Badge variant="success" className="font-mono">
                        {p.profitMarginPercent}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
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

          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Vehicle-wise Mileage & Fuel Expenditure</h3>
            <Table>
              <THead>
                <tr>
                  <Th>Vehicle</Th>
                  <Th>Type</Th>
                  <Th>License Plate</Th>
                  <Th className="text-right">Trips</Th>
                  <Th className="text-right">Total Distance</Th>
                  <Th className="text-right">Fuel Cost</Th>
                </tr>
              </THead>
              <TBody>
                {travelData.byVehicle?.map((veh: any, i: number) => (
                  <Tr key={i}>
                    <Td className="font-bold text-white">{veh.name}</Td>
                    <Td className="text-slate-300">{veh.type}</Td>
                    <Td className="font-mono text-slate-400">{veh.license_plate}</Td>
                    <Td className="text-right font-mono text-slate-300">{veh.trips}</Td>
                    <Td className="text-right font-mono text-slate-300">{veh.total_distance} km</Td>
                    <Td className="text-right font-mono font-bold text-amber-400">{formatCurrency(veh.total_fuel_cost)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
