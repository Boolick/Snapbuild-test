export enum WorkflowRunStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum JobStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

export type RunEventType =
  | 'run_queued'
  | 'run_started'
  | 'node_queued'
  | 'node_started'
  | 'node_progress'
  | 'node_success'
  | 'node_error'
  | 'run_completed'
  | 'run_failed';

export interface RunEventPayload {
  runId: string;
  type: RunEventType;
  timestamp: string;
  nodeId?: string;
  nodeType?: string;
  status?: JobStatus | WorkflowRunStatus;
  progress?: number;
  message?: string;
  data?: unknown;
}
