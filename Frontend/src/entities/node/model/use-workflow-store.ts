import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';
import { CustomNodeType, CustomEdgeType } from './types';
import { NodeType, JobStatus, WorkflowTemplate, NodeJobOutput } from '../../../shared/types/graph';
import { Preset, WorkflowRunSnapshot } from '../../../shared/types/api';
import { DEFAULT_NODE_POSITIONS, INITIAL_NODE_DATA } from './initial-node-data';
import { WORKFLOW_LIMITS } from '../../../shared/config/constants';
import {
  connectNodesSingleInput,
  reconnectNodeEdge,
  formatTemplateEdges,
} from '../lib/node-connection-helpers';
import { executeNodeRetry } from '../lib/node-retry-service';
import { toast } from '../../../shared/ui';

interface WorkflowState {
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  selectedNodeId: string | null;
  activeTemplateId: string | null;

  activeRunId: string | null;
  activeRun: WorkflowRunSnapshot | null;
  isExecuting: boolean;

  presets: Preset[];
  isPresetDrawerOpen: boolean;
  targetPresetNodeId: string | null;

  setNodes: (nodes: CustomNodeType[]) => void;
  setEdges: (edges: CustomEdgeType[]) => void;
  onNodesChange: (changes: NodeChange<CustomNodeType>[]) => void;
  onEdgesChange: (changes: EdgeChange<CustomEdgeType>[]) => void;
  onConnect: (connection: Connection) => boolean;
  onReconnect: (oldEdge: CustomEdgeType, newConnection: Connection) => boolean;

  addNode: (type: NodeType, position?: { x: number; y: number }) => string;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;

  loadTemplate: (template: WorkflowTemplate, silent?: boolean) => void;
  clearGraph: () => void;

  setPresets: (presets: Preset[]) => void;
  openPresetDrawer: (nodeId?: string) => void;
  closePresetDrawer: () => void;
  applyPresetToNode: (nodeId: string, preset: Preset) => void;

  setActiveRunId: (runId: string | null) => void;
  setActiveRun: (run: WorkflowRunSnapshot | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  updateNodeJob: (
    nodeId: string,
    status: JobStatus,
    output?: NodeJobOutput,
    error?: string,
    durationMs?: number,
  ) => void;
  resetAllJobStatuses: () => void;
  retryNode: (nodeId: string) => Promise<void>;
}

import { DEFAULT_PRESETS } from '../../preset/model/default-presets';

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  activeTemplateId: 'template-scenario-3',

  activeRunId: null,
  activeRun: null,
  isExecuting: false,

  presets: DEFAULT_PRESETS,
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
    const result = connectNodesSingleInput(connection, nodes, edges);
    if (result.success && result.edges) {
      set({ edges: result.edges });
      return true;
    }
    return false;
  },

  onReconnect: (oldEdge: CustomEdgeType, newConnection: Connection) => {
    const { nodes, edges } = get();
    const result = reconnectNodeEdge(oldEdge, newConnection, nodes, edges);
    if (result.success && result.edges) {
      set({ edges: result.edges });
      return true;
    }
    return false;
  },

  addNode: (type: NodeType, position) => {
    const { nodes } = get();

    if (nodes.length >= WORKFLOW_LIMITS.MAX_TOTAL_NODES) {
      toast.error(
        `Maximum workflow node limit reached (${WORKFLOW_LIMITS.MAX_TOTAL_NODES}). Delete some nodes to add more.`,
        'Node Limit Reached',
      );
      return '';
    }

    const currentTypeCount = nodes.filter((n) => n.type === type).length;
    const maxForType = WORKFLOW_LIMITS.MAX_NODES_PER_TYPE[type];
    if (maxForType && currentTypeCount >= maxForType) {
      toast.error(
        `Maximum limit for "${type}" nodes reached (${maxForType}).`,
        'Node Type Limit Reached',
      );
      return '';
    }

    if (type === NodeType.GENERATE_IMAGE || type === NodeType.EDIT_IMAGE) {
      const heavyCount = nodes.filter(
        (n) => n.type === NodeType.GENERATE_IMAGE || n.type === NodeType.EDIT_IMAGE,
      ).length;
      if (heavyCount >= WORKFLOW_LIMITS.MAX_HEAVY_NODES) {
        toast.error(
          `Maximum limit for AI generator/editor nodes reached (${WORKFLOW_LIMITS.MAX_HEAVY_NODES}).`,
          'AI Operations Limit Reached',
        );
        return '';
      }
    }

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

  loadTemplate: (template, silent = false) => {
    const formattedNodes: CustomNodeType[] = template.nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        jobStatus: JobStatus.IDLE,
      },
    }));

    const formattedEdges = formatTemplateEdges(template);

    set({
      nodes: formattedNodes,
      edges: formattedEdges,
      selectedNodeId: null,
      activeTemplateId: template.id,
      activeRunId: null,
      activeRun: null,
      isExecuting: false,
    });

    if (!silent) {
      toast.info(`Loaded ${template.name.split(':')[0]}`, 'Template Activated');
    }
  },

  clearGraph: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      activeTemplateId: null,
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
    toast.success(`Preset "${preset.name}" attached`, 'Preset Applied');
  },

  setActiveRunId: (runId) => set({ activeRunId: runId }),
  setActiveRun: (run) => set({ activeRun: run }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),

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

  retryNode: async (nodeId: string) => {
    const state = get();
    await executeNodeRetry(nodeId, {
      nodes: state.nodes,
      activeRunId: state.activeRunId,
      setActiveRunId: state.setActiveRunId,
      setIsExecuting: state.setIsExecuting,
      updateNodeJob: state.updateNodeJob,
    });
  },
}));
