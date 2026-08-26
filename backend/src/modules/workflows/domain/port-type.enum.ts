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

export interface NodePortDefinition {
  id: string;
  name: string;
  type: PortType;
}

export interface NodeTypeSchema {
  type: NodeType;
  label: string;
  category: 'input' | 'generation' | 'transform' | 'output';
  inputs: NodePortDefinition[];
  outputs: NodePortDefinition[];
}

export const NODE_SCHEMAS: Record<NodeType, NodeTypeSchema> = {
  [NodeType.PROMPT]: {
    type: NodeType.PROMPT,
    label: 'Prompt',
    category: 'input',
    inputs: [],
    outputs: [{ id: 'text-out', name: 'Text Output', type: PortType.TEXT }],
  },
  [NodeType.IMAGE_INPUT]: {
    type: NodeType.IMAGE_INPUT,
    label: 'Image Input',
    category: 'input',
    inputs: [],
    outputs: [{ id: 'image-out', name: 'Image Output', type: PortType.IMAGE }],
  },
  [NodeType.GENERATE_IMAGE]: {
    type: NodeType.GENERATE_IMAGE,
    label: 'Generate Image',
    category: 'generation',
    inputs: [{ id: 'text-in', name: 'Prompt Input', type: PortType.TEXT }],
    outputs: [{ id: 'image-out', name: 'Generated Image', type: PortType.IMAGE }],
  },
  [NodeType.EDIT_IMAGE]: {
    type: NodeType.EDIT_IMAGE,
    label: 'Edit Image',
    category: 'transform',
    inputs: [
      { id: 'image-in', name: 'Source Image', type: PortType.IMAGE },
      { id: 'text-in', name: 'Instruction Prompt', type: PortType.TEXT },
    ],
    outputs: [{ id: 'image-out', name: 'Edited Image', type: PortType.IMAGE }],
  },
  [NodeType.RESULT]: {
    type: NodeType.RESULT,
    label: 'Result',
    category: 'output',
    inputs: [{ id: 'image-in', name: 'Image Input', type: PortType.IMAGE }],
    outputs: [],
  },
};
