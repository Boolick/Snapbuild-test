import { NodeType, JobStatus } from '../../../shared/types/graph';

export const DEFAULT_NODE_POSITIONS: Record<NodeType, { x: number; y: number }> = {
  [NodeType.PROMPT]: { x: 100, y: 150 },
  [NodeType.IMAGE_INPUT]: { x: 100, y: 350 },
  [NodeType.GENERATE_IMAGE]: { x: 450, y: 150 },
  [NodeType.EDIT_IMAGE]: { x: 450, y: 350 },
  [NodeType.RESULT]: { x: 800, y: 250 },
};

export const INITIAL_NODE_DATA: Record<NodeType, Record<string, unknown>> = {
  [NodeType.PROMPT]: {
    label: 'Prompt Input',
    prompt: 'A futuristic city bathed in radiant holographic light',
    jobStatus: JobStatus.IDLE,
  },
  [NodeType.IMAGE_INPUT]: {
    label: 'Image Input',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    jobStatus: JobStatus.IDLE,
  },
  [NodeType.GENERATE_IMAGE]: {
    label: 'AI Generator',
    presetId: 'preset-premium-3d',
    aspectRatio: '1:1',
    jobStatus: JobStatus.IDLE,
  },
  [NodeType.EDIT_IMAGE]: {
    label: 'AI Image Editor',
    strength: 0.75,
    jobStatus: JobStatus.IDLE,
  },
  [NodeType.RESULT]: {
    label: 'Result Preview',
    jobStatus: JobStatus.IDLE,
  },
};
