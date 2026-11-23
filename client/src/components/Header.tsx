import React from 'react';
import { Menu, Plus, Calendar, ShieldCheck } from 'lucide-react';
import { formatDate } from '../services/api.js';
import { Button } from './ui/Button.js';

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
  onQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenSidebar, onQuickAdd }) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <header className="h-16 border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06] backdrop-blur">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatDate(today)}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-white/[0.04] border border-white/[0.06] pl-1.5 pr-3 py-1.5 rounded-full font-medium backdrop-blur">
          <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 text-[10px] font-extrabold">
            O
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Owner
          </span>
        </div>

        <Button onClick={onQuickAdd} icon={Plus} className="shadow-glow">
          New Entry
        </Button>
      </div>
    </header>
  );
};
