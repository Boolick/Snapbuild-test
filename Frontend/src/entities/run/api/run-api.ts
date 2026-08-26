import { apiClient } from '../../../shared/api/client';
import { WorkflowRunSnapshot } from '../../../shared/types/api';
import { CanvasNode, CanvasEdge } from '../../../shared/types/graph';

export interface ExecuteRunPayload {
  name?: string;
  workflowId?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const runApi = {
  execute: async (
    payload: ExecuteRunPayload,
  ): Promise<{
    runId: string;
    workflowName: string;
    status: string;
    executionWaves: string[][];
    createdAt: string;
  }> => {
    const response = await apiClient.post('/runs', payload);
    return response.data;
  },

  getById: async (id: string): Promise<WorkflowRunSnapshot> => {
    const response = await apiClient.get<WorkflowRunSnapshot>(`/runs/${id}`);
    return response.data;
  },

  getAll: async (): Promise<WorkflowRunSnapshot[]> => {
    const response = await apiClient.get<WorkflowRunSnapshot[]>('/runs');
    return response.data;
  },

  retryNode: async (
    runId: string,
    nodeId: string,
    dataOverrides?: Record<string, unknown>,
  ): Promise<{ runId: string; retriedNodeId: string; status: string }> => {
    const response = await apiClient.post(`/runs/${runId}/retry/${nodeId}`, {
      dataOverrides,
    });
    return response.data;
  },
};
