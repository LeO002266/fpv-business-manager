import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  purple: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
  >
    {children}
  </span>
);
