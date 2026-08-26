export enum PortType {
  TEXT = 'text',
  IMAGE = 'image',
}

export enum NodeType {
  PROMPT = 'prompt',
  IMAGE_INPUT = 'image-input',
  GENERATE_IMAGE = 'generate-image',
  EDIT_IMAGE = 'edit-image',
  RESULT = 'result',
}

export enum JobStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum WorkflowRunStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface NodePort {
  id: string;
  name: string;
  type: PortType;
}

export interface NodeData {
  label?: string;
  prompt?: string;
  imageUrl?: string;
  presetId?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  cfgScale?: number;
  steps?: number;
  strength?: number;
  jobStatus?: JobStatus;
  jobOutput?: Record<string, any>;
  jobError?: string;
  jobDurationMs?: number;
  retryCount?: number;
  [key: string]: any;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface CanvasEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
