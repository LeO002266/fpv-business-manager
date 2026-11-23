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
import {
  Button,
  Field,
  Input,
  Select,
  SearchInput,
  Badge,
  Card,
  PageHeader,
  EmptyState
} from '../components/ui/index.js';

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
      <PageHeader
        title="Crew & Pilot Directory"
        subtitle="FPV pilots, spotters, camera operators, editors, standard rates, and shoot project payouts"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search crew, pilots, role..."
              className="w-56 sm:w-64"
            />
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Member
            </Button>
          </>
        }
      />

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
      {filteredTeam.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No team members found"
          description="No crew members match your search. Try a different name, role, or phone number."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeam.map(member => (
            <Card key={member.id} hover className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{member.name}</h3>
                    <span className="text-xs font-semibold text-emerald-400">{member.role}</span>
                  </div>
                  <Badge
                    variant={
                      member.availability === 'Available'
                        ? 'success'
                        : member.availability === 'In Use'
                        ? 'warning'
                        : member.availability === 'Unavailable'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {member.availability}
                  </Badge>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
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

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-slate-400">{member.project_count || 0} shoots completed</span>
                <span className="text-emerald-400 font-mono font-bold">
                  Earned: {formatCurrency(member.total_earned || 0)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Crew Member / Pilot"
          maxWidth="md"
        >
          <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
            <Field label="Full Name *">
              <Input
                type="text"
                required
                placeholder="e.g. Aman Verma"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </Field>

            <Field label="Role *">
              <Select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="FPV Pilot">FPV Pilot</option>
                <option value="Chief Pilot">Chief Pilot / Director</option>
                <option value="Camera Operator">Camera Operator</option>
                <option value="Spotter & Technician">Spotter & Technician</option>
                <option value="Colorist & Video Editor">Colorist & Video Editor</option>
                <option value="Accountant">Accountant</option>
                <option value="Manager">Shoot Manager</option>
                <option value="Assistant">Assistant</option>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone Number">
                <Input
                  type="text"
                  placeholder="+91 98765 11223"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>

              <Field label="Email Address">
                <Input
                  type="email"
                  placeholder="pilot@aeroshotsfpv.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Basis">
                <Select
                  value={formData.payment_type}
                  onChange={e => setFormData({ ...formData, payment_type: e.target.value })}
                >
                  <option value="Per-Day">Per-Day Shoot Rate</option>
                  <option value="Per-Project">Per-Project Flat Rate</option>
                  <option value="Monthly Salary">Monthly Salary</option>
                  <option value="Hourly">Hourly</option>
                </Select>
              </Field>

              <Field label="Standard Rate (₹) *">
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.standard_rate}
                  onChange={e => setFormData({ ...formData, standard_rate: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Member
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
