import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassTooltip } from './GlassTooltip.js';
import { formatCompact } from './chartTheme.js';

export interface TopClient {
  id: string;
  name: string;
  revenue: number;
}

const truncate = (v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v);

export const TopClientsChart: React.FC<{ data: TopClient[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-slate-400">No invoiced clients recorded yet</p>
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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={130}
            tickFormatter={truncate}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#4f46e5"
            radius={[0, 4, 4, 0]}
            barSize={18}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
