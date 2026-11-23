import React from 'react';

interface FilterChipsProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => (
  <div
    className={`inline-flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] p-1.5 rounded-xl text-xs backdrop-blur ${className}`}
  >
    {options.map((f) => (
      <button
        key={f.id}
        onClick={() => onChange(f.id)}
        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
          value === f.id
            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
);
