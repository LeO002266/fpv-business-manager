import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Film,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { TeamMember } from '../types.js';
import { api, formatCurrency } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '',
    role: 'FPV Pilot',
    phone: '',
    email: '',
    payment_type: 'Per-Day',
    standard_rate: 6000,
    notes: ''
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await api.getTeam();
      setTeam(res);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTeamMember(formData);
      setShowAddModal(false);
      loadTeam();
    } catch (err) {
      alert('Failed to add team member');
    }
  };

  const totalCrew = team.length;
  const pilots = team.filter(t => t.role.includes('Pilot')).length;
  const totalPayouts = team.reduce((t, m) => t + Number(m.total_earned || 0), 0);

  const filteredTeam = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Crew & Pilot Directory</h2>
          <p className="text-xs text-slate-400">FPV pilots, spotters, camera operators, editors, standard rates, and shoot project payouts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search crew, pilots, role..."
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
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Registered Crew"
          value={`${totalCrew} Members`}
          subtitle="Pilots, spotters, editors, accounts"
          color="sky"
          icon={UserCheck}
        />
        <StatCard
          label="FPV Flight Pilots"
          value={`${pilots} Certified Pilots`}
          subtitle="Acro, cinewhoop, and high-speed"
          color="emerald"
        />
        <StatCard
          label="Total Crew Payouts"
          value={formatCurrency(totalPayouts)}
          subtitle="Integrated into project cost"
          color="amber"
          icon={DollarSign}
        />
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeam.map(member => (
          <div
            key={member.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{member.name}</h3>
                  <span className="text-xs font-semibold text-emerald-400">{member.role}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                  {member.availability}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{member.phone || 'No phone'}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{member.email}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span>Standard Rate:</span>
                  <span className="text-white font-mono font-bold">
                    {formatCurrency(member.standard_rate)} / {member.payment_type}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">{member.project_count || 0} shoots completed</span>
              <span className="text-emerald-400 font-mono font-bold">
                Earned: {formatCurrency(member.total_earned || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Crew Member / Pilot"
          maxWidth="md"
        >
          <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aman Verma"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FPV Pilot">FPV Pilot</option>
                <option value="Chief Pilot">Chief Pilot / Director</option>
                <option value="Camera Operator">Camera Operator</option>
                <option value="Spotter & Technician">Spotter & Technician</option>
                <option value="Colorist & Video Editor">Colorist & Video Editor</option>
                <option value="Accountant">Accountant</option>
                <option value="Manager">Shoot Manager</option>
                <option value="Assistant">Assistant</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 11223"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="pilot@aeroshotsfpv.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Basis</label>
                <select
                  value={formData.payment_type}
                  onChange={e => setFormData({ ...formData, payment_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Per-Day">Per-Day Shoot Rate</option>
                  <option value="Per-Project">Per-Project Flat Rate</option>
                  <option value="Monthly Salary">Monthly Salary</option>
                  <option value="Hourly">Hourly</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Standard Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.standard_rate}
                  onChange={e => setFormData({ ...formData, standard_rate: Number(e.target.value) })}
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
                Save Member
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
