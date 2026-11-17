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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Quotations & Pre-Booking Estimates</h2>
          <p className="text-xs text-slate-400">Professional proposals with 1-click seamless conversion to Confirmed Project & Invoice</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search quotation #, client..."
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
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Issue / Validity Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{q.quotation_number}</td>
                  <td className="py-3 px-4 font-bold text-slate-200">{q.client_name}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    <div>{formatDate(q.issue_date)}</div>
                    {q.valid_until && <div className="text-[10px] text-slate-500">Valid: {formatDate(q.valid_until)}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                    {formatCurrency(q.total_amount, q.currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      q.status === 'Converted'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {q.status !== 'Converted' ? (
                      <button
                        onClick={() => openConvertModal(q)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow transition-all inline-flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Convert to Project & Invoice</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-medium">Converted to Confirmed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert Quotation Modal */}
      {showConvertModal && selectedQuotation && (
        <Modal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          title={`Convert Quotation ${selectedQuotation.quotation_number}`}
          maxWidth="md"
        >
          <form onSubmit={handleConvertQuotation} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Client: <span className="text-white font-bold">{selectedQuotation.client_name}</span></div>
              <div className="text-slate-400">Total Agreed Amount: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(selectedQuotation.total_amount, selectedQuotation.currency)}</span></div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Project Name *</label>
              <input
                type="text"
                required
                value={convertOptions.project_name}
                onChange={e => setConvertOptions({ ...convertOptions, project_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Scheduled Shoot Date *</label>
              <input
                type="date"
                required
                value={convertOptions.shoot_date}
                onChange={e => setConvertOptions({ ...convertOptions, shoot_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={convertOptions.createInvoice}
                onChange={e => setConvertOptions({ ...convertOptions, createInvoice: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-slate-300 font-medium">Also automatically generate Tax Invoice now</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
              >
                Confirm Conversion
              </button>
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
                <label className="block text-slate-400 mb-1 font-medium">Valid Until</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="col-span-7">
                    <input
                      type="text"
                      placeholder="Service / Deliverable description"
                      value={item.description}
                      onChange={e => handleItemChange(i, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleItemChange(i, 'quantity', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.unit_price}
                      onChange={e => handleItemChange(i, 'unit_price', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-right font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(i)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_percent}
                  onChange={e => setFormData({ ...formData, tax_percent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Discount</label>
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
                Save & Issue Quotation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
