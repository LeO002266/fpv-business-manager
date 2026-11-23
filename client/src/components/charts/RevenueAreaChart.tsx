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
  <span className="flex items-center gap-1.5 text-slate-400">
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    {label}
  </span>
);

export const RevenueAreaChart: React.FC<{ data: MonthlyStat[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-xs text-slate-500">No monthly trend data yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Custom legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] mb-3">
        <LegendDot color={CHART_COLORS.revenue} label="Revenue" />
        <LegendDot color={CHART_COLORS.expenses} label="Expenses" />
        <span className="flex items-center gap-1.5 text-slate-400">
          <span
            className="w-3 border-t-2 border-dashed"
            style={{ borderColor: CHART_COLORS.profit }}
          />
          Profit
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.32} />
                <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.expenses} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART_COLORS.expenses} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.12)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatMonth}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompact}
            />
            <Tooltip
              content={<GlassTooltip />}
              cursor={{ stroke: 'rgba(148, 163, 184, 0.25)', strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={CHART_COLORS.revenue}
              strokeWidth={2.5}
              fill="url(#revenueAreaGrad)"
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={CHART_COLORS.expenses}
              strokeWidth={2.5}
              fill="url(#expenseAreaGrad)"
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke={CHART_COLORS.profit}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
