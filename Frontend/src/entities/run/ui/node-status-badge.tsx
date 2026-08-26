import React from 'react';
import { JobStatus } from '../../../shared/types/graph';
import { Spinner } from '../../../shared/ui';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../../shared/lib/utils/cn';

export interface NodeStatusBadgeProps {
  status?: JobStatus;
  durationMs?: number;
  className?: string;
}

export const NodeStatusBadge: React.FC<NodeStatusBadgeProps> = ({
  status = JobStatus.IDLE,
  durationMs,
  className,
}) => {
  if (status === JobStatus.IDLE) {
    return null;
  }

  const formatDuration = (ms?: number) => {
    if (!ms) {
      return '';
    }
    return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  };

  switch (status) {
    case JobStatus.QUEUED:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 select-none animate-pulse',
            className,
          )}
        >
          <Clock size={11} /> Queued
        </span>
      );

    case JobStatus.RUNNING:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/40 select-none shadow-sm shadow-blue-500/20',
            className,
          )}
        >
          <Spinner size="sm" className="w-3 h-3 text-blue-400" /> Running
        </span>
      );

    case JobStatus.SUCCESS:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 select-none',
            className,
          )}
        >
          <CheckCircle2 size={11} /> Ready
          {durationMs && (
            <span className="text-[10px] opacity-70 ml-0.5">({formatDuration(durationMs)})</span>
          )}
        </span>
      );

    case JobStatus.ERROR:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/40 select-none animate-bounce',
            className,
          )}
        >
          <AlertCircle size={11} /> Error
        </span>
      );

    default:
      return null;
  }
};
