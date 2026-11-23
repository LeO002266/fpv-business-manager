import React from 'react';
import { Menu, Plus, Calendar, ShieldCheck, HelpCircle } from 'lucide-react';
import { formatDate } from '../services/api.js';
import { Button } from './ui/Button.js';

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
  onQuickAdd: () => void;
  onOpenTour: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenSidebar,
  onQuickAdd,
  onOpenTour,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Tour & Calculations Guide Button */}
        <button
          onClick={onOpenTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          title="Learn how FPV Manager works and see calculation formulas"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Tour & Guide</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-medium">{formatDate(today)}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 pl-1.5 pr-3 py-1 rounded-full font-medium">
          <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
            M
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Mohit (Owner)
          </span>
        </div>

        <Button onClick={onQuickAdd} icon={Plus} variant="primary">
          Quick Action
        </Button>
      </div>
    </header>
  );
};
