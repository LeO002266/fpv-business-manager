import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, children, hint, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-slate-400 mb-1.5 font-medium text-xs">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
  </label>
);
