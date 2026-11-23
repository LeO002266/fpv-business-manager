import React from 'react';
import {
  LayoutDashboard,
  Users,
  Film,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  MapPin,
  TrendingDown,
  Wallet,
  Cpu,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  X,
  Compass
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Sales & CRM',
    items: [
      { id: 'clients', label: 'Clients & CRM', icon: Users },
      { id: 'projects', label: 'Projects & Shoots', icon: Film },
      { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
      { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
      { id: 'payments', label: 'Payments Ledger', icon: CreditCard },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'travel', label: 'Travel & Fuel Expenses', icon: MapPin },
      { id: 'expenses', label: 'Business Expenses', icon: TrendingDown },
      { id: 'accounts', label: 'Accounts & Cash Flow', icon: Wallet },
      { id: 'reports', label: 'Reports & P&L', icon: BarChart3 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'equipment', label: 'Drone & Equipment', icon: Cpu },
      { id: 'team', label: 'Crew & Pilots', icon: UserCheck },
      { id: 'reminders', label: 'Reminders & Alerts', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', label: 'Settings & Backups', icon: Settings }],
  },
];

export const navigationItems = navGroups.flatMap((g) => g.items);

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col
          bg-slate-950/70 backdrop-blur-2xl border-r border-white/[0.06]
          transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-glow">
              <Compass className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>FPV</span>
                <span className="text-emerald-400 font-semibold text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  ERP
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Business Manager v2.0</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-1.5">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`
                        relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150
                        ${active
                          ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-300 border border-emerald-500/25 shadow-sm shadow-emerald-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                        }
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-400" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Base Location & DB Status */}
        <div className="p-4 shrink-0 border-t border-white/[0.06]">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase PostgreSQL
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Base: <span className="text-slate-300 font-medium">Rajnagar Village (CG)</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
