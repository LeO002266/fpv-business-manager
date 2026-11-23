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
import {
  Button,
  Field,
  Input,
  Select,
  SearchInput,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  PageHeader,
  EmptyState
} from '../components/ui/index.js';

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
      <PageHeader
        title="Payments & Collections Ledger"
        subtitle="Recorded client collections, multi-invoice allocations, and UPI/Bank reconciliation"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search receipt #, client, UTR..."
              className="w-56 sm:w-64"
            />
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Record Payment
            </Button>
          </>
        }
      />

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
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments found"
          description="No payment receipts match your search. Try a different receipt number, client, or UTR reference."
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <Th className="px-4">Receipt #</Th>
                  <Th className="px-4">Payment Date</Th>
                  <Th className="px-4">Client</Th>
                  <Th className="px-4">Allocated Invoice</Th>
                  <Th className="px-4">Method & UTR</Th>
                  <Th className="px-4 text-right">Amount Received</Th>
                </tr>
              </THead>
              <TBody>
                {filteredPayments.map(p => (
                  <Tr key={p.id}>
                    <Td className="px-4 font-mono font-bold text-white">{p.payment_number}</Td>
                    <Td className="px-4 text-slate-400 font-mono text-[11px]">{formatDate(p.payment_date)}</Td>
                    <Td className="px-4 font-bold text-slate-200">{p.client_name}</Td>
                    <Td className="px-4 font-mono text-slate-300">{p.invoice_number || 'Advance Token'}</Td>
                    <Td className="px-4">
                      <span className="font-semibold text-emerald-400">{p.payment_method}</span>
                      {p.reference_number && (
                        <div className="text-[10px] text-slate-400 font-mono">{p.reference_number}</div>
                      )}
                    </Td>
                    <Td className="px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      +{formatCurrency(p.amount, p.currency)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record Client Payment Receipt"
          maxWidth="md"
        >
          <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
            <Field label="Select Client *">
              <Select
                required
                value={formData.client_id}
                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.preferred_currency})</option>
                ))}
              </Select>
            </Field>

            <Field label="Allocate to Invoice (Optional)">
              <Select
                value={formData.invoice_id}
                onChange={e => {
                  const inv = invoices.find(i => i.id === e.target.value);
                  setFormData({
                    ...formData,
                    invoice_id: e.target.value,
                    amount: inv ? inv.balance_due : formData.amount
                  });
                }}
              >
                <option value="">-- Advance / Unallocated --</option>
                {invoices.filter(i => !formData.client_id || i.client_id === formData.client_id).map(i => (
                  <option key={i.id} value={i.id}>
                    {i.invoice_number} (Bal: {formatCurrency(i.balance_due, i.currency)})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Amount Received (₹) *">
              <Input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="font-mono text-base font-bold"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Date *">
                <Input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </Field>

              <Field label="Payment Mode">
                <Select
                  value={formData.payment_method}
                  onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
            </div>

            <Field label="Transaction / UTR Reference #">
              <Input
                type="text"
                placeholder="e.g. UPI/2026/998124"
                value={formData.reference_number}
                onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
