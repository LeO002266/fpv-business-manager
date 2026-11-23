import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Quotation, Client } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';
import {
  Button,
  Field,
  Input,
  Select,
  SearchInput,
  Badge,
  PageHeader,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  EmptyState
} from '../components/ui/index.js';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Conversion options
  const [convertOptions, setConvertOptions] = useState({
    project_name: '',
    shoot_date: new Date().toISOString().slice(0, 10),
    createInvoice: true
  });

  // Quotation form state
  const [formData, setFormData] = useState<any>({
    client_id: '',
    issue_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: 'INR',
    exchange_rate: 1.0,
    tax_percent: 18.0,
    discount_amount: 0,
    terms: '50% advance upon confirmation. Balance payment on raw footage delivery.',
    notes: 'Quotation includes high-speed FPV chase shots, pilot fees, and drone equipment.',
    items: [
      { description: 'FPV Drone Shoot Package (4K 60fps stabilized capture)', quantity: 1, unit_price: 60000 }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qtRes, clRes] = await Promise.all([
        api.getQuotations(),
        api.getClients()
      ]);
      setQuotations(qtRes);
      setClients(clRes);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: 'Additional FPV Spotter / Travel Allowance', quantity: 1, unit_price: 5000 }]
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_: any, i: number) => i !== index)
    });
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }
    try {
      await api.createQuotation(formData);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create quotation');
    }
  };

  const openConvertModal = (q: Quotation) => {
    setSelectedQuotation(q);
    setConvertOptions({
      project_name: `${q.client_name} - FPV Shoot`,
      shoot_date: new Date().toISOString().slice(0, 10),
      createInvoice: true
    });
    setShowConvertModal(true);
  };

  const handleConvertQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;
    try {
      await api.convertQuotation(selectedQuotation.id, convertOptions);
      setShowConvertModal(false);
      alert('Quotation successfully converted to Confirmed Project & Invoice!');
      loadData();
    } catch (err) {
      alert('Failed to convert quotation');
    }
  };

  const filteredQuotations = quotations.filter(q =>
    q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
    q.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Quotations & Pre-Booking Estimates"
        subtitle="Professional proposals with 1-click seamless conversion to Confirmed Project & Invoice"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search quotation #, client..."
              className="w-56 sm:w-64"
            />
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Create Quotation
            </Button>
          </>
        }
      />

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No quotations found"
          description="No quotations match your search. Create a new quotation to start a pre-booking estimate."
        />
      ) : (
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr className="bg-white/[0.03]">
                <Th className="px-4">Quotation #</Th>
                <Th className="px-4">Client</Th>
                <Th className="px-4">Issue / Validity Date</Th>
                <Th className="px-4 text-right">Total Amount</Th>
                <Th className="px-4 text-center">Status</Th>
                <Th className="px-4 text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {filteredQuotations.map(q => (
                <Tr key={q.id}>
                  <Td className="px-4 font-mono font-bold text-white">{q.quotation_number}</Td>
                  <Td className="px-4 font-bold text-slate-200">{q.client_name}</Td>
                  <Td className="px-4 text-slate-400 font-mono text-[11px]">
                    <div>{formatDate(q.issue_date)}</div>
                    {q.valid_until && <div className="text-[10px] text-slate-500">Valid: {formatDate(q.valid_until)}</div>}
                  </Td>
                  <Td className="px-4 text-right font-mono font-bold text-slate-200">
                    {formatCurrency(q.total_amount, q.currency)}
                  </Td>
                  <Td className="px-4 text-center">
                    <Badge variant={q.status === 'Converted' ? 'success' : 'info'}>
                      {q.status}
                    </Badge>
                  </Td>
                  <Td className="px-4 text-right">
                    {q.status !== 'Converted' ? (
                      <Button
                        size="sm"
                        icon={FileCheck}
                        onClick={() => openConvertModal(q)}
                      >
                        Convert to Project & Invoice
                      </Button>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-medium">Converted to Confirmed</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      </div>
      )}

      {/* Convert Quotation Modal */}
      {showConvertModal && selectedQuotation && (
        <Modal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          title={`Convert Quotation ${selectedQuotation.quotation_number}`}
          maxWidth="md"
        >
          <form onSubmit={handleConvertQuotation} className="space-y-4 text-xs">
            <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
              <div className="text-slate-400">Client: <span className="text-white font-bold">{selectedQuotation.client_name}</span></div>
              <div className="text-slate-400">Total Agreed Amount: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(selectedQuotation.total_amount, selectedQuotation.currency)}</span></div>
            </div>

            <Field label="Project Name *">
              <Input
                type="text"
                required
                value={convertOptions.project_name}
                onChange={e => setConvertOptions({ ...convertOptions, project_name: e.target.value })}
              />
            </Field>

            <Field label="Scheduled Shoot Date *">
              <Input
                type="date"
                required
                value={convertOptions.shoot_date}
                onChange={e => setConvertOptions({ ...convertOptions, shoot_date: e.target.value })}
              />
            </Field>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={convertOptions.createInvoice}
                onChange={e => setConvertOptions({ ...convertOptions, createInvoice: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-white/[0.06] border-white/[0.08]"
              />
              <span className="text-slate-300 font-medium">Also automatically generate Tax Invoice now</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowConvertModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Conversion</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Quotation Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create New Quotation"
          maxWidth="3xl"
        >
          <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              <Field label="Issue Date *">
                <Input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </Field>

              <Field label="Valid Until">
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </Field>
            </div>

            {/* Line items */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs uppercase tracking-wide">Quotation Line Items</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {formData.items.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                  <div className="col-span-7">
                    <Input
                      type="text"
                      placeholder="Service / Deliverable description"
                      value={item.description}
                      onChange={e => handleItemChange(i, 'description', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleItemChange(i, 'quantity', Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.unit_price}
                      onChange={e => handleItemChange(i, 'unit_price', Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(i)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Field label="Tax Rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax_percent}
                  onChange={e => setFormData({ ...formData, tax_percent: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>

              <Field label="Discount">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={e => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save & Issue Quotation</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
