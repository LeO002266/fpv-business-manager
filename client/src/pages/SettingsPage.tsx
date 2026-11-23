import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  Coins,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { Button, Field, Input, Textarea, PageHeader } from '../components/ui/index.js';

export const SettingsPage: React.FC = () => {
  const [org, setOrg] = useState<any>({
    name: 'AeroShots FPV & Media Productions',
    currency_code: 'INR',
    fuel_price: 105.00,
    default_mileage: 25.00,
    base_city: 'Rajnagar Village',
    address: 'Main Road, Rajnagar, Durg District, Chhattisgarh 491001',
    phone: '+91 98765 43210',
    email: 'contact@aeroshotsfpv.com',
    gstin: '22AAAAA0000A1Z5',
    terms_conditions: 'Payment due within 15 days of invoice date.'
  });

  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.organization) setOrg(res.organization);
      if (res.currencies) setCurrencies(res.currencies);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(org);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  const handleRateChange = async (code: string, newRate: number) => {
    try {
      await api.updateCurrency(code, newRate);
      loadSettings();
    } catch (err) {
      alert('Failed to update exchange rate');
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/settings/backup', '_blank');
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        const res = await api.restoreBackup(json);
        alert(res.message || 'Backup successfully restored!');
        window.location.reload();
      } catch (err) {
        alert('Invalid JSON backup file or restore failed');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Enterprise Business Settings & Multi-Currency Engine"
        subtitle="Configure base location, fuel parameters, global exchange rates, and database backup / restore"
      />

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated and persisted to Supabase PostgreSQL!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white font-bold text-sm mb-4">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Organization Profile & Shoot Presets</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business / Production Brand Name">
                <Input
                  type="text"
                  value={org.name}
                  onChange={e => setOrg({ ...org, name: e.target.value })}
                />
              </Field>

              <Field label="Base Origin Location (Editable)">
                <Input
                  type="text"
                  value={org.base_city}
                  onChange={e => setOrg({ ...org, base_city: e.target.value })}
                />
              </Field>

              <Field label="Default Fuel Price (₹ / Litre)">
                <Input
                  type="number"
                  step="0.01"
                  value={org.fuel_price}
                  onChange={e => setOrg({ ...org, fuel_price: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>

              <Field label="Default Vehicle Mileage (km / L)">
                <Input
                  type="number"
                  step="0.1"
                  value={org.default_mileage}
                  onChange={e => setOrg({ ...org, default_mileage: Number(e.target.value) })}
                  className="font-mono"
                />
              </Field>

              <Field label="Phone / WhatsApp">
                <Input
                  type="text"
                  value={org.phone}
                  onChange={e => setOrg({ ...org, phone: e.target.value })}
                />
              </Field>

              <Field label="Official Email">
                <Input
                  type="email"
                  value={org.email}
                  onChange={e => setOrg({ ...org, email: e.target.value })}
                />
              </Field>

              <Field label="GSTIN / Tax Registration Number" className="sm:col-span-2">
                <Input
                  type="text"
                  value={org.gstin}
                  onChange={e => setOrg({ ...org, gstin: e.target.value })}
                  className="font-mono"
                />
              </Field>

              <Field label="Registered Business Address" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={org.address}
                  onChange={e => setOrg({ ...org, address: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.06]">
              <Button type="submit" icon={Save}>
                Save Business Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Currency & Backup Panel */}
        <div className="space-y-6">
          {/* Multi-Currency Engine */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Multi-Currency Rates</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Base currency: <b className="text-emerald-400">INR (₹)</b>. Rates locked per transaction.</p>

            <div className="space-y-2.5">
              {currencies.map(c => (
                <div key={c.code} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                  <div>
                    <span className="font-bold text-white font-mono">{c.code}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({c.name})</span>
                  </div>
                  {c.is_base ? (
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">1.00 (BASE)</span>
                  ) : (
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-500 text-[10px]">1 {c.code} = ₹</span>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={c.default_exchange_rate}
                        onBlur={e => handleRateChange(c.code, Number(e.target.value))}
                        className="w-16 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5 text-right text-emerald-400 font-bold text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="glass rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm">Data Backup & Migration</h3>
            <p className="text-slate-400">
              Download complete database snapshots or import legacy prototype backups.
            </p>

            <div className="space-y-2 pt-1">
              <Button
                onClick={handleDownloadBackup}
                variant="secondary"
                className="w-full"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Full JSON Backup</span>
              </Button>

              <label className="w-full flex items-center justify-center gap-2 glass text-slate-200 hover:text-white font-semibold py-2.5 rounded-xl cursor-pointer transition-all hover:border-white/10">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Restore JSON / Legacy Prototype</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileRestore}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
