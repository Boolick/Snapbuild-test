import React from 'react';
import { WorkflowRunStatus } from '../../../shared/types/graph';
import { Badge } from '../../../shared/ui';
import { Clock, Play, CheckCircle2, XCircle, Ban } from 'lucide-react';

export interface RunStatusBadgeProps {
  status: WorkflowRunStatus | string;
}

export const RunStatusBadge: React.FC<RunStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case WorkflowRunStatus.QUEUED:
      return (
        <Badge variant="warning" className="gap-1">
          <Clock size={12} className="animate-pulse" /> Queued
        </Badge>
      );
    case WorkflowRunStatus.RUNNING:
      return (
        <Badge variant="info" className="gap-1 bg-blue-950/80 text-blue-300 border-blue-600/50">
          <Play size={12} className="fill-current animate-pulse" /> Running
        </Badge>
      );
    case WorkflowRunStatus.COMPLETED:
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 size={12} /> Completed
        </Badge>
      );
    case WorkflowRunStatus.FAILED:
      return (
        <Badge variant="error" className="gap-1">
          <XCircle size={12} /> Failed
        </Badge>
      );
    case WorkflowRunStatus.CANCELLED:
      return (
        <Badge variant="default" className="gap-1">
          <Ban size={12} /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
