import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodePort, PortType, JobStatus } from '../../../shared/types/graph';
import { NodeStatusBadge } from '../../run/ui/node-status-badge';
import { useWorkflowStore } from '../model/use-workflow-store';
import { cn } from '../../../shared/lib/utils/cn';
import { Trash2, RotateCw } from 'lucide-react';

export interface BaseNodeProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  accentColor?: string;
  selected?: boolean;
  inputs?: NodePort[];
  outputs?: NodePort[];
  jobStatus?: JobStatus;
  jobError?: string;
  jobDurationMs?: number;
  onRetry?: () => void | Promise<void>;
  children: React.ReactNode;
}

const getStatusAccentColor = (jobStatus?: JobStatus, defaultAccentColor?: string): string => {
  switch (jobStatus) {
    case JobStatus.RUNNING:
      return '#3b82f6';
    case JobStatus.ERROR:
      return '#ef4444';
    case JobStatus.SUCCESS:
      return '#10b981';
    default:
      return defaultAccentColor || '#6366f1';
  }
};

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  title,
  icon,
  accentColor = '#7d8cff',
  selected = false,
  inputs = [],
  outputs = [],
  jobStatus = JobStatus.IDLE,
  jobError,
  jobDurationMs,
  onRetry,
  children,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const handleRetryClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRetry || isRetrying) {
      return;
    }
    try {
      setIsRetrying(true);
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getHandleStyle = (portType: PortType) => ({
    width: '12px',
    height: '12px',
    backgroundColor: portType === PortType.IMAGE ? '#a78bfa' : '#60a5fa',
    border: '2px solid #11161b',
    borderRadius: '50%',
  });

  return (
    <div
      className={cn(
        'relative min-w-[280px] max-w-[340px] bg-panel/95 backdrop-blur-md border border-border rounded-xl shadow-xl transition-all duration-200',
        selected && 'border-brand ring-2 ring-brand/40 shadow-brand/20 shadow-2xl',
        jobStatus === JobStatus.RUNNING &&
          'border-blue-500/80 shadow-blue-500/20 shadow-2xl ring-1 ring-blue-400 animate-pulse-glow',
        jobStatus === JobStatus.SUCCESS && 'border-emerald-600/50',
        jobStatus === JobStatus.ERROR &&
          'border-rose-600/80 shadow-rose-500/20 shadow-xl ring-1 ring-rose-500/50',
      )}
    >
      {/* Accent color top border */}
      <div
        className="h-1 w-full rounded-t-xl"
        style={{ backgroundColor: getStatusAccentColor(jobStatus, accentColor) }}
      />

      {/* Target (Input) Handles */}
      {inputs.map((port, index) => {
        const topPercent =
          inputs.length === 1 ? '50%' : `${((index + 1) / (inputs.length + 1)) * 100}%`;

        return (
          <div
            key={port.id}
            className="absolute -left-3 flex items-center gap-1 group"
            style={{ top: topPercent, transform: 'translateY(-50%)' }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              style={getHandleStyle(port.type)}
            />
            <span
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/90 border border-border pointer-events-none whitespace-nowrap z-30',
                port.type === PortType.IMAGE ? 'text-purple-300' : 'text-blue-300',
              )}
            >
              {port.name} ({port.type})
            </span>
          </div>
        );
      })}

      {/* Source (Output) Handles */}
      {outputs.map((port, index) => {
        const topPercent =
          outputs.length === 1 ? '50%' : `${((index + 1) / (outputs.length + 1)) * 100}%`;

        return (
          <div
            key={port.id}
            className="absolute -right-3 flex items-center gap-1 group"
            style={{ top: topPercent, transform: 'translateY(-50%)' }}
          >
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              style={getHandleStyle(port.type)}
            />
            <span
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/90 border border-border pointer-events-none whitespace-nowrap z-30',
                port.type === PortType.IMAGE ? 'text-purple-300' : 'text-blue-300',
              )}
            >
              {port.name} ({port.type})
            </span>
          </div>
        );
      })}

      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/80 bg-panel-subtle/50 rounded-t-lg">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            {icon}
          </div>
          <h3 className="text-xs font-bold text-text truncate tracking-wide">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <NodeStatusBadge status={jobStatus} durationMs={jobDurationMs} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            className="text-text-dim hover:text-rose-400 p-1 rounded transition-colors"
            title="Delete node"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Node Body Content */}
      <div className="p-3.5 space-y-3 nodrag nowheel">{children}</div>

      {/* Error Alert with Retry button if failed */}
      {jobStatus === JobStatus.ERROR && (
        <div className="px-3.5 pb-3.5 pt-0">
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            <div className="font-semibold mb-1">Execution Error:</div>
            <p className="line-clamp-2 text-[11px] opacity-90">
              {jobError || 'Node processing failed.'}
            </p>
            {onRetry && (
              <button
                onClick={handleRetryClick}
                disabled={isRetrying}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-60 px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <RotateCw size={11} className={cn(isRetrying && 'animate-spin')} />
                {isRetrying ? 'Retrying...' : 'Retry this node'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
