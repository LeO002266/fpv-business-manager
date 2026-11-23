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
    <div className="glass-panel rounded-xl px-3.5 py-2.5 text-xs shadow-card min-w-[130px]">
      {label != null && label !== '' && (
        <div className="text-slate-400 font-semibold mb-1.5">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => {
          const value = p.value ?? p.payload?.value ?? 0;
          const name = p.name ?? p.payload?.name ?? p.dataKey;
          const color = p.color || p.fill || p.payload?.color;
          return (
            <div key={i} className="flex items-center gap-2 text-slate-200">
              {color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
              )}
              <span className="text-slate-400">{name}:</span>
              <span className="font-mono font-semibold text-white">
                {formatCurrency(value)}
              </span>
              {total ? (
                <span className="text-slate-500 font-mono">
                  ({Math.round((value / total) * 100)}%)
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
