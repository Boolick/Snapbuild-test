import React from 'react';
import { cn } from '../lib/utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full bg-[#080b0e] border border-border rounded-lg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50 cursor-pointer',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-panel text-text">
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);

Select.displayName = 'Select';
