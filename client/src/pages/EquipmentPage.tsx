import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Wrench,
  Battery,
  Camera,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Equipment } from '../types.js';
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
  Card,
  PageHeader,
  EmptyState
} from '../components/ui/index.js';

export const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    category: 'FPV Drone',
    brand: 'iFlight',
    model: 'Nazgul Evoque F5',
    serial_number: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    purchase_cost: 35000,
    currency: 'INR',
    warranty_expiry: '',
    condition: 'Good',
    notes: ''
  });

  const [maintenanceData, setMaintenanceData] = useState<any>({
    service_date: new Date().toISOString().slice(0, 10),
    service_type: 'Motor & Prop Replacement',
    cost: 4500,
    performed_by: 'Self / Pilot',
    description: 'Replaced rear bell housing and motor 4 after high-speed gravel branch encounter.',
    next_service_due: ''
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.getEquipment();
      setEquipment(res);
    } catch (err) {
      console.error('Failed to load equipment', err);
    } finally {
      setLoading(false);
    }
  };

  const openEquipmentDetail = async (id: string) => {
    try {
      const detail = await api.getEquipmentDetail(id);
      setSelectedEquipment(detail);
    } catch (err) {
      console.error('Failed to load equipment detail', err);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment(formData);
      setShowAddModal(false);
      loadEquipment();
    } catch (err) {
      alert('Failed to add equipment');
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    try {
      await api.logMaintenance(selectedEquipment.equipment.id, maintenanceData);
      setShowMaintenanceModal(false);
      openEquipmentDetail(selectedEquipment.equipment.id);
      loadEquipment();
    } catch (err) {
      alert('Failed to log maintenance');
    }
  };

  const totalAssetValue = equipment.reduce((t, eq) => t + Number(eq.purchase_cost), 0);
  const activeDrones = equipment.filter(eq => eq.category === 'FPV Drone').length;
  const underMaintenance = equipment.filter(eq => eq.condition === 'Needs Repair').length;

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(search.toLowerCase()) ||
    eq.category.toLowerCase().includes(search.toLowerCase()) ||
    eq.brand.toLowerCase().includes(search.toLowerCase()) ||
    eq.asset_tag?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Drone & Equipment Asset Inventory"
        subtitle="FPV fleet, high-speed cameras, LiPo battery sets, controllers, and maintenance logs"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search drones, goggles, serial..."
              className="w-56 sm:w-64"
            />
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Equipment
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Fleet Asset Valuation"
          value={formatCurrency(totalAssetValue)}
          subtitle={`${equipment.length} registered hardware items`}
          color="emerald"
          icon={Cpu}
        />
        <StatCard
          label="FPV Drone Fleet"
          value={`${activeDrones} Quads`}
          subtitle="Cinewhoops, 5-inch 6S, Freestyles"
          color="sky"
        />
        <StatCard
          label="Maintenance Status"
          value={`${underMaintenance} In Service`}
          subtitle="Motors, frames, or calibration"
          color={underMaintenance > 0 ? 'amber' : 'slate'}
          icon={Wrench}
        />
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No equipment found"
          description="No drones, cameras, or gear match your search. Try a different name, brand, or asset tag."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEquipment.map(eq => (
            <Card key={eq.id} hover className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {eq.asset_tag}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{eq.name}</h3>
                    <p className="text-xs text-slate-400">{eq.brand} · {eq.model}</p>
                  </div>
                  <Badge
                    variant={
                      eq.condition === 'New'
                        ? 'success'
                        : eq.condition === 'Needs Repair'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {eq.condition}
                  </Badge>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="text-slate-200 font-medium">{eq.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serial Number:</span>
                    <span className="text-slate-200 font-mono text-[11px]">{eq.serial_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Purchase Value:</span>
                    <span className="text-white font-mono font-bold">{formatCurrency(eq.purchase_cost, eq.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Repairs: <span className="text-amber-400 font-mono font-bold">{formatCurrency(eq.total_repair_cost || 0)}</span>
                </span>
                <button
                  onClick={() => openEquipmentDetail(eq.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  <span>Service Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <Modal
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          title={`Asset Profile: ${selectedEquipment.equipment.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">Asset Tag:</span>
                <div className="font-mono font-bold text-white text-sm">{selectedEquipment.equipment.asset_tag}</div>
              </div>
              <div>
                <span className="text-slate-400">Purchase Cost:</span>
                <div className="font-mono font-bold text-emerald-400 text-sm">{formatCurrency(selectedEquipment.equipment.purchase_cost)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Maintenance & Repair History ({selectedEquipment.maintenanceLogs.length})</span>
              </h4>
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Repair</span>
              </button>
            </div>

            {selectedEquipment.maintenanceLogs.length === 0 ? (
              <p className="text-slate-500 py-4 text-center bg-white/[0.03] rounded-xl">No repairs or maintenance logged yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedEquipment.maintenanceLogs.map((log: any) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{log.service_type}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{log.description}</div>
                      <div className="text-slate-500 text-[10px] mt-1">{formatDate(log.service_date)} by {log.performed_by}</div>
                    </div>
                    <div className="font-mono font-bold text-rose-400 text-sm">
                      {formatCurrency(log.cost)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Drone / Camera / Hardware Asset"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateEquipment} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Asset Name *">
                <Input
                  type="text"
                  required
                  placeholder="e.g. iFlight Nazgul Evoque F5D 6S"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </Field>

              <Field label="Category">
                <Select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="FPV Drone">FPV Drone</option>
                  <option value="Camera">Camera (GoPro / Naked / Cinema)</option>
                  <option value="Controller">Radio Controller / Transmitter</option>
                  <option value="Goggles">FPV Goggles / Video Receiver</option>
                  <option value="Battery">LiPo Batteries</option>
                  <option value="Charger">LiPo Charger</option>
                  <option value="Props">Props & Spares</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>

              <Field label="Brand">
                <Input
                  type="text"
                  placeholder="e.g. iFlight, BetaFPV, GoPro, DJI, TBS"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                />
              </Field>

              <Field label="Model / Version">
                <Input
                  type="text"
                  placeholder="e.g. Evoque F5 DeadCat V2"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                />
              </Field>

              <Field label="Purchase Cost (₹) *">
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchase_cost}
                  onChange={e => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>

              <Field label="Condition">
                <Select
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Retired">Retired</option>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Equipment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Log Maintenance Modal */}
      {showMaintenanceModal && selectedEquipment && (
        <Modal
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          title={`Log Maintenance: ${selectedEquipment.equipment.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleLogMaintenance} className="space-y-4 text-xs">
            <Field label="Service / Repair Type *">
              <Input
                type="text"
                required
                placeholder="e.g. Motor replacement, bell balancing"
                value={maintenanceData.service_type}
                onChange={e => setMaintenanceData({ ...maintenanceData, service_type: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Repair Cost (₹) *">
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={maintenanceData.cost}
                  onChange={e => setMaintenanceData({ ...maintenanceData, cost: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>

              <Field label="Service Date">
                <Input
                  type="date"
                  required
                  value={maintenanceData.service_date}
                  onChange={e => setMaintenanceData({ ...maintenanceData, service_date: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Work Done / Technical Notes">
              <Textarea
                rows={2}
                value={maintenanceData.description}
                onChange={e => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" type="button" onClick={() => setShowMaintenanceModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Repair Log
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
