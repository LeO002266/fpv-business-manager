import React from 'react';
import { ChevronDown } from 'lucide-react';
import { inputBase } from './Input.js';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className="relative">
    <select
      className={`${inputBase} appearance-none pr-9 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);
