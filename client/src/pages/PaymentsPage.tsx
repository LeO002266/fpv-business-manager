import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  DollarSign,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { Payment, Client, Invoice } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<any>({
    client_id: '',
    invoice_id: '',
    amount: 10000,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'UPI',
    reference_number: '',
    currency: 'INR',
    exchange_rate: 1.0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, clRes, invRes] = await Promise.all([
        api.getPayments(),
        api.getClients(),
        api.getInvoices()
      ]);
      setPayments(payRes);
      setClients(clRes);
      setInvoices(invRes);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || Number(formData.amount) <= 0) {
      alert('Please select a client and valid amount');
      return;
    }
    try {
      await api.createPayment(formData);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to record payment');
    }
  };

  const totalCollected = payments.reduce((t, p) => t + Number(p.base_amount), 0);
  const upiCollected = payments.filter(p => p.payment_method === 'UPI').reduce((t, p) => t + Number(p.base_amount), 0);
  const bankCollected = payments.filter(p => p.payment_method === 'Bank Transfer').reduce((t, p) => t + Number(p.base_amount), 0);
  const cashCollected = payments.filter(p => p.payment_method === 'Cash').reduce((t, p) => t + Number(p.base_amount), 0);

  const filteredPayments = payments.filter(p =>
    p.payment_number.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payments & Collections Ledger</h2>
          <p className="text-xs text-slate-400">Recorded client collections, multi-invoice allocations, and UPI/Bank reconciliation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search receipt #, client, UTR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56 sm:w-64"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Cash Inflow"
          value={formatCurrency(totalCollected)}
          subtitle="All confirmed payments"
          color="emerald"
          icon={CreditCard}
        />
        <StatCard
          label="UPI Collections"
          value={formatCurrency(upiCollected)}
          subtitle="Google Pay / PhonePe"
          color="sky"
        />
        <StatCard
          label="Bank Transfers"
          value={formatCurrency(bankCollected)}
          subtitle="NEFT / RTGS / IMPS"
          color="slate"
        />
        <StatCard
          label="Cash Receipts"
          value={formatCurrency(cashCollected)}
          subtitle="Physical cash in hand"
          color="amber"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Allocated Invoice</th>
                <th className="py-3 px-4">Method & UTR</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{p.payment_number}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{formatDate(p.payment_date)}</td>
                  <td className="py-3 px-4 font-bold text-slate-200">{p.client_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{p.invoice_number || 'Advance Token'}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-emerald-400">{p.payment_method}</span>
                    {p.reference_number && (
                      <div className="text-[10px] text-slate-400 font-mono">{p.reference_number}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    +{formatCurrency(p.amount, p.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record Client Payment Receipt"
          maxWidth="md"
        >
          <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Select Client *</label>
              <select
                required
                value={formData.client_id}
                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.preferred_currency})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Allocate to Invoice (Optional)</label>
              <select
                value={formData.invoice_id}
                onChange={e => {
                  const inv = invoices.find(i => i.id === e.target.value);
                  setFormData({
                    ...formData,
                    invoice_id: e.target.value,
                    amount: inv ? inv.balance_due : formData.amount
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Advance / Unallocated --</option>
                {invoices.filter(i => !formData.client_id || i.client_id === formData.client_id).map(i => (
                  <option key={i.id} value={i.id}>
                    {i.invoice_number} (Bal: {formatCurrency(i.balance_due, i.currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Amount Received (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
                <select
                  value={formData.payment_method}
                  onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Transaction / UTR Reference #</label>
              <input
                type="text"
                placeholder="e.g. UPI/2026/998124"
                value={formData.reference_number}
                onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
              >
                Save Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
