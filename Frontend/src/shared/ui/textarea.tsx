import React from 'react';
import { cn } from '../lib/utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full bg-[#080b0e] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-none disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
