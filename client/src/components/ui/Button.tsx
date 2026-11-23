import React from 'react';
import { LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 hover:shadow-glow',
  secondary: 'glass text-slate-200 hover:text-white font-semibold hover:border-white/10',
  ghost: 'text-slate-400 hover:text-white hover:bg-white/[0.06] font-medium',
  danger:
    'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-xs gap-2 rounded-xl',
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
    className={`inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    {...rest}
  >
    {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
    {children}
  </button>
);
