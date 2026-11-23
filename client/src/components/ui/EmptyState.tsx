import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="glass rounded-2xl p-10 flex flex-col items-center text-center">
    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-3">
      <Icon className="w-6 h-6 text-slate-500" />
    </div>
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    {description && (
      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
