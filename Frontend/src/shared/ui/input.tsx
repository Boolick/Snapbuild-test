import React from 'react';
import { cn } from '../lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-[#080b0e] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
