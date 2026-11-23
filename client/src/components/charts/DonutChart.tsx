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
  height = 180,
}) => {
  const total = data.reduce((t, s) => t + s.value, 0);

  if (!data.length || total <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-slate-400">No data recorded yet</p>
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
            innerRadius="65%"
            outerRadius="92%"
            paddingAngle={3}
            stroke="#ffffff"
            strokeWidth={2}
            animationDuration={600}
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
        <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
          {centerValue}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">
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
  <div className="space-y-2 mt-4">
    {slices.map((s) => (
      <div key={s.name} className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2 text-slate-700 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: s.color }}
          />
          <span className="truncate font-medium">{s.name}</span>
        </span>
        <span className="shrink-0 flex items-center gap-2">
          <span className="text-slate-400 font-normal">
            {total > 0 ? Math.round((s.value / total) * 100) : 0}%
          </span>
          <span className="text-slate-900 font-semibold">{formatCurrency(s.value)}</span>
        </span>
      </div>
    ))}
  </div>
);
