import React from 'react';
import {
  LayoutDashboard,
  Film,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  MapPin,
  TrendingDown,
  Wallet,
  Users,
  BarChart3,
  Cpu,
  UserCheck,
  Bell,
  Settings,
  X,
  Camera
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'projects', label: 'Shoots & Projects', icon: Film },
      { id: 'clients', label: 'Clients & CRM', icon: Users },
    ],
  },
  {
    label: 'Billing & Money',
    items: [
      { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
      { id: 'payments', label: 'Payments Received', icon: CreditCard },
      { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Expenses & Fuel',
    items: [
      { id: 'travel', label: 'Travel & Fuel Log', icon: MapPin },
      { id: 'expenses', label: 'Business Expenses', icon: TrendingDown },
      { id: 'accounts', label: 'Cash Flow & Accounts', icon: Wallet },
    ],
  },
  {
    label: 'Operations & Insights',
    items: [
      { id: 'reports', label: 'Profit & Reports', icon: BarChart3 },
      { id: 'equipment', label: 'Drones & Gear', icon: Cpu },
      { id: 'team', label: 'Pilots & Crew', icon: UserCheck },
      { id: 'reminders', label: 'Reminders', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const navigationItems = navGroups.flatMap((g) => g.items);

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                FPV Manager
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                Aerial ERP
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Business Card */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              ₹
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                AeroShots FPV
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Rajnagar / Durg
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
