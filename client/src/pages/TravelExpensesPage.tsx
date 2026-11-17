import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Fuel,
  Car,
  Compass,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  Truck
} from 'lucide-react';
import { Expense, Vehicle, Client, Project, TeamMember } from '../types.js';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { Modal } from '../components/Modal.js';
import { StatCard } from '../components/StatCard.js';

export const TravelExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [billingFilter, setBillingFilter] = useState('All');

  const [formData, setFormData] = useState<any>({
    expense_date: new Date().toISOString().slice(0, 10),
    client_id: '',
    project_id: '',
    vehicle_id: '',
    spent_by_id: '',
    from_location: 'Rajnagar Village',
    to_location: 'Raipur Mayfair Lake Resort',
    travel_mode: 'Car',
    trip_type: 'Round-Trip',
    category: 'Petrol',
    distance_km: 140,
    vehicle_mileage: 20,
    fuel_price_per_liter: 105,
    amount: 735,
    currency: 'INR',
    exchange_rate: 1.0,
    billing_treatment: 'Client_Billable',
    vendor_name: 'Indian Oil Kumhari',
    payment_method: 'UPI',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, vehRes, clRes, projRes, teamRes] = await Promise.all([
        api.getExpenses({ expense_type: 'Travel' }),
        api.getVehicles(),
        api.getClients(),
        api.getProjects(),
        api.getTeam()
      ]);
      setExpenses(expRes);
      setVehicles(vehRes);
      setClients(clRes);
      setProjects(projRes);
      setTeam(teamRes);
    } catch (err) {
      console.error('Failed to load travel expenses', err);
    } finally {
      setLoading(false);
    }
  };

  // When vehicle changes, update mileage preset
  const handleVehicleChange = (vehId: string) => {
    const v = vehicles.find(x => x.id === vehId);
    if (v) {
      const mileage = Number(v.mileage_km_per_liter) || 20;
      const dist = Number(formData.distance_km) || 0;
      const fuelPrice = Number(formData.fuel_price_per_liter) || 105;
      const calc = (dist > 0 && mileage > 0) ? Math.round(((dist / mileage) * fuelPrice) * 100) / 100 : 0;
      setFormData({
        ...formData,
        vehicle_id: vehId,
        travel_mode: v.type,
        vehicle_mileage: mileage,
        category: v.fuel_type === 'Diesel' ? 'Diesel' : 'Petrol',
        amount: calc
      });
    } else {
      setFormData({ ...formData, vehicle_id: '' });
    }
  };

  // Recalculate fuel estimate when distance or mileage or fuel price changes
  const handleCalcFieldChange = (field: string, val: number) => {
    const updated = { ...formData, [field]: val };
    const dist = Number(updated.distance_km) || 0;
    const mileage = Number(updated.vehicle_mileage) || 0;
    const fuelPrice = Number(updated.fuel_price_per_liter) || 0;

    let calc = updated.amount;
    if (['Petrol', 'Diesel'].includes(updated.category) && dist > 0 && mileage > 0 && fuelPrice > 0) {
      calc = Math.round(((dist / mileage) * fuelPrice) * 100) / 100;
    }
    setFormData({ ...updated, amount: calc });
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense({
        ...formData,
        expense_type: 'Travel'
      });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to log travel expense');
    }
  };

  const totalTravelCost = expenses.reduce((t, e) => t + Number(e.base_amount), 0);
  const totalBillable = expenses.filter(e => e.billing_treatment === 'Client_Billable').reduce((t, e) => t + Number(e.base_amount), 0);
  const totalOverhead = expenses.filter(e => e.billing_treatment === 'Business_Expense').reduce((t, e) => t + Number(e.base_amount), 0);
  const totalDistance = expenses.reduce((t, e) => t + Number(e.distance_km), 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch =
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.from_location.toLowerCase().includes(search.toLowerCase()) ||
      e.to_location.toLowerCase().includes(search.toLowerCase()) ||
      e.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchesBilling =
      billingFilter === 'All' ||
      (billingFilter === 'Billable' && e.billing_treatment === 'Client_Billable') ||
      (billingFilter === 'Overhead' && e.billing_treatment === 'Business_Expense');
    return matchesSearch && matchesBilling;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Travel & Fuel Expense Logistics</h2>
          <p className="text-xs text-slate-400">Rajnagar base to Durg, Bhilai, Raipur & national routes with mileage formula calculation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search route, destination, vehicle..."
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
            <span>Log Travel / Fuel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Travel Expenses"
          value={formatCurrency(totalTravelCost)}
          subtitle="All logged trips & routes"
          color="slate"
          icon={MapPin}
        />
        <StatCard
          label="Client Billable Travel"
          value={formatCurrency(totalBillable)}
          subtitle="Recoverable on invoices"
          color="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          label="Business Absorbed Cost"
          value={formatCurrency(totalOverhead)}
          subtitle="Non-billable overhead"
          color="rose"
        />
        <StatCard
          label="Distance Travelled"
          value={`${totalDistance} km`}
          subtitle="Logged vehicle mileage"
          color="sky"
          icon={Fuel}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['All', 'Billable', 'Overhead'].map(tab => (
          <button
            key={tab}
            onClick={() => setBillingFilter(tab)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              billingFilter === tab
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab === 'All' ? 'All Travel Records' : tab === 'Billable' ? 'Client Billable' : 'Business Expense'}
          </button>
        ))}
      </div>

      {/* Travel Register Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Route (Origin → Destination)</th>
                <th className="py-3 px-4">Mode / Vehicle</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Client / Project</th>
                <th className="py-3 px-4 text-right">Distance</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Billing & Invoice Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{formatDate(exp.expense_date)}</td>
                  <td className="py-3 px-4 font-medium text-white">
                    <div>{exp.from_location} → {exp.to_location}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{exp.trip_type}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{exp.travel_mode}</div>
                    {exp.vehicle_name && <div className="text-[10px] text-slate-400">{exp.vehicle_name}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-200">{exp.category}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{exp.client_name || 'Internal'}</div>
                    {exp.project_name && <div className="text-[10px] text-slate-400">{exp.project_name}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {exp.distance_km > 0 ? `${exp.distance_km} km` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatCurrency(exp.amount, exp.currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exp.billing_treatment === 'Client_Billable'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {exp.billing_treatment === 'Client_Billable' ? 'Client Billable' : 'Business Expense'}
                      </span>
                      {exp.invoice_allocation_status === 'Fully_Invoiced' && (
                        <div className="text-[10px] text-sky-400 font-medium">Billed on Invoice</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Travel Expense Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Log Travel & Fuel Expense"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Travel Date *</label>
                <input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Travel Mode</label>
                <select
                  value={formData.travel_mode}
                  onChange={e => setFormData({ ...formData, travel_mode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Bus">Bus</option>
                  <option value="Train">Train</option>
                  <option value="Flight">Flight</option>
                  <option value="Taxi">Taxi</option>
                  <option value="Auto">Auto</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Vehicle (Auto-fills mileage preset)</label>
                <select
                  value={formData.vehicle_id}
                  onChange={e => handleVehicleChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Manual / No Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type} - {v.mileage_km_per_liter} km/l {v.fuel_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Expense Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Charging">EV Charging</option>
                  <option value="Toll">Toll</option>
                  <option value="Parking">Parking</option>
                  <option value="Hotel">Hotel / Stay</option>
                  <option value="Food">Food / Meals</option>
                  <option value="Flight Ticket">Flight Ticket</option>
                  <option value="Train Ticket">Train Ticket</option>
                  <option value="Taxi">Taxi / Cab</option>
                  <option value="Local Transport">Local Transport</option>
                  <option value="Other">Other Travel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Origin Location</label>
                <input
                  type="text"
                  placeholder="e.g. Rajnagar Village"
                  value={formData.from_location}
                  onChange={e => setFormData({ ...formData, from_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Mayfair Lake Resort, Raipur"
                  value={formData.to_location}
                  onChange={e => setFormData({ ...formData, to_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Trip Type</label>
                <select
                  value={formData.trip_type}
                  onChange={e => setFormData({ ...formData, trip_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Round-Trip">Round-Trip</option>
                  <option value="One-Way">One-Way</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.distance_km}
                  onChange={e => handleCalcFieldChange('distance_km', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Fuel Formula Computation Card */}
            {['Petrol', 'Diesel'].includes(formData.category) && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-emerald-400" />
                    <span>Automatic Fuel Calculation Engine</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Distance ÷ Mileage × Price</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Vehicle Mileage (km/l)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vehicle_mileage}
                      onChange={e => handleCalcFieldChange('vehicle_mileage', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Fuel Price (₹/litre)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fuel_price_per_liter}
                      onChange={e => handleCalcFieldChange('fuel_price_per_liter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Actual Amount (₹) *</label>
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
                <label className="block text-slate-400 mb-1 font-medium">Billing Treatment *</label>
                <select
                  value={formData.billing_treatment}
                  onChange={e => setFormData({ ...formData, billing_treatment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Client_Billable">Client Billable (Add to Client Invoice)</option>
                  <option value="Business_Expense">Business Expense (Internal Business Overhead)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Link Client (Optional)</label>
                <select
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- No Client / General Business --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Link Project (Optional)</label>
                <select
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- No Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
                Save Travel Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
