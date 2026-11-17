import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Receipt,
  CreditCard,
  Film,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Briefcase,
  Calendar,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Client } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    company_name: '',
    contact_person: '',
    phone: '',
    whatsapp: '',
    email: '',
    billing_address: '',
    city: 'Bhilai',
    state: 'Chhattisgarh',
    country: 'India',
    gstin: '',
    client_type: 'Wedding Planner',
    preferred_currency: 'INR',
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.getClients();
      setClients(res);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  const openClientProfile = async (id: string) => {
    try {
      const detail = await api.getClientDetail(id);
      setSelectedClient(detail);
      setActiveTab('overview');
    } catch (err) {
      console.error('Failed to load client detail', err);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClient(formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        company_name: '',
        contact_person: '',
        phone: '',
        whatsapp: '',
        email: '',
        billing_address: '',
        city: 'Bhilai',
        state: 'Chhattisgarh',
        country: 'India',
        gstin: '',
        client_type: 'Wedding Planner',
        preferred_currency: 'INR',
        notes: ''
      });
      loadClients();
    } catch (err) {
      alert('Failed to create client');
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Client CRM & Financial Portfolios</h2>
          <p className="text-xs text-slate-400">Independent accounting, shoot history, and billing records per client</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search clients, company, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-60 sm:w-72"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Clients Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map(client => {
          const fin = client.financials || {
            totalBilled: 0,
            totalReceived: 0,
            pendingReceivables: 0,
            travelExpenses: 0,
            netProfit: 0,
            profitMarginPercent: 0
          };

          return (
            <div
              key={client.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {client.client_code || 'CLIENT'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 leading-snug">{client.name}</h3>
                    {client.company_name && (
                      <p className="text-xs text-slate-400 font-medium">{client.company_name}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
                    {client.client_type}
                  </span>
                </div>

                {/* Contact metadata */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{client.phone || client.whatsapp || 'No contact phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{client.city ? `${client.city}, ${client.state}` : client.country}</span>
                  </div>
                </div>

                {/* Financial KPI Summary */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase">Billed</div>
                    <div className="text-xs font-bold text-sky-400 font-mono mt-0.5">
                      {formatCurrency(fin.totalBilled, client.preferred_currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase">Received</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {formatCurrency(fin.totalReceived, client.preferred_currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase">Pending</div>
                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                      {formatCurrency(fin.pendingReceivables, client.preferred_currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Profit: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(fin.netProfit, client.preferred_currency)}</span>
                </span>
                <button
                  onClick={() => openClientProfile(client.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  <span>Open 9-Tab Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 9-Tab Client Profile Modal */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={`Client Financial Profile: ${selectedClient.client.name}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Top 9-Tab Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 custom-scrollbar text-xs">
              {[
                { id: 'overview', label: '1. Overview & Financials' },
                { id: 'projects', label: `2. Projects (${selectedClient.projects.length})` },
                { id: 'quotations', label: `3. Quotations (${selectedClient.quotations.length})` },
                { id: 'invoices', label: `4. Invoices (${selectedClient.invoices.length})` },
                { id: 'payments', label: `5. Payments (${selectedClient.payments.length})` },
                { id: 'travel', label: `6. Travel Expenses (${selectedClient.travelExpenses.length})` },
                { id: 'expenses', label: `7. Other Expenses (${selectedClient.otherExpenses.length})` },
                { id: 'documents', label: '8. Documents & Notes' },
                { id: 'activity', label: '9. Activity History' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Billed"
                    value={formatCurrency(selectedClient.financials.totalBilled, selectedClient.client.preferred_currency)}
                    color="sky"
                  />
                  <StatCard
                    label="Amount Received"
                    value={formatCurrency(selectedClient.financials.totalReceived, selectedClient.client.preferred_currency)}
                    color="emerald"
                  />
                  <StatCard
                    label="Pending Balance"
                    value={formatCurrency(selectedClient.financials.pendingReceivables, selectedClient.client.preferred_currency)}
                    color="amber"
                  />
                  <StatCard
                    label="Net Client Profit"
                    value={formatCurrency(selectedClient.financials.netProfit, selectedClient.client.preferred_currency)}
                    subtitle={`${selectedClient.financials.profitMarginPercent}% Margin`}
                    color="emerald"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-200 uppercase text-[11px] tracking-wider">Company & Legal Information</h4>
                    <p className="text-slate-400">Company: <span className="text-slate-200 font-medium">{selectedClient.client.company_name || '—'}</span></p>
                    <p className="text-slate-400">Contact Person: <span className="text-slate-200 font-medium">{selectedClient.client.contact_person || '—'}</span></p>
                    <p className="text-slate-400">GSTIN / Tax ID: <span className="text-slate-200 font-mono">{selectedClient.client.gstin || 'Unregistered'}</span></p>
                    <p className="text-slate-400">Category: <span className="text-slate-200">{selectedClient.client.client_type}</span></p>
                    <p className="text-slate-400">Currency Preference: <span className="text-emerald-400 font-bold">{selectedClient.client.preferred_currency}</span></p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-200 uppercase text-[11px] tracking-wider">Contact & Address</h4>
                    <p className="text-slate-400">Phone: <span className="text-slate-200">{selectedClient.client.phone || '—'}</span></p>
                    <p className="text-slate-400">WhatsApp: <span className="text-slate-200">{selectedClient.client.whatsapp || '—'}</span></p>
                    <p className="text-slate-400">Email: <span className="text-slate-200">{selectedClient.client.email || '—'}</span></p>
                    <p className="text-slate-400">Billing Address: <span className="text-slate-200">{selectedClient.client.billing_address || '—'}</span></p>
                    <p className="text-slate-400">City / State: <span className="text-slate-200">{selectedClient.client.city}, {selectedClient.client.state}, {selectedClient.client.country}</span></p>
                  </div>
                </div>

                {/* Accounting Breakdown */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-emerald-400">Interconnected Accounting Logic:</span>
                  <p>
                    Billable travel expenses ({formatCurrency(selectedClient.financials.billableExpenses)}) are passed through and recovered on invoices. Internal non-billable overheads ({formatCurrency(selectedClient.financials.nonBillableExpenses)}) and crew payouts ({formatCurrency(selectedClient.financials.teamCosts)}) deduct directly from gross revenue to yield the true net profit of {formatCurrency(selectedClient.financials.netProfit)}.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-3">
                {selectedClient.projects.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No projects registered for this client yet.</p>
                ) : (
                  selectedClient.projects.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>Date: {formatDate(p.shoot_date)}</span>
                          <span>Location: {p.location || '—'}</span>
                          <span>Category: {p.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(p.agreed_amount, p.currency)}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1 inline-block">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: QUOTATIONS */}
            {activeTab === 'quotations' && (
              <div className="space-y-3">
                {selectedClient.quotations.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No quotations recorded.</p>
                ) : (
                  selectedClient.quotations.map((q: any) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{q.quotation_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Issued: {formatDate(q.issue_date)} | Valid: {formatDate(q.valid_until)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">{formatCurrency(q.total_amount, q.currency)}</div>
                        <span className="text-[10px] text-amber-400 font-semibold">{q.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: INVOICES */}
            {activeTab === 'invoices' && (
              <div className="space-y-3">
                {selectedClient.invoices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No invoices issued for this client.</p>
                ) : (
                  selectedClient.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{inv.invoice_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Date: {formatDate(inv.issue_date)} | Due: {formatDate(inv.due_date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">{formatCurrency(inv.total_amount, inv.currency)}</div>
                        <div className="text-xs text-slate-400">Paid: {formatCurrency(inv.amount_paid, inv.currency)}</div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                {selectedClient.payments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No payments logged yet.</p>
                ) : (
                  selectedClient.payments.map((pay: any) => (
                    <div key={pay.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{pay.payment_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(pay.payment_date)} via <span className="text-slate-200 font-semibold">{pay.payment_method}</span>
                          {pay.reference_number && ` (Ref: ${pay.reference_number})`}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        +{formatCurrency(pay.amount, pay.currency)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: TRAVEL EXPENSES */}
            {activeTab === 'travel' && (
              <div className="space-y-3">
                {selectedClient.travelExpenses.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No travel expenses linked to this client.</p>
                ) : (
                  selectedClient.travelExpenses.map((tr: any) => (
                    <div key={tr.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{tr.category}: {tr.from_location} → {tr.to_location}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(tr.expense_date)} | Mode: {tr.travel_mode} | {tr.distance_km} km ({tr.trip_type})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-400 text-sm">{formatCurrency(tr.amount, tr.currency)}</div>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {tr.billing_treatment === 'Client_Billable' ? 'Client Billable' : 'Internal'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 7: OTHER EXPENSES */}
            {activeTab === 'expenses' && (
              <div className="space-y-3">
                {selectedClient.otherExpenses.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No other expenses linked to this client.</p>
                ) : (
                  selectedClient.otherExpenses.map((oe: any) => (
                    <div key={oe.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{oe.category}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{oe.description || '—'}</div>
                      </div>
                      <div className="font-mono font-bold text-rose-400 text-sm">{formatCurrency(oe.amount, oe.currency)}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 8: DOCUMENTS & NOTES */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="font-bold text-white text-xs mb-2">Client Notes & Contract References</h4>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{selectedClient.client.notes || 'No specialized notes attached.'}</p>
                </div>
              </div>
            )}

            {/* TAB 9: ACTIVITY HISTORY */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Client portfolio created on {formatDate(selectedClient.client.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Receipt className="w-3.5 h-3.5 text-sky-400" />
                    <span>Total {selectedClient.invoices.length} invoices generated</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Total {selectedClient.payments.length} payment receipts recorded</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Client to CRM"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Client / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Heritage Weddings"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Company Name (if applicable)</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Heritage Event Management Pvt Ltd"
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Rao"
                  value={formData.contact_person}
                  onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Phone Number / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="client@domain.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Client Type</label>
                <select
                  value={formData.client_type}
                  onChange={e => setFormData({ ...formData, client_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Wedding Planner">Wedding Planner</option>
                  <option value="Event Management Company">Event Management Company</option>
                  <option value="Advertising Agency">Advertising Agency</option>
                  <option value="Production House">Production House</option>
                  <option value="Corporate Client">Corporate Client</option>
                  <option value="Individual">Individual</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">City / Base</label>
                <input
                  type="text"
                  placeholder="e.g. Bhilai, Raipur, Durg"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Preferred Currency</label>
                <select
                  value={formData.preferred_currency}
                  onChange={e => setFormData({ ...formData, preferred_currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Billing Address & GSTIN</label>
              <textarea
                rows={2}
                placeholder="Address details, GSTIN number (if applicable)"
                value={formData.billing_address}
                onChange={e => setFormData({ ...formData, billing_address: e.target.value })}
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
                Save Client
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
