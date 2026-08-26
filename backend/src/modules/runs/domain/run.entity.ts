import { WorkflowRunStatus } from './run-status.enum';
import { NodeJob } from './node-job.entity';
import { WorkflowNode } from '../../workflows/domain/node.entity';
import { WorkflowEdge } from '../../workflows/domain/edge.entity';

export class WorkflowRun {
  id: string;
  workflowId?: string;
  workflowName?: string;
  status: WorkflowRunStatus;
  graph: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  executionWaves: string[][];
  jobs: Record<string, NodeJob>;
  totalDurationMs?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  constructor(partial: Partial<WorkflowRun>) {
    Object.assign(this, partial);
    this.status = this.status || WorkflowRunStatus.QUEUED;
    this.jobs = this.jobs || {};
    this.executionWaves = this.executionWaves || [];
    this.createdAt = this.createdAt || new Date().toISOString();
    this.updatedAt = this.updatedAt || new Date().toISOString();
  }
}
