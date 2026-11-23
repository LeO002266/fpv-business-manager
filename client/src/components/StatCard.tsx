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
      iconBg: 'bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 text-emerald-400 border border-emerald-500/20',
      glow: 'bg-emerald-500/15'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      iconBg: 'bg-gradient-to-br from-rose-500/25 to-rose-500/5 text-rose-400 border border-rose-500/20',
      glow: 'bg-rose-500/15'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconBg: 'bg-gradient-to-br from-amber-500/25 to-amber-500/5 text-amber-400 border border-amber-500/20',
      glow: 'bg-amber-500/15'
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      iconBg: 'bg-gradient-to-br from-sky-500/25 to-sky-500/5 text-sky-400 border border-sky-500/20',
      glow: 'bg-sky-500/15'
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-gradient-to-br from-purple-500/25 to-purple-500/5 text-purple-400 border border-purple-500/20',
      glow: 'bg-purple-500/15'
    },
    slate: {
      text: 'text-slate-200',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      iconBg: 'bg-gradient-to-br from-slate-500/25 to-slate-500/5 text-slate-300 border border-slate-500/20',
      glow: 'bg-slate-500/10'
    }
  };

  const current = colorStyles[color];

  return (
    <div className="glass glass-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
      {/* Corner glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${current.glow} blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between relative">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{label}</span>
          <div className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5 tabular-nums ${current.text}`}>
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
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] relative">
          <span>{subtitle}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${current.bg} ${current.text} ${current.border} border`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
