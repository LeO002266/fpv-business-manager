import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassTooltip } from './GlassTooltip.js';
import { formatCurrency } from '../../services/api.js';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  height?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  centerValue,
  centerLabel,
  height = 170,
}) => {
  const total = data.reduce((t, s) => t + s.value, 0);

  if (!data.length || total <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-slate-500">No data yet</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="92%"
            paddingAngle={3}
            stroke="none"
            animationDuration={800}
          >
            {data.map((slice, i) => (
              <Cell key={i} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={<GlassTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-lg font-extrabold text-white tabular-nums tracking-tight">
          {centerValue}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">
          {centerLabel}
        </div>
      </div>
    </div>
  );
};

interface DonutLegendProps {
  slices: DonutSlice[];
  total: number;
}

export const DonutLegend: React.FC<DonutLegendProps> = ({ slices, total }) => (
  <div className="space-y-2 mt-3">
    {slices.map((s) => (
      <div key={s.name} className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2 text-slate-300 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: s.color }}
          />
          <span className="truncate">{s.name}</span>
        </span>
        <span className="shrink-0 flex items-center gap-2 font-mono">
          <span className="text-slate-500">
            {total > 0 ? Math.round((s.value / total) * 100) : 0}%
          </span>
          <span className="text-slate-300 font-semibold">{formatCurrency(s.value)}</span>
        </span>
      </div>
    ))}
  </div>
);
