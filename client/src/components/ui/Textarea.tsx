import React from 'react';
import { inputBase } from './Input.js';

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...props
}) => (
  <textarea className={`${inputBase} min-h-[90px] resize-y ${className}`} {...props} />
);
