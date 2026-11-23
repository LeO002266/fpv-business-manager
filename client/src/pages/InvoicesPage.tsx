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
import {
  Button,
  Field,
  Input,
  Select,
  SearchInput,
  Badge,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  PageHeader,
  EmptyState
} from '../components/ui/index.js';

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
      <PageHeader
        title="Client Invoices & Billing Management"
        subtitle="Itemized shoot billing, automatic travel reimbursement integration, and vector PDF exports"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search invoice #, client..."
              className="w-56 sm:w-64"
            />
            <Button
              icon={Plus}
              onClick={() => {
                setFormData({
                  ...formData,
                  invoice_number: `FPV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`
                });
                setShowAddModal(true);
              }}
            >
              Create Invoice
            </Button>
          </>
        }
      />

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
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="No invoices match your search. Try a different invoice number, client, or project name."
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <Th className="px-4">Invoice #</Th>
                  <Th className="px-4">Client & Project</Th>
                  <Th className="px-4">Issue / Due Date</Th>
                  <Th className="px-4 text-right">Total</Th>
                  <Th className="px-4 text-right">Paid</Th>
                  <Th className="px-4 text-right">Balance Due</Th>
                  <Th className="px-4 text-center">Status</Th>
                  <Th className="px-4 text-right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {filteredInvoices.map(inv => (
                  <Tr key={inv.id}>
                    <Td className="px-4 font-mono font-bold text-slate-800">{inv.invoice_number}</Td>
                    <Td className="px-4">
                      <div className="font-bold text-slate-900">{inv.client_name}</div>
                      <div className="text-[11px] text-slate-400">{inv.project_name || 'General Videography'}</div>
                    </Td>
                    <Td className="px-4 text-slate-400 font-mono text-[11px]">
                      <div>{formatDate(inv.issue_date)}</div>
                      {inv.due_date && <div className="text-[10px] text-slate-500">Due: {formatDate(inv.due_date)}</div>}
                    </Td>
                    <Td className="px-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(inv.total_amount, inv.currency)}
                    </Td>
                    <Td className="px-4 text-right font-mono text-emerald-400 font-medium">
                      {formatCurrency(inv.amount_paid, inv.currency)}
                    </Td>
                    <Td className="px-4 text-right font-mono text-amber-400 font-bold">
                      {formatCurrency(inv.balance_due, inv.currency)}
                    </Td>
                    <Td className="px-4 text-center">
                      <Badge variant={
                        inv.status === 'Paid'
                          ? 'success'
                          : inv.status === 'Partially Paid'
                          ? 'warning'
                          : inv.status === 'Cancelled'
                          ? 'neutral'
                          : 'danger'
                      }>
                        {inv.status}
                      </Badge>
                    </Td>
                    <Td className="px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadPDF(inv.id)}
                          title="Download Vector PDF Invoice"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <Button
                            size="sm"
                            icon={CreditCard}
                            title="Record Payment Receipt"
                            onClick={() => openPaymentModal(inv)}
                          >
                            Pay
                          </Button>
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
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

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
              <Field label="Select Client *">
                <Select
                  required
                  value={formData.client_id}
                  onChange={e => handleClientChange(e.target.value)}
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.preferred_currency})</option>
                  ))}
                </Select>
              </Field>

              <Field label="Link Project / Shoot">
                <Select
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">-- None / General Shoot --</option>
                  {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Invoice Number *">
                <Input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="font-mono"
                />
              </Field>

              <Field label="Issue Date *">
                <Input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </Field>

              <Field label="Due Date">
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </Field>

              <Field label="Currency">
                <Select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="AED">AED</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </Select>
              </Field>
            </div>

            {/* Shoot Service Line Item */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">Primary Service Line Item</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Service Description" className="sm:col-span-2">
                  <Input
                    type="text"
                    value={formData.service_description}
                    onChange={e => setFormData({ ...formData, service_description: e.target.value })}
                  />
                </Field>
                <Field label={`Shoot Fee (${formData.currency})`}>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.service_amount}
                    onChange={e => setFormData({ ...formData, service_amount: Number(e.target.value) })}
                    className="font-mono"
                  />
                </Field>
              </div>
            </div>

            {/* Automatic Client-Billable Travel Expenses Auto-Inclusion */}
            {unbilledExpenses.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
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
                            ? 'bg-white/[0.05] border-emerald-500/40 text-white'
                            : 'bg-slate-50/50 border-slate-200 text-slate-400'
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
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-100 border-white/[0.15]"
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
              <Field label="GST / Tax Rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax_percent}
                  onChange={e => setFormData({ ...formData, tax_percent: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>

              <Field label={`Discount Amount (${formData.currency})`}>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={e => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Issue Invoice
              </Button>
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Invoice:</span>
                <span className="font-mono text-white">{formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(selectedInvoice.amount_paid, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                <span className="text-slate-800">Balance Outstanding:</span>
                <span className="font-mono text-amber-400">{formatCurrency(selectedInvoice.balance_due, selectedInvoice.currency)}</span>
              </div>
            </div>

            <Field label={`Amount Received (${selectedInvoice.currency}) *`}>
              <Input
                type="number"
                step="0.01"
                required
                max={selectedInvoice.balance_due}
                value={paymentData.amount}
                onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                className="font-mono text-base font-bold"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Date">
                <Input
                  type="date"
                  required
                  value={paymentData.payment_date}
                  onChange={e => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                />
              </Field>

              <Field label="Payment Method">
                <Select
                  value={paymentData.payment_method}
                  onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                >
                  <option value="UPI">UPI (Google Pay/PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
            </div>

            <Field label="Transaction / UTR Reference #">
              <Input
                type="text"
                placeholder="e.g. UPI/RAI/263301981"
                value={paymentData.reference_number}
                onChange={e => setPaymentData({ ...paymentData, reference_number: e.target.value })}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="ghost" type="button" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Confirm Payment Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
