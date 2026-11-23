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
  <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center text-center shadow-xs">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3.5 text-slate-500">
      <Icon className="w-6 h-6 text-slate-500" />
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 mt-1 max-w-md leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
