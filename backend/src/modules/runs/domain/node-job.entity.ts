import { JobStatus } from './run-status.enum';

export class NodeJob {
  nodeId: string;
  nodeType: string;
  status: JobStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  retryCount: number;

  constructor(nodeId: string, nodeType: string) {
    this.nodeId = nodeId;
    this.nodeType = nodeType;
    this.status = JobStatus.IDLE;
    this.retryCount = 0;
  }
}
