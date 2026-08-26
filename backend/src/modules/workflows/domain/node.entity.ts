import { NodeType } from './port-type.enum';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeDataPayload {
  label?: string;
  prompt?: string;
  imageUrl?: string;
  presetId?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  cfgScale?: number;
  steps?: number;
  strength?: number;
  [key: string]: any;
}

export class WorkflowNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: NodeDataPayload;

  constructor(partial: Partial<WorkflowNode>) {
    Object.assign(this, partial);
    this.data = this.data || {};
    this.position = this.position || { x: 0, y: 0 };
  }
}
