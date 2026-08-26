import { useState, useCallback } from 'react';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { runApi } from '../../../entities/run/api/run-api';
import { subscribeToRunEvents } from '../../../shared/api/sse';
import { JobStatus, CanvasNode, CanvasEdge } from '../../../shared/types/graph';
import { RunEventMessage } from '../../../shared/types/api';

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
      setError('Please add at least one node to the workflow.');
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
                updateNodeJob(
                  event.nodeId,
                  JobStatus.SUCCESS,
                  event.data,
                  undefined,
                  event.data?.metadata?.generationDurationMs || 1200,
                );
              }
              break;

            case 'node_error':
              if (event.nodeId) {
                updateNodeJob(
                  event.nodeId,
                  JobStatus.ERROR,
                  undefined,
                  event.message || 'Execution failed',
                );
              }
              break;

            case 'run_completed':
              setIsExecuting(false);
              setLoading(false);
              break;

            case 'run_failed':
              setIsExecuting(false);
              setLoading(false);
              setError(event.message || 'Run failed');
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
    } catch (err: any) {
      setError(err.message || 'Failed to start workflow execution');
      setIsExecuting(false);
      setLoading(false);
      resetAllJobStatuses();
    }
  }, [nodes, edges, setIsExecuting, setActiveRunId, updateNodeJob, resetAllJobStatuses]);

  return { execute, loading, error };
}
