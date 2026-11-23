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
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
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
      <PageHeader
        title="General Business & Equipment Expenses"
        subtitle="Drone/Camera repairs, battery inventory, software licenses, and operational overhead"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search category, vendor, parts..."
              className="w-56 sm:w-64"
            />
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Business Expense
            </Button>
          </>
        }
      />

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
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="No expenses found"
          description="No business expenses match your search. Try a different category, vendor, or description."
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr className="bg-white/[0.03]">
                  <Th className="px-4">Date</Th>
                  <Th className="px-4">Category</Th>
                  <Th className="px-4">Description</Th>
                  <Th className="px-4">Vendor & Payment</Th>
                  <Th className="px-4">Type</Th>
                  <Th className="px-4 text-right">Amount</Th>
                </tr>
              </THead>
              <TBody>
                {filteredExpenses.map(e => (
                  <Tr key={e.id}>
                    <Td className="px-4 text-slate-400 font-mono text-[11px]">{formatDate(e.expense_date)}</Td>
                    <Td className="px-4 font-bold text-white">{e.category}</Td>
                    <Td className="px-4 text-slate-300 max-w-[220px] truncate">{e.description || '—'}</Td>
                    <Td className="px-4 text-slate-400">
                      <div>{e.vendor_name || 'Direct'}</div>
                      <div className="text-[10px] text-slate-500">{e.payment_method}</div>
                    </Td>
                    <Td className="px-4">
                      <Badge variant="neutral">{e.expense_type}</Badge>
                    </Td>
                    <Td className="px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      {formatCurrency(e.amount, e.currency)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

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
              <Field label="Expense Category *">
                <Select
                  value={formData.category}
                  onChange={e => {
                    const cat = e.target.value;
                    let type = 'General_Business';
                    if (['Equipment Purchase', 'Battery Purchase', 'Accessories'].includes(cat)) {
                      type = 'Equipment_Capital';
                    }
                    setFormData({ ...formData, category: cat, expense_type: type });
                  }}
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
                </Select>
              </Field>

              <Field label="Date *">
                <Input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </Field>

              <Field label="Amount (₹) *">
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="font-mono text-base font-bold"
                />
              </Field>

              <Field label="Vendor / Supplier">
                <Input
                  type="text"
                  placeholder="e.g. Robu.in, Amazon, DJI Store"
                  value={formData.vendor_name}
                  onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Itemized Description">
              <Textarea
                rows={2}
                placeholder="Details of parts purchased or services paid..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Expense
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
