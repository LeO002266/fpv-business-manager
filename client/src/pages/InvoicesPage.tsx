import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  CreditCard,
  Ban,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Invoice, Client, Project } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';
import { generateInvoicePDF } from '../services/pdfGenerator.js';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [unbilledExpenses, setUnbilledExpenses] = useState<any[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'UPI',
    reference_number: '',
    notes: ''
  });

  // Invoice creation form state
  const [formData, setFormData] = useState<any>({
    client_id: '',
    project_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    service_description: 'Cinematic FPV Aerial Videography Shoot Package',
    service_amount: 50000,
    currency: 'INR',
    exchange_rate: 1.0,
    tax_percent: 18.0,
    discount_amount: 0,
    notes: 'Thank you for choosing AeroShots FPV! Balance payment due on final video delivery.',
    payment_terms: 'UPI: aeroshots@upi | Bank Transfer: HDFC Bank A/C: 50200012345678'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, clRes, projRes] = await Promise.all([
        api.getInvoices(),
        api.getClients(),
        api.getProjects()
      ]);
      setInvoices(invRes);
      setClients(clRes);
      setProjects(projRes);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  // When client is selected in invoice modal, fetch their unbilled travel expenses
  const handleClientChange = async (clientId: string) => {
    setFormData({ ...formData, client_id: clientId });
    if (!clientId) {
      setUnbilledExpenses([]);
      setSelectedExpenseIds([]);
      return;
    }
    try {
      const expenses = await api.getUnbilledExpenses(clientId, formData.project_id || undefined);
      setUnbilledExpenses(expenses);
      // Auto select by default
      setSelectedExpenseIds(expenses.map((e: any) => e.id));
    } catch (err) {
      console.error('Failed to fetch unbilled expenses', err);
    }
  };

  const handleDownloadPDF = async (invId: string) => {
    try {
      const detail = await api.getInvoiceDetail(invId);
      generateInvoicePDF(detail);
    } catch (err) {
      alert('Failed to generate PDF');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    try {
      const payload = {
        ...formData,
        items: [
          {
            description: formData.service_description,
            quantity: 1,
            unit_price: Number(formData.service_amount),
            item_type: 'Service'
          }
        ],
        expense_ids_to_attach: selectedExpenseIds
      };

      await api.createInvoice(payload);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create invoice');
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentData({
      amount: inv.balance_due,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'UPI',
      reference_number: '',
      notes: `Payment for invoice ${inv.invoice_number}`
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.createPayment({
        client_id: selectedInvoice.client_id,
        invoice_id: selectedInvoice.id,
        amount: Number(paymentData.amount),
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        currency: selectedInvoice.currency,
        exchange_rate: selectedInvoice.exchange_rate,
        notes: paymentData.notes
      });
      setShowPaymentModal(false);
      loadData();
    } catch (err) {
      alert('Failed to record payment');
    }
  };

  const handleCancelInvoice = async (invId: string) => {
    if (!confirm('Cancel this invoice? Attached billable travel expenses will be unlocked back to unbilled status.')) return;
    try {
      await api.cancelInvoice(invId);
      loadData();
    } catch (err) {
      alert('Failed to cancel invoice');
    }
  };

  const totalBilled = invoices.filter(i => i.status !== 'Cancelled').reduce((t, i) => t + (Number(i.total_amount) * Number(i.exchange_rate)), 0);
  const totalPaid = invoices.filter(i => i.status !== 'Cancelled').reduce((t, i) => t + (Number(i.amount_paid) * Number(i.exchange_rate)), 0);
  const totalPending = invoices.filter(i => i.status !== 'Cancelled').reduce((t, i) => t + (Number(i.balance_due) * Number(i.exchange_rate)), 0);

  const filteredInvoices = invoices.filter(i =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Client Invoices & Billing Management</h2>
          <p className="text-xs text-slate-400">Itemized shoot billing, automatic travel reimbursement integration, and vector PDF exports</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56 sm:w-64"
            />
          </div>
          <button
            onClick={() => {
              setFormData({
                ...formData,
                invoice_number: `FPV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Invoiced Value"
          value={formatCurrency(totalBilled)}
          subtitle="All issued active invoices"
          color="sky"
          icon={Receipt}
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(totalPaid)}
          subtitle="Recorded payment receipts"
          color="emerald"
          icon={CreditCard}
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(totalPending)}
          subtitle="Pending client receivables"
          color="amber"
          icon={AlertCircle}
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client & Project</th>
                <th className="py-3 px-4">Issue / Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">{inv.invoice_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{inv.client_name}</div>
                    <div className="text-[11px] text-slate-400">{inv.project_name || 'General Videography'}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    <div>{formatDate(inv.issue_date)}</div>
                    {inv.due_date && <div className="text-[10px] text-slate-500">Due: {formatDate(inv.due_date)}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium">
                    {formatCurrency(inv.amount_paid, inv.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                    {formatCurrency(inv.balance_due, inv.currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : inv.status === 'Partially Paid'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : inv.status === 'Cancelled'
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadPDF(inv.id)}
                        title="Download Vector PDF Invoice"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          title="Record Payment Receipt"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow transition-all flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}

                      {inv.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id)}
                          title="Cancel Invoice"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create New Client Invoice"
          maxWidth="3xl"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Client *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={e => handleClientChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.preferred_currency})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Link Project / Shoot</label>
                <select
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- None / General Shoot --</option>
                  {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Issue Date *</label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Currency</label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="AED">AED</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Shoot Service Line Item */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wide">Primary Service Line Item</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Service Description</label>
                  <input
                    type="text"
                    value={formData.service_description}
                    onChange={e => setFormData({ ...formData, service_description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Shoot Fee ({formData.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.service_amount}
                    onChange={e => setFormData({ ...formData, service_amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Automatic Client-Billable Travel Expenses Auto-Inclusion */}
            {unbilledExpenses.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wide">
                      Eligible Billable Travel Expenses Found ({unbilledExpenses.length})
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400">Select expenses to bill on this invoice</span>
                </div>

                <div className="space-y-2">
                  {unbilledExpenses.map((exp: any) => {
                    const isChecked = selectedExpenseIds.includes(exp.id);
                    return (
                      <label
                        key={exp.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-slate-900 border-emerald-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedExpenseIds(selectedExpenseIds.filter(id => id !== exp.id));
                              } else {
                                setSelectedExpenseIds([...selectedExpenseIds, exp.id]);
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-xs text-white">{exp.category} Reimbursement</div>
                            <div className="text-[11px] text-slate-400">
                              {exp.from_location} → {exp.to_location} ({exp.distance_km} km) · {formatDate(exp.expense_date)}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-400">
                          {formatCurrency(exp.amount, exp.currency)}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Taxes & Discounts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">GST / Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_percent}
                  onChange={e => setFormData({ ...formData, tax_percent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Discount Amount ({formData.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={e => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                Issue Invoice
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Record Payment for ${selectedInvoice.invoice_number}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Invoice:</span>
                <span className="font-mono text-white">{formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(selectedInvoice.amount_paid, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                <span className="text-slate-200">Balance Outstanding:</span>
                <span className="font-mono text-amber-400">{formatCurrency(selectedInvoice.balance_due, selectedInvoice.currency)}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Amount Received ({selectedInvoice.currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={selectedInvoice.balance_due}
                value={paymentData.amount}
                onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentData.payment_date}
                  onChange={e => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Method</label>
                <select
                  value={paymentData.payment_method}
                  onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (Google Pay/PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Transaction / UTR Reference #</label>
              <input
                type="text"
                placeholder="e.g. UPI/RAI/263301981"
                value={paymentData.reference_number}
                onChange={e => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
