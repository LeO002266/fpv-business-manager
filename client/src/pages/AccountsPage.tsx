import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  CreditCard,
  AlertCircle,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { StatCard } from '../components/StatCard.js';
import {
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  PageHeader,
  EmptyState
} from '../components/ui/index.js';

export const AccountsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const [dashRes, invRes, payRes] = await Promise.all([
        api.getDashboardReports(),
        api.getInvoices(),
        api.getPayments()
      ]);
      setData(dashRes);
      setInvoices(invRes);
      setPayments(payRes);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const { financials = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Accounts & Cash Flow Management"
        subtitle="Reconciled dual-entry tracking: Invoiced Billings vs Actual Bank & Cash Receipts"
      />

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Billed Revenue"
          value={formatCurrency(financials.totalRevenue || 0)}
          subtitle="Issued tax invoices"
          color="sky"
          icon={Receipt}
        />
        <StatCard
          label="Total Cash Inflow"
          value={formatCurrency(financials.totalReceived || 0)}
          subtitle="Realized money in bank/UPI"
          color="emerald"
          icon={CreditCard}
        />
        <StatCard
          label="Pending Receivables"
          value={formatCurrency(financials.pendingReceivables || 0)}
          subtitle="Outstanding client dues"
          color="amber"
          icon={AlertCircle}
        />
        <StatCard
          label="Cash Flow Margin"
          value={formatCurrency(financials.cashMargin || 0)}
          subtitle="Cash received minus total expenses"
          color={financials.cashMargin >= 0 ? 'emerald' : 'rose'}
          icon={Wallet}
        />
      </div>

      {/* Reconciled Principles Notice */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs p-5 space-y-3 text-xs text-slate-700">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Accounting Principles & Financial Integrity</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">Invoiced Revenue ≠ Cash Received</span>
            <p className="text-slate-400">
              Generating an invoice creates accounts receivable. Revenue is earned on completion of deliverables, but profit realized only occurs when payment is physically credited.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">Pass-Through Reimbursed Travel</span>
            <p className="text-slate-400">
              Client-billable travel costs added to client invoices are reimbursements, not business losses. When the client settles their invoice, that expenditure is fully recovered.
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding Receivables Aging Table */}
      {invoices.filter(i => i.balance_due > 0 && i.status !== 'Cancelled').length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No outstanding receivables"
          description="Every issued invoice has been fully collected. Nothing is awaiting payment settlement."
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Outstanding Invoice Receivables</h3>
              <p className="text-xs text-slate-400">Active invoices awaiting payment settlement</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Total Due: {formatCurrency(financials.pendingReceivables || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <Th>Invoice #</Th>
                  <Th>Client</Th>
                  <Th>Issue Date</Th>
                  <Th>Due Date</Th>
                  <Th className="text-right">Invoice Total</Th>
                  <Th className="text-right">Paid So Far</Th>
                  <Th className="text-right">Balance Due</Th>
                </tr>
              </THead>
              <TBody>
                {invoices.filter(i => i.balance_due > 0 && i.status !== 'Cancelled').map(inv => (
                  <Tr key={inv.id}>
                    <Td className="font-mono font-bold text-slate-900">{inv.invoice_number}</Td>
                    <Td className="text-slate-800 font-medium">{inv.client_name}</Td>
                    <Td className="text-slate-400 font-mono text-[11px]">{formatDate(inv.issue_date)}</Td>
                    <Td className="text-slate-400 font-mono text-[11px]">{formatDate(inv.due_date)}</Td>
                    <Td className="text-right font-mono text-slate-800">{formatCurrency(inv.total_amount, inv.currency)}</Td>
                    <Td className="text-right font-mono text-emerald-400">{formatCurrency(inv.amount_paid, inv.currency)}</Td>
                    <Td className="text-right font-mono font-bold text-amber-400">{formatCurrency(inv.balance_due, inv.currency)}</Td>
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
