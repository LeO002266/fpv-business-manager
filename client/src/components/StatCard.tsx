import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'emerald' | 'rose' | 'amber' | 'sky' | 'purple' | 'slate' | 'indigo';
  icon?: LucideIcon;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  color = 'indigo',
  icon: Icon,
  badge
}) => {
  const colorStyles = {
    emerald: {
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    rose: {
      text: 'text-rose-700',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    amber: {
      text: 'text-amber-800',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    sky: {
      text: 'text-sky-700',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    purple: {
      text: 'text-purple-700',
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    indigo: {
      text: 'text-indigo-700',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    slate: {
      text: 'text-slate-900',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  };

  const current = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 tabular-nums ${current.text}`}>
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
        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span>{subtitle}</span>
          {badge && (
            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${current.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
