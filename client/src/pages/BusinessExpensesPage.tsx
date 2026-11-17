import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Wrench,
  Battery,
  Camera,
  Layers,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Expense, Project } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const BusinessExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<any>({
    category: 'Battery Purchase',
    expense_type: 'Equipment_Capital',
    description: '',
    amount: 14500,
    currency: 'INR',
    exchange_rate: 1.0,
    expense_date: new Date().toISOString().slice(0, 10),
    project_id: '',
    vendor_name: 'Robu.in / QuadStore',
    payment_method: 'Bank Transfer',
    billing_treatment: 'Business_Expense',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, projRes] = await Promise.all([
        api.getExpenses(),
        api.getProjects()
      ]);
      // Filter non-travel expenses
      setExpenses(expRes.filter((e: any) => e.expense_type !== 'Travel'));
      setProjects(projRes);
    } catch (err) {
      console.error('Failed to load business expenses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense(formData);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  const totalOverhead = expenses.reduce((t, e) => t + Number(e.base_amount), 0);
  const equipmentCapital = expenses.filter(e => e.expense_type === 'Equipment_Capital').reduce((t, e) => t + Number(e.base_amount), 0);
  const maintenanceCost = expenses.filter(e => e.category.includes('Repair')).reduce((t, e) => t + Number(e.base_amount), 0);

  const filteredExpenses = expenses.filter(e =>
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">General Business & Equipment Expenses</h2>
          <p className="text-xs text-slate-400">Drone/Camera repairs, battery inventory, software licenses, and operational overhead</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search category, vendor, parts..."
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
            <span>Add Business Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Business Overhead"
          value={formatCurrency(totalOverhead)}
          subtitle="All non-travel operational costs"
          color="rose"
          icon={TrendingDown}
        />
        <StatCard
          label="Asset Purchases (Drones/Gear)"
          value={formatCurrency(equipmentCapital)}
          subtitle="Capital equipment & batteries"
          color="sky"
          icon={Battery}
        />
        <StatCard
          label="Repairs & Maintenance"
          value={formatCurrency(maintenanceCost)}
          subtitle="Motors, frames, cameras"
          color="amber"
          icon={Wrench}
        />
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Vendor & Payment</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{formatDate(e.expense_date)}</td>
                  <td className="py-3 px-4 font-bold text-white">{e.category}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-[220px] truncate">{e.description || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">
                    <div>{e.vendor_name || 'Direct'}</div>
                    <div className="text-[10px] text-slate-500">{e.payment_method}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {e.expense_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                    {formatCurrency(e.amount, e.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record Business / Overhead Expense"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={e => {
                    const cat = e.target.value;
                    let type = 'General_Business';
                    if (['Equipment Purchase', 'Battery Purchase', 'Accessories'].includes(cat)) {
                      type = 'Equipment_Capital';
                    }
                    setFormData({ ...formData, category: cat, expense_type: type });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Battery Purchase">Battery Purchase (LiPo Packs)</option>
                  <option value="Drone Repair">Drone Repair / Frame Replacement</option>
                  <option value="Camera Repair">Camera Repair / Lens Replacement</option>
                  <option value="Equipment Purchase">Equipment Purchase</option>
                  <option value="Accessories">Props & Antenna Accessories</option>
                  <option value="Software Subscriptions">Software (Gyroflow/Premiere/Davinci)</option>
                  <option value="Internet">Internet / SIM Data</option>
                  <option value="Office Expenses">Office Expenses</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Salaries">Team Salaries / Freelancers</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Vendor / Supplier</label>
                <input
                  type="text"
                  placeholder="e.g. Robu.in, Amazon, DJI Store"
                  value={formData.vendor_name}
                  onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Itemized Description</label>
              <textarea
                rows={2}
                placeholder="Details of parts purchased or services paid..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
