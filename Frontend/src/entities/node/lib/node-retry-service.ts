import { CustomNodeType } from '../model/types';
import { JobStatus, NodeJobOutput } from '../../../shared/types/graph';
import { RunEventMessage } from '../../../shared/types/api';
import { subscribeToRunEvents } from '../../../shared/api/sse';
import { runApi } from '../../run/api/run-api';
import { toast } from '../../../shared/ui';

export interface RetryServiceContext {
  nodes: CustomNodeType[];
  activeRunId: string | null;
  setActiveRunId: (id: string | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  updateNodeJob: (
    nodeId: string,
    status: JobStatus,
    output?: NodeJobOutput,
    error?: string,
    durationMs?: number,
  ) => void;
}

export async function executeNodeRetry(nodeId: string, ctx: RetryServiceContext): Promise<void> {
  const { nodes, activeRunId, setActiveRunId, setIsExecuting, updateNodeJob } = ctx;
  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) {
    toast.error(`Node ${nodeId} not found in workflow`, 'Retry Error');
    return;
  }

  let runId = activeRunId;
  if (!runId) {
    try {
      const pastRuns = await runApi.getAll();
      if (pastRuns && pastRuns.length > 0) {
        runId = pastRuns[0].id;
        setActiveRunId(runId);
      }
    } catch (err) {
      console.warn('Could not fetch past runs:', err);
    }
  }

  if (!runId) {
    toast.warning('No active execution run found. Please run the workflow first.', 'Cannot Retry');
    return;
  }

  // 1. Optimistic UI update: Set retried node to RUNNING
  updateNodeJob(nodeId, JobStatus.RUNNING, undefined, undefined, undefined);
  setIsExecuting(true);
  toast.info(`Retrying node "${targetNode.data.label || nodeId}"...`, 'Node Retry');

  // 2. Map all current node data for backend synchronization
  const allNodesData: Record<string, Record<string, unknown>> = {};
  for (const node of nodes) {
    allNodesData[node.id] = { ...node.data };
  }

  const retryStartTime = new Date(Date.now() - 500).toISOString();

  // 3. Open SSE event stream to receive live execution updates for this retry attempt
  const unsubscribe = subscribeToRunEvents({
    runId,
    since: retryStartTime,
    onEvent: (event: RunEventMessage) => {
      switch (event.type) {
        case 'node_queued':
          if (event.nodeId) {
            updateNodeJob(event.nodeId, JobStatus.QUEUED, undefined, undefined, undefined);
          }
          break;

        case 'node_started':
          if (event.nodeId) {
            updateNodeJob(event.nodeId, JobStatus.RUNNING);
          }
          break;

        case 'node_success':
          if (event.nodeId) {
            let duration = 200;
            if (typeof event.durationMs === 'number') {
              duration = event.durationMs;
            }
            if (typeof event.data?.metadata?.generationDurationMs === 'number') {
              duration = event.data.metadata.generationDurationMs;
            }
            updateNodeJob(event.nodeId, JobStatus.SUCCESS, event.data, undefined, duration);
          }
          break;

        case 'node_error':
          if (event.nodeId) {
            updateNodeJob(
              event.nodeId,
              JobStatus.ERROR,
              undefined,
              event.message || 'Node execution failed',
              event.durationMs,
            );
            toast.error(event.message || `Node ${event.nodeId} failed`, 'Retry Failed');
          }
          break;

        case 'run_completed':
          setIsExecuting(false);
          toast.success(
            event.message || 'Workflow finished successfully after retry!',
            'Run Complete',
          );
          break;

        case 'run_failed':
          setIsExecuting(false);
          toast.error(event.message || 'Retry run failed', 'Run Failed');
          break;
      }
    },
    onError: (err) => {
      console.warn('SSE stream error during retry:', err);
    },
    onComplete: () => {
      setIsExecuting(false);
      unsubscribe();
    },
  });

  // 4. Trigger retry endpoint on backend
  try {
    await runApi.retryNode(runId, nodeId, targetNode.data as Record<string, unknown>, allNodesData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to trigger retry on server';
    updateNodeJob(nodeId, JobStatus.ERROR, undefined, errorMsg);
    setIsExecuting(false);
    unsubscribe();
    toast.error(errorMsg, 'Retry Failed');
  }
}
