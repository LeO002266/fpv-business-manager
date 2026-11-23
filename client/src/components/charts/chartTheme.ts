export const CHART_COLORS = {
  revenue: '#34d399',
  expenses: '#fb7185',
  profit: '#38bdf8',
  paid: '#34d399',
  partial: '#fbbf24',
  unpaid: '#38bdf8',
  overdue: '#fb7185',
  other: '#94a3b8',
};

export const DONUT_PALETTE = [
  '#34d399',
  '#38bdf8',
  '#fbbf24',
  '#fb7185',
  '#a78bfa',
  '#2dd4bf',
  '#f472b6',
  '#60a5fa',
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** '2026-01' → 'Jan' (or "Jan '25" when not the current year) */
export function formatMonth(m: string): string {
  const [y, mo] = String(m).split('-');
  const name = MONTH_NAMES[Number(mo) - 1] || m;
  const year = Number(y);
  if (year && year !== new Date().getFullYear()) {
    return `${name} '${String(year).slice(2)}`;
  }
  return name;
}

/** Compact Indian currency for axis ticks: ₹1.2L / ₹34k / ₹450 */
export function formatCompact(v: number): string {
  const n = Math.abs(v);
  if (n >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${v}`;
}
