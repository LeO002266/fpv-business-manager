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
    className={`inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs border border-slate-200/80 ${className}`}
  >
    {options.map((f) => (
      <button
        key={f.id}
        onClick={() => onChange(f.id)}
        className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
          value === f.id
            ? 'bg-white text-slate-900 font-semibold shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
);
