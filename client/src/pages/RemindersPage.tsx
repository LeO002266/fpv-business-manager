import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { Reminder } from '../types.js';
import { api, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Shoot',
    due_date: new Date().toISOString().slice(0, 10),
    priority: 'High',
    notes: ''
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const res = await api.getReminders();
      setReminders(res);
    } catch (err) {
      console.error('Failed to load reminders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReminder(formData);
      setShowAddModal(false);
      loadReminders();
    } catch (err) {
      alert('Failed to create reminder');
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.updateReminderStatus(id, nextStatus);
      loadReminders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteReminder(id);
      loadReminders();
    } catch (err) {
      alert('Failed to delete reminder');
    }
  };

  const pendingCount = reminders.filter(r => r.status === 'Pending').length;
  const urgentCount = reminders.filter(r => r.status === 'Pending' && (r.priority === 'Urgent' || r.priority === 'High')).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Reminders & Operational Alerts</h2>
          <p className="text-xs text-slate-400">Scheduled alarms for upcoming shoots, payment due follow-ups, and maintenance intervals</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/15 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Pending Reminders"
          value={`${pendingCount} Actions`}
          subtitle="Shoots & financial follow-ups"
          color="amber"
          icon={Bell}
        />
        <StatCard
          label="High Priority / Urgent"
          value={`${urgentCount} Tasks`}
          subtitle="Immediate operational attention"
          color="rose"
          icon={AlertCircle}
        />
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.map(rem => (
          <div
            key={rem.id}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              rem.status === 'Completed'
                ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => handleToggleStatus(rem.id, rem.status)}
                className={`p-1 rounded-lg transition-colors ${
                  rem.status === 'Completed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <div>
                <div className={`font-bold text-xs ${rem.status === 'Completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                  {rem.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>Due: {formatDate(rem.due_date)}</span>
                  <span>Type: {rem.type}</span>
                  {rem.notes && <span>· {rem.notes}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                rem.priority === 'Urgent'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : rem.priority === 'High'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {rem.priority}
              </span>
              <button
                onClick={() => handleDelete(rem.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create Operational Alert"
          maxWidth="md"
        >
          <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Reminder Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Charge all 6S batteries before Baraat shoot"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Category</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Shoot">Shoot Preparation</option>
                  <option value="Payment_Due">Payment Due Follow-up</option>
                  <option value="Invoice_Overdue">Invoice Overdue</option>
                  <option value="Maintenance">Equipment Maintenance</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Urgent">Urgent (Immediate)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Notes</label>
              <textarea
                rows={2}
                placeholder="Specific instructions..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
                Set Reminder
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
