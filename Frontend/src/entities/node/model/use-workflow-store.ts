import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';
import { CustomNodeType, CustomEdgeType } from './types';
import {
  NodeType,
  JobStatus,
  WorkflowTemplate,
  CanvasNode,
  NodeJobOutput,
} from '../../../shared/types/graph';
import { Preset, WorkflowRunSnapshot } from '../../../shared/types/api';
import { validateConnection } from '../../../shared/lib/graph/port-validator';
import { DEFAULT_NODE_POSITIONS, INITIAL_NODE_DATA } from './initial-node-data';

interface WorkflowState {
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  selectedNodeId: string | null;

  activeRunId: string | null;
  activeRun: WorkflowRunSnapshot | null;
  isExecuting: boolean;
  validationError: string | null;

  presets: Preset[];
  isPresetDrawerOpen: boolean;
  targetPresetNodeId: string | null;

  setNodes: (nodes: CustomNodeType[]) => void;
  setEdges: (edges: CustomEdgeType[]) => void;
  onNodesChange: (changes: NodeChange<CustomNodeType>[]) => void;
  onEdgesChange: (changes: EdgeChange<CustomEdgeType>[]) => void;
  onConnect: (connection: Connection) => boolean;

  addNode: (type: NodeType, position?: { x: number; y: number }) => string;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;

  loadTemplate: (template: WorkflowTemplate) => void;
  clearGraph: () => void;

  setPresets: (presets: Preset[]) => void;
  openPresetDrawer: (nodeId?: string) => void;
  closePresetDrawer: () => void;
  applyPresetToNode: (nodeId: string, preset: Preset) => void;

  setActiveRunId: (runId: string | null) => void;
  setActiveRun: (run: WorkflowRunSnapshot | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setValidationError: (err: string | null) => void;
  updateNodeJob: (
    nodeId: string,
    status: JobStatus,
    output?: NodeJobOutput,
    error?: string,
    durationMs?: number,
  ) => void;
  resetAllJobStatuses: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  activeRunId: null,
  activeRun: null,
  isExecuting: false,
  validationError: null,

  presets: [],
  isPresetDrawerOpen: false,
  targetPresetNodeId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return false;
    }

    const validation = validateConnection(
      sourceNode as unknown as CanvasNode,
      connection.sourceHandle,
      targetNode as unknown as CanvasNode,
      connection.targetHandle,
    );

    if (!validation.isValid) {
      set({ validationError: validation.reason || 'Invalid connection' });
      setTimeout(() => set({ validationError: null }), 4000);
      return false;
    }

    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: {
            stroke: validation.sourceType === 'image' ? '#a78bfa' : '#60a5fa',
            strokeWidth: 2,
          },
        },
        edges,
      ),
      validationError: null,
    });

    return true;
  },

  addNode: (type: NodeType, position) => {
    const id = `${type}-${Date.now().toString(36)}`;
    const newNode: CustomNodeType = {
      id,
      type,
      position: position || DEFAULT_NODE_POSITIONS[type] || { x: 250, y: 250 },
      data: { ...(INITIAL_NODE_DATA[type] || { label: type, jobStatus: JobStatus.IDLE }) },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
    }));

    return id;
  },

  updateNodeData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      }),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }));
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  loadTemplate: (template) => {
    const formattedNodes: CustomNodeType[] = template.nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        jobStatus: JobStatus.IDLE,
      },
    }));

    const formattedEdges: CustomEdgeType[] = template.edges.map((e) => ({
      ...e,
      animated: true,
      style: { stroke: '#7d8cff', strokeWidth: 2 },
    }));

    set({
      nodes: formattedNodes,
      edges: formattedEdges,
      selectedNodeId: null,
      activeRunId: null,
      activeRun: null,
      isExecuting: false,
      validationError: null,
    });
  },

  clearGraph: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      activeRunId: null,
      activeRun: null,
      isExecuting: false,
    });
  },

  setPresets: (presets) => set({ presets }),

  openPresetDrawer: (nodeId) =>
    set({ isPresetDrawerOpen: true, targetPresetNodeId: nodeId || null }),

  closePresetDrawer: () => set({ isPresetDrawerOpen: false, targetPresetNodeId: null }),

  applyPresetToNode: (nodeId, preset) => {
    get().updateNodeData(nodeId, {
      presetId: preset.id,
      aspectRatio: preset.defaultParams?.aspectRatio || '1:1',
      style: preset.defaultParams?.style,
    });
    set({ isPresetDrawerOpen: false, targetPresetNodeId: null });
  },

  setActiveRunId: (runId) => set({ activeRunId: runId }),
  setActiveRun: (run) => set({ activeRun: run }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setValidationError: (err) => set({ validationError: err }),

  updateNodeJob: (nodeId, status, output, error, durationMs) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              jobStatus: status,
              jobOutput: output !== undefined ? output : node.data.jobOutput,
              jobError: error,
              jobDurationMs: durationMs,
            },
          };
        }
        return node;
      }),
    }));
  },

  resetAllJobStatuses: () => {
    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          jobStatus: JobStatus.IDLE,
          jobError: undefined,
          jobDurationMs: undefined,
        },
      })),
      isExecuting: false,
    }));
  },
}));
