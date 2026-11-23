import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white border border-slate-200/90 rounded-xl shadow-xs ${
      hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-150' : ''
    } ${className}`}
  >
    {children}
  </div>
);
