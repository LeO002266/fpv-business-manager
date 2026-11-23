import React from 'react';

export const Table: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div className="overflow-x-auto w-full border border-slate-200 rounded-xl bg-white shadow-xs">
    <table className={`w-full text-left text-sm ${className}`}>{children}</table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">{children}</thead>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-slate-100">{children}</tbody>
);

export const Tr: React.FC<
  React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }
> = ({ className = '', children, ...rest }) => (
  <tr className={`transition-colors hover:bg-slate-50/80 ${className}`} {...rest}>
    {children}
  </tr>
);

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  className = '',
  children,
}) => (
  <th
    className={`py-3 px-4 font-semibold text-slate-700 text-xs tracking-wide ${className}`}
  >
    {children}
  </th>
);

export const Td: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }
> = ({ className = '', children, ...rest }) => (
  <td className={`py-3.5 px-4 text-slate-700 ${className}`} {...rest}>
    {children}
  </td>
);
