import React from 'react';
import { cn } from '../lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'port-text'
    | 'port-image';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-panel-subtle text-text-muted border-border',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    error: 'bg-rose-950/60 text-rose-400 border-rose-800/50',
    info: 'bg-blue-950/60 text-blue-400 border-blue-800/50',
    'port-text': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'port-image': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border select-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
