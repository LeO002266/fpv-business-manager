import React from 'react';
import { LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/20 active:bg-indigo-800',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium shadow-xs focus:ring-2 focus:ring-slate-400/20 active:bg-slate-100',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium',
  danger:
    'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium active:bg-rose-200',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs focus:ring-2 focus:ring-emerald-500/20 active:bg-emerald-800',
};

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-3.5 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-4 py-2.5 text-base gap-2 rounded-xl font-semibold',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  children,
  ...rest
}) => (
  <button
    className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    {...rest}
  >
    {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
    {children}
  </button>
);
