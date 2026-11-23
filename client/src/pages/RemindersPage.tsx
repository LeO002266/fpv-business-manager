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
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  PageHeader,
  Badge,
  EmptyState
} from '../components/ui/index.js';

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
      <PageHeader
        title="Reminders & Operational Alerts"
        subtitle="Scheduled alarms for upcoming shoots, payment due follow-ups, and maintenance intervals"
        actions={
          <Button onClick={() => setShowAddModal(true)} icon={Plus}>
            New Reminder
          </Button>
        }
      />

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
        {!loading && reminders.length === 0 && (
          <EmptyState
            icon={Bell}
            title="No reminders scheduled"
            description="Create alerts for upcoming shoots, payment follow-ups, and equipment maintenance."
          />
        )}
        {reminders.map(rem => (
          <div
            key={rem.id}
            className={`p-4 rounded-xl transition-all flex items-center justify-between ${
              rem.status === 'Completed'
                ? 'glass opacity-60'
                : 'glass hover:border-white/10'
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
              <Badge
                variant={
                  rem.priority === 'Urgent'
                    ? 'danger'
                    : rem.priority === 'High'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {rem.priority}
              </Badge>
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
            <Field label="Reminder Title *">
              <Input
                type="text"
                required
                placeholder="e.g. Charge all 6S batteries before Baraat shoot"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Shoot">Shoot Preparation</option>
                  <option value="Payment_Due">Payment Due Follow-up</option>
                  <option value="Invoice_Overdue">Invoice Overdue</option>
                  <option value="Maintenance">Equipment Maintenance</option>
                  <option value="General">General</option>
                </Select>
              </Field>

              <Field label="Due Date *">
                <Input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Priority">
              <Select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Urgent">Urgent (Immediate)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </Field>

            <Field label="Notes">
              <Textarea
                rows={2}
                placeholder="Specific instructions..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Set Reminder
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
