import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Search,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Cpu,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project, Client, TeamMember, Equipment } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignMemberModal, setShowAssignMemberModal] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    team_member_id: '',
    role: 'FPV Pilot',
    pay_type: 'Per-Day',
    agreed_rate: 5000,
    notes: ''
  });

  const [formData, setFormData] = useState<any>({
    client_id: '',
    name: '',
    category: 'Wedding Shoot',
    description: '',
    shoot_date: new Date().toISOString().slice(0, 10),
    start_time: '06:00',
    end_time: '18:00',
    location: '',
    city: 'Raipur',
    state: 'Chhattisgarh',
    country: 'India',
    currency: 'INR',
    quoted_amount: 50000,
    agreed_amount: 50000,
    advance_amount: 20000,
    status: 'Confirmed',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, clRes, teamRes] = await Promise.all([
        api.getProjects(),
        api.getClients(),
        api.getTeam()
      ]);
      setProjects(projRes);
      setClients(clRes);
      setTeam(teamRes);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const openProjectDetail = async (id: string) => {
    try {
      const detail = await api.getProjectDetail(id);
      setSelectedProject(detail);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }
    try {
      await api.createProject(formData);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !memberFormData.team_member_id) return;
    try {
      await api.assignProjectMember(selectedProject.project.id, memberFormData);
      setShowAssignMemberModal(false);
      openProjectDetail(selectedProject.project.id);
      loadData();
    } catch (err) {
      alert('Failed to assign team member');
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Shoot Bookings & Project Management</h2>
          <p className="text-xs text-slate-400">FPV shoot schedules, location logistics, crew rates, and project-wise profitability</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search shoots, client, location..."
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
            <span>New Shoot</span>
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar text-xs">
        {['All', 'Confirmed', 'Scheduled', 'In Progress', 'Completed', 'Invoiced', 'Paid', 'Lead'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === st
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map(proj => {
          const fin = proj.financials || {
            agreedAmount: proj.agreed_amount,
            invoicedAmount: 0,
            receivedAmount: 0,
            netProfit: proj.agreed_amount,
            profitMarginPercent: 100
          };

          return (
            <div
              key={proj.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {proj.project_code || 'PRJ'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 leading-snug">{proj.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">Client: <span className="text-slate-300">{proj.client_name}</span></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    proj.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : proj.status === 'In Progress'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                {/* Shoot Schedule & Location */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(proj.shoot_date)} {proj.start_time && `(${proj.start_time})`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{proj.location || `${proj.city}, ${proj.state}`}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase">Agreed Fee</div>
                    <div className="text-xs font-bold text-white font-mono mt-0.5">
                      {formatCurrency(proj.agreed_amount, proj.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase">Invoiced</div>
                    <div className="text-xs font-bold text-sky-400 font-mono mt-0.5">
                      {formatCurrency(fin.invoicedAmount, proj.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase">Received</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {formatCurrency(fin.receivedAmount, proj.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Est. Profit: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(fin.netProfit, proj.currency)}</span>
                </span>
                <button
                  onClick={() => openProjectDetail(proj.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  <span>Project Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Dashboard Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={`Shoot Dashboard: ${selectedProject.project.name}`}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-xs">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Agreed Fee"
                value={formatCurrency(selectedProject.financials.agreedAmount, selectedProject.project.currency)}
                color="slate"
              />
              <StatCard
                label="Invoiced"
                value={formatCurrency(selectedProject.financials.invoicedAmount, selectedProject.project.currency)}
                color="sky"
              />
              <StatCard
                label="Cash Received"
                value={formatCurrency(selectedProject.financials.receivedAmount, selectedProject.project.currency)}
                color="emerald"
              />
              <StatCard
                label="Net Project Profit"
                value={formatCurrency(selectedProject.financials.netProfit, selectedProject.project.currency)}
                subtitle={`${selectedProject.financials.profitMarginPercent}% Margin`}
                color="emerald"
              />
            </div>

            {/* Shoot Overview */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{selectedProject.project.name}</span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedProject.project.status}
                </span>
              </div>
              <p className="text-slate-400">Client: <span className="text-slate-200 font-semibold">{selectedProject.project.client_name}</span></p>
              <p className="text-slate-400">Date & Time: <span className="text-slate-200">{formatDate(selectedProject.project.shoot_date)} ({selectedProject.project.start_time} - {selectedProject.project.end_time})</span></p>
              <p className="text-slate-400">Location: <span className="text-slate-200">{selectedProject.project.location}, {selectedProject.project.city}</span></p>
              {selectedProject.project.description && (
                <p className="text-slate-300 pt-2 border-t border-slate-800/80">{selectedProject.project.description}</p>
              )}
            </div>

            {/* Assigned Crew */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white tracking-wide uppercase text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Assigned Crew Members ({selectedProject.members.length})</span>
                </h4>
                <button
                  onClick={() => setShowAssignMemberModal(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Pilot/Crew</span>
                </button>
              </div>

              {selectedProject.members.length === 0 ? (
                <p className="text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl">No crew members assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProject.members.map((m: any) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-slate-400 text-[11px]">{m.role} · {m.phone || 'No phone'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-200">{formatCurrency(m.agreed_rate)}</div>
                        <span className="text-[10px] text-slate-400">{m.pay_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Travel & Direct Expenses */}
            <div>
              <h4 className="font-bold text-white tracking-wide uppercase text-[11px] mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-rose-400" />
                <span>Shoot Travel & Direct Expenses ({selectedProject.expenses.length})</span>
              </h4>

              {selectedProject.expenses.length === 0 ? (
                <p className="text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl">No expenses recorded against this shoot yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProject.expenses.map((e: any) => (
                    <div key={e.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{e.category}</div>
                        <div className="text-slate-400 text-[11px]">
                          {e.from_location ? `${e.from_location} → ${e.to_location}` : e.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-400">{formatCurrency(e.amount, e.currency)}</div>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {e.billing_treatment === 'Client_Billable' ? 'Billable to Client' : 'Internal Overhead'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create New Shoot Booking"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <option key={c.id} value={c.id}>{c.name} ({c.client_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mayfair Lake Resort Baraat Shoot"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Shoot Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Wedding Shoot">Wedding Shoot</option>
                  <option value="Pre-Wedding Shoot">Pre-Wedding Shoot</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Music Video">Music Video</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Travel Videography">Travel Videography</option>
                  <option value="Commercial FPV Shoot">Commercial FPV Shoot</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Shoot Date *</label>
                <input
                  type="date"
                  required
                  value={formData.shoot_date}
                  onChange={e => setFormData({ ...formData, shoot_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Mayfair Lake Resort, Raipur"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Agreed Service Fee (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.agreed_amount}
                  onChange={e => setFormData({ ...formData, agreed_amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Advance Amount Expected</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.advance_amount}
                  onChange={e => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Lead">Lead</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Description & Flight Directives</label>
              <textarea
                rows={2}
                placeholder="Specific shot requirements, drone models requested, safety guidelines..."
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
                Save Project
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Member Modal */}
      {showAssignMemberModal && (
        <Modal
          isOpen={showAssignMemberModal}
          onClose={() => setShowAssignMemberModal(false)}
          title="Assign Crew Member to Project"
          maxWidth="md"
        >
          <form onSubmit={handleAssignMember} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Select Crew Member *</label>
              <select
                required
                value={memberFormData.team_member_id}
                onChange={e => setMemberFormData({ ...memberFormData, team_member_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Member --</option>
                {team.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Role on Shoot</label>
              <input
                type="text"
                value={memberFormData.role}
                onChange={e => setMemberFormData({ ...memberFormData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Pay Type</label>
                <select
                  value={memberFormData.pay_type}
                  onChange={e => setMemberFormData({ ...memberFormData, pay_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Per-Day">Per-Day</option>
                  <option value="Per-Project">Per-Project</option>
                  <option value="Hourly">Hourly</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Agreed Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={memberFormData.agreed_rate}
                  onChange={e => setMemberFormData({ ...memberFormData, agreed_rate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAssignMemberModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
