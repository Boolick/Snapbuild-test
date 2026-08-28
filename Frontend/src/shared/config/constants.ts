import { NodeType, PortType, NodePort } from '../types/graph';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const PORT_COLORS: Record<PortType, string> = {
  [PortType.TEXT]: '#60a5fa', // Blue
  [PortType.IMAGE]: '#a78bfa', // Purple
};

export interface NodeSchema {
  type: NodeType;
  label: string;
  category: 'input' | 'generation' | 'transform' | 'output';
  description: string;
  inputs: NodePort[];
  outputs: NodePort[];
  accentColor: string;
}

export const NODE_SCHEMAS: Record<NodeType, NodeSchema> = {
  [NodeType.PROMPT]: {
    type: NodeType.PROMPT,
    label: 'Prompt Input',
    category: 'input',
    description: 'Master text prompt input for generation or editing instructions',
    inputs: [],
    outputs: [{ id: 'text-out', name: 'Text Output', type: PortType.TEXT }],
    accentColor: '#3b82f6',
  },
  [NodeType.IMAGE_INPUT]: {
    type: NodeType.IMAGE_INPUT,
    label: 'Image Input',
    category: 'input',
    description: 'Source image loader (URL or uploaded asset)',
    inputs: [],
    outputs: [{ id: 'image-out', name: 'Image Output', type: PortType.IMAGE }],
    accentColor: '#8b5cf6',
  },
  [NodeType.GENERATE_IMAGE]: {
    type: NodeType.GENERATE_IMAGE,
    label: 'AI Generator',
    category: 'generation',
    description: 'Generates images via AI using prompt, presets, and aspect ratios',
    inputs: [{ id: 'text-in', name: 'Prompt Input', type: PortType.TEXT }],
    outputs: [{ id: 'image-out', name: 'Generated Image', type: PortType.IMAGE }],
    accentColor: '#7d8cff',
  },
  [NodeType.EDIT_IMAGE]: {
    type: NodeType.EDIT_IMAGE,
    label: 'AI Image Editor',
    category: 'transform',
    description: 'Edits, enhances or styles an input image guided by prompt instructions',
    inputs: [
      { id: 'image-in', name: 'Source Image', type: PortType.IMAGE },
      { id: 'text-in', name: 'Instruction Prompt', type: PortType.TEXT },
    ],
    outputs: [{ id: 'image-out', name: 'Edited Image', type: PortType.IMAGE }],
    accentColor: '#ec4899',
  },
  [NodeType.RESULT]: {
    type: NodeType.RESULT,
    label: 'Result Preview',
    category: 'output',
    description: 'Displays the resulting AI generated image with preview and download',
    inputs: [{ id: 'image-in', name: 'Image Input', type: PortType.IMAGE }],
    outputs: [],
    accentColor: '#10b981',
  },
};

export const WORKFLOW_LIMITS = {
  MAX_TOTAL_NODES: 30,
  MAX_TOTAL_EDGES: 60,
  MAX_HEAVY_NODES: 10,
  MAX_NODES_PER_TYPE: {
    [NodeType.PROMPT]: 10,
    [NodeType.IMAGE_INPUT]: 10,
    [NodeType.GENERATE_IMAGE]: 6,
    [NodeType.EDIT_IMAGE]: 6,
    [NodeType.RESULT]: 10,
  },
};
