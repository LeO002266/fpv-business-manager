import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'emerald' | 'rose' | 'amber' | 'sky' | 'purple' | 'slate';
  icon?: LucideIcon;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  color = 'slate',
  icon: Icon,
  badge
}) => {
  const colorStyles = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-400'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/20 text-rose-400'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-400'
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      iconBg: 'bg-sky-500/20 text-sky-400'
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/20 text-purple-400'
    },
    slate: {
      text: 'text-slate-200',
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      iconBg: 'bg-slate-800 text-slate-400'
    }
  };

  const current = colorStyles[color];

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm relative overflow-hidden transition-all hover:border-slate-700/80`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">{label}</span>
          <div className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5 ${current.text}`}>
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${current.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>{subtitle}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${current.bg} ${current.text}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
