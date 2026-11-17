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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Drone & Equipment Asset Inventory</h2>
          <p className="text-xs text-slate-400">FPV fleet, high-speed cameras, LiPo battery sets, controllers, and maintenance logs</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search drones, goggles, serial..."
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
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEquipment.map(eq => (
          <div
            key={eq.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {eq.asset_tag}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{eq.name}</h3>
                  <p className="text-xs text-slate-400">{eq.brand} · {eq.model}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  eq.condition === 'New'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : eq.condition === 'Needs Repair'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {eq.condition}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
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

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
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
          </div>
        ))}
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <Modal
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          title={`Asset Profile: ${selectedEquipment.equipment.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
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
              <p className="text-slate-500 py-4 text-center bg-slate-950/40 rounded-xl">No repairs or maintenance logged yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedEquipment.maintenanceLogs.map((log: any) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
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
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iFlight Nazgul Evoque F5D 6S"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
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
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. iFlight, BetaFPV, GoPro, DJI, TBS"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Model / Version</label>
                <input
                  type="text"
                  placeholder="e.g. Evoque F5 DeadCat V2"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Purchase Cost (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchase_cost}
                  onChange={e => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Condition</label>
                <select
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Retired">Retired</option>
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
                Save Equipment
              </button>
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
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Service / Repair Type *</label>
              <input
                type="text"
                required
                placeholder="e.g. Motor replacement, bell balancing"
                value={maintenanceData.service_type}
                onChange={e => setMaintenanceData({ ...maintenanceData, service_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Repair Cost (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={maintenanceData.cost}
                  onChange={e => setMaintenanceData({ ...maintenanceData, cost: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Service Date</label>
                <input
                  type="date"
                  required
                  value={maintenanceData.service_date}
                  onChange={e => setMaintenanceData({ ...maintenanceData, service_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Work Done / Technical Notes</label>
              <textarea
                rows={2}
                value={maintenanceData.description}
                onChange={e => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
              >
                Save Repair Log
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
