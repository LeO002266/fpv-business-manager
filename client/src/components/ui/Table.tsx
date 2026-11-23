import React from 'react';

export const Table: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <table className={`w-full text-left text-xs ${className}`}>{children}</table>;

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>{children}</thead>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
);

export const Tr: React.FC<
  React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }
> = ({ className = '', children, ...rest }) => (
  <tr className={`transition-colors hover:bg-white/[0.03] ${className}`} {...rest}>
    {children}
  </tr>
);

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  className = '',
  children,
}) => (
  <th
    className={`pb-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06] ${className}`}
  >
    {children}
  </th>
);

export const Td: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }
> = ({ className = '', children, ...rest }) => (
  <td className={`py-3 ${className}`} {...rest}>
    {children}
  </td>
);
