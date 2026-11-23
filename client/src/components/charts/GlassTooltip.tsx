import React from 'react';
import { formatCurrency } from '../../services/api.js';

interface GlassTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: any;
  /** When provided, each row shows its share as a percentage */
  total?: number;
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({ active, payload, label, total }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs shadow-md min-w-[140px]">
      {label != null && label !== '' && (
        <div className="text-slate-900 font-semibold mb-1.5 pb-1 border-b border-slate-100">{label}</div>
      )}
      <div className="space-y-1.5">
        {payload.map((p: any, i: number) => {
          const value = p.value ?? p.payload?.value ?? 0;
          const name = p.name ?? p.payload?.name ?? p.dataKey;
          const color = p.color || p.fill || p.payload?.color;
          return (
            <div key={i} className="flex items-center justify-between gap-3 text-slate-700">
              <div className="flex items-center gap-1.5">
                {color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                )}
                <span className="text-slate-600">{name}</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-slate-900">
                <span>{formatCurrency(value)}</span>
                {total ? (
                  <span className="text-slate-400 font-normal">
                    ({Math.round((value / total) * 100)}%)
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
