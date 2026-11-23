import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassTooltip } from './GlassTooltip.js';
import { formatCompact } from './chartTheme.js';

export interface TopClient {
  id: string;
  name: string;
  revenue: number;
}

const truncate = (v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v);

export const TopClientsChart: React.FC<{ data: TopClient[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-xs text-slate-500">No invoiced clients yet</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
        >
          <defs>
            <linearGradient id="clientBarGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.12)"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={130}
            tickFormatter={truncate}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="url(#clientBarGrad)"
            radius={[0, 6, 6, 0]}
            barSize={16}
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
