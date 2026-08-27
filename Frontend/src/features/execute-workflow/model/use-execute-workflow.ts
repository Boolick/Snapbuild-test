import { useState, useCallback } from 'react';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { runApi } from '../../../entities/run/api/run-api';
import { subscribeToRunEvents } from '../../../shared/api/sse';
import { JobStatus, CanvasNode, CanvasEdge } from '../../../shared/types/graph';
import { RunEventMessage } from '../../../shared/types/api';
import { toast } from '../../../shared/ui';

export function useExecuteWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setIsExecuting = useWorkflowStore((s) => s.setIsExecuting);
  const setActiveRunId = useWorkflowStore((s) => s.setActiveRunId);
  const updateNodeJob = useWorkflowStore((s) => s.updateNodeJob);
  const resetAllJobStatuses = useWorkflowStore((s) => s.resetAllJobStatuses);

  const execute = useCallback(async () => {
    if (nodes.length === 0) {
      toast.warning('Please add at least one node to the workflow.', 'Empty Workflow');
      return;
    }

    setLoading(true);
    setError(null);
    setIsExecuting(true);

    // Reset previous statuses to QUEUED
    for (const node of nodes) {
      updateNodeJob(node.id, JobStatus.QUEUED);
    }

    try {
      // 1. Submit workflow to backend
      const res = await runApi.execute({
        name: 'Workflow Canvas Run',
        nodes: nodes as unknown as CanvasNode[],
        edges: edges as unknown as CanvasEdge[],
      });

      setActiveRunId(res.runId);
      toast.info(`Workflow run ${res.runId} initiated`, 'Execution Started');

      // 2. Subscribe to real-time SSE stream
      const unsubscribe = subscribeToRunEvents({
        runId: res.runId,
        onEvent: (event: RunEventMessage) => {
          switch (event.type) {
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
                  event.message || 'Execution failed',
                  event.durationMs,
                );
                toast.error(event.message || `Node ${event.nodeId} failed`, 'Node Failed');
              }
              break;

            case 'run_completed':
              setIsExecuting(false);
              setLoading(false);
              toast.success(event.message || 'Workflow completed successfully!', 'Run Success');
              break;

            case 'run_failed':
              setIsExecuting(false);
              setLoading(false);
              setError(event.message || 'Run failed');
              toast.error(event.message || 'Workflow run failed', 'Run Failed');
              break;
          }
        },
        onError: (err) => {
          console.warn('SSE stream error, polling or fallback:', err);
        },
        onComplete: () => {
          setIsExecuting(false);
          setLoading(false);
          unsubscribe();
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start workflow execution';
      setError(errorMsg);
      setIsExecuting(false);
      setLoading(false);
      resetAllJobStatuses();
      toast.error(errorMsg, 'Execution Failed');
    }
  }, [nodes, edges, setIsExecuting, setActiveRunId, updateNodeJob, resetAllJobStatuses]);

  return { execute, loading, error };
}
