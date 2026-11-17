import React from 'react';
import { Menu, Plus, Calendar, ShieldCheck } from 'lucide-react';
import { formatDate } from '../services/api.js';

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
  onQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenSidebar, onQuickAdd }) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatDate(today)}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Owner (Full Access)</span>
        </div>

        <button
          onClick={onQuickAdd}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Entry</span>
        </button>
      </div>
    </header>
  );
};
