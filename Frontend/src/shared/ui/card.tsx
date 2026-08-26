import React from 'react';
import { cn } from '../lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, active = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-panel border border-border rounded-xl p-4 shadow-sm transition-all',
          active && 'border-brand shadow-brand/10 shadow-lg ring-1 ring-brand/50',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
