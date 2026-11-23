import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { GlassTooltip } from './GlassTooltip.js';
import { CHART_COLORS, formatMonth, formatCompact } from './chartTheme.js';

export interface MonthlyStat {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    {label}
  </span>
);

export const RevenueAreaChart: React.FC<{ data: MonthlyStat[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-sm text-slate-400">No monthly trend data recorded yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Custom legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs mb-4">
        <LegendDot color="#4f46e5" label="Revenue" />
        <LegendDot color="#f43f5e" label="Expenses" />
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span
            className="w-3 border-t-2 border-dashed border-emerald-500"
          />
          Net Profit
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompact}
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<GlassTooltip />} />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fill="url(#revenueAreaGrad)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#expenseAreaGrad)"
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#10b981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
