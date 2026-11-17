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

export const navigationItems = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients & CRM', icon: Users },
  { id: 'projects', label: 'Projects & Shoots', icon: Film },
  { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
  { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
  { id: 'payments', label: 'Payments Ledger', icon: CreditCard },
  { id: 'travel', label: 'Travel & Fuel Expenses', icon: MapPin },
  { id: 'expenses', label: 'Business Expenses', icon: TrendingDown },
  { id: 'accounts', label: 'Accounts & Cash Flow', icon: Wallet },
  { id: 'equipment', label: 'Drone & Equipment', icon: Cpu },
  { id: 'team', label: 'Crew & Pilots', icon: UserCheck },
  { id: 'reports', label: 'Reports & P&L', icon: BarChart3 },
  { id: 'reminders', label: 'Reminders & Alerts', icon: Bell },
  { id: 'settings', label: 'Settings & Backups', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>FPV</span>
                <span className="text-emerald-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">ERP</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Business Manager v2.0</div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {navigationItems.map(item => {
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
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150
                  ${active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Base Location & DB Pill */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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
