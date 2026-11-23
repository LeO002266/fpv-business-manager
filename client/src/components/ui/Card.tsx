import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => (
  <div className={`glass rounded-2xl ${hover ? 'glass-hover' : ''} ${className}`}>
    {children}
  </div>
);
