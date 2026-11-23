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
import {
  Button,
  Field,
  Input,
  Select,
  SearchInput,
  Badge,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  PageHeader,
  FilterChips,
  EmptyState
} from '../components/ui/index.js';

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
      <PageHeader
        title="Travel & Fuel Expense Logistics"
        subtitle="Rajnagar base to Durg, Bhilai, Raipur & national routes with mileage formula calculation"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search route, destination, vehicle..."
              className="w-56 sm:w-64"
            />
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Log Travel / Fuel
            </Button>
          </>
        }
      />

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
      <FilterChips
        options={[
          { id: 'All', label: 'All Travel Records' },
          { id: 'Billable', label: 'Client Billable' },
          { id: 'Overhead', label: 'Business Expense' }
        ]}
        value={billingFilter}
        onChange={setBillingFilter}
      />

      {/* Travel Register Table */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No travel expenses found"
          description="No trips match your current search or billing filter. Try a different route, destination, or billing category."
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr className="bg-white/[0.03]">
                  <Th className="px-4">Date</Th>
                  <Th className="px-4">Route (Origin → Destination)</Th>
                  <Th className="px-4">Mode / Vehicle</Th>
                  <Th className="px-4">Category</Th>
                  <Th className="px-4">Client / Project</Th>
                  <Th className="px-4 text-right">Distance</Th>
                  <Th className="px-4 text-right">Amount</Th>
                  <Th className="px-4 text-center">Billing & Invoice Status</Th>
                </tr>
              </THead>
              <TBody>
                {filteredExpenses.map(exp => (
                  <Tr key={exp.id}>
                    <Td className="px-4 text-slate-400 font-mono text-[11px]">{formatDate(exp.expense_date)}</Td>
                    <Td className="px-4 font-medium text-white">
                      <div>{exp.from_location} → {exp.to_location}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{exp.trip_type}</div>
                    </Td>
                    <Td className="px-4 text-slate-300">
                      <div>{exp.travel_mode}</div>
                      {exp.vehicle_name && <div className="text-[10px] text-slate-400">{exp.vehicle_name}</div>}
                    </Td>
                    <Td className="px-4">
                      <span className="font-semibold text-slate-200">{exp.category}</span>
                    </Td>
                    <Td className="px-4 text-slate-300">
                      <div>{exp.client_name || 'Internal'}</div>
                      {exp.project_name && <div className="text-[10px] text-slate-400">{exp.project_name}</div>}
                    </Td>
                    <Td className="px-4 text-right font-mono text-slate-300">
                      {exp.distance_km > 0 ? `${exp.distance_km} km` : '—'}
                    </Td>
                    <Td className="px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(exp.amount, exp.currency)}
                    </Td>
                    <Td className="px-4 text-center">
                      <div className="space-y-1">
                        <Badge variant={exp.billing_treatment === 'Client_Billable' ? 'success' : 'neutral'}>
                          {exp.billing_treatment === 'Client_Billable' ? 'Client Billable' : 'Business Expense'}
                        </Badge>
                        {exp.invoice_allocation_status === 'Fully_Invoiced' && (
                          <div>
                            <Badge variant="info">Billed on Invoice</Badge>
                          </div>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

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
              <Field label="Travel Date *">
                <Input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </Field>

              <Field label="Travel Mode">
                <Select
                  value={formData.travel_mode}
                  onChange={e => setFormData({ ...formData, travel_mode: e.target.value })}
                >
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Bus">Bus</option>
                  <option value="Train">Train</option>
                  <option value="Flight">Flight</option>
                  <option value="Taxi">Taxi</option>
                  <option value="Auto">Auto</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>

              <Field label="Select Vehicle (Auto-fills mileage preset)">
                <Select
                  value={formData.vehicle_id}
                  onChange={e => handleVehicleChange(e.target.value)}
                >
                  <option value="">-- Manual / No Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type} - {v.mileage_km_per_liter} km/l {v.fuel_type})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Expense Category">
                <Select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
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
                </Select>
              </Field>

              <Field label="Origin Location">
                <Input
                  type="text"
                  placeholder="e.g. Rajnagar Village"
                  value={formData.from_location}
                  onChange={e => setFormData({ ...formData, from_location: e.target.value })}
                />
              </Field>

              <Field label="Destination">
                <Input
                  type="text"
                  placeholder="e.g. Mayfair Lake Resort, Raipur"
                  value={formData.to_location}
                  onChange={e => setFormData({ ...formData, to_location: e.target.value })}
                />
              </Field>

              <Field label="Trip Type">
                <Select
                  value={formData.trip_type}
                  onChange={e => setFormData({ ...formData, trip_type: e.target.value })}
                >
                  <option value="Round-Trip">Round-Trip</option>
                  <option value="One-Way">One-Way</option>
                </Select>
              </Field>

              <Field label="Distance (km)">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.distance_km}
                  onChange={e => handleCalcFieldChange('distance_km', Number(e.target.value))}
                  className="font-mono"
                />
              </Field>
            </div>

            {/* Fuel Formula Computation Card */}
            {['Petrol', 'Diesel'].includes(formData.category) && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-emerald-400" />
                    <span>Automatic Fuel Calculation Engine</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Distance ÷ Mileage × Price</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field label="Vehicle Mileage (km/l)">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.vehicle_mileage}
                      onChange={e => handleCalcFieldChange('vehicle_mileage', Number(e.target.value))}
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Fuel Price (₹/litre)">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.fuel_price_per_liter}
                      onChange={e => handleCalcFieldChange('fuel_price_per_liter', Number(e.target.value))}
                      className="font-mono"
                    />
                  </Field>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Actual Amount (₹) *">
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="font-mono text-base font-bold"
                />
              </Field>

              <Field label="Billing Treatment *">
                <Select
                  value={formData.billing_treatment}
                  onChange={e => setFormData({ ...formData, billing_treatment: e.target.value })}
                >
                  <option value="Client_Billable">Client Billable (Add to Client Invoice)</option>
                  <option value="Business_Expense">Business Expense (Internal Business Overhead)</option>
                </Select>
              </Field>

              <Field label="Link Client (Optional)">
                <Select
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                >
                  <option value="">-- No Client / General Business --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Link Project (Optional)">
                <Select
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">-- No Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Travel Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
