import { JobStatus, WorkflowRunStatus, NodeJobOutput } from './graph';

export interface Preset {
  id: string;
  name: string;
  description: string;
  mainPrompt: string;
  negativePrompt: string;
  references: string[];
  thumbnailUrl?: string;
  defaultParams?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
    style?: string;
    cfgScale?: number;
    steps?: number;
  };
}

export interface NodeJobStatus {
  nodeId: string;
  nodeType: string;
  status: JobStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  inputs?: Record<string, unknown>;
  outputs?: NodeJobOutput;
  error?: string;
  retryCount: number;
}

export interface WorkflowRunSnapshot {
  id: string;
  workflowName?: string;
  status: WorkflowRunStatus;
  executionWaves: string[][];
  jobs: Record<string, NodeJobStatus>;
  totalDurationMs?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface RunEventMessage {
  runId: string;
  type:
    | 'run_queued'
    | 'run_started'
    | 'node_queued'
    | 'node_started'
    | 'node_progress'
    | 'node_success'
    | 'node_error'
    | 'run_completed'
    | 'run_failed';
  timestamp: string;
  nodeId?: string;
  nodeType?: string;
  status?: JobStatus | WorkflowRunStatus;
  progress?: number;
  message?: string;
  durationMs?: number;
  data?: NodeJobOutput;
}

export interface GraphValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface GraphValidationResult {
  isValid: boolean;
  errors: GraphValidationError[];
  warnings: string[];
  executionWaves?: string[][];
}
