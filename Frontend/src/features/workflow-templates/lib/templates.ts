import { WorkflowTemplate, NodeType } from '../../../shared/types/graph';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-scenario-1',
    name: 'Scenario 1: Text to Image',
    description: '[ Prompt ] → [ Generate Image ] → [ Result ]',
    nodes: [
      {
        id: 'prompt-1',
        type: NodeType.PROMPT,
        position: { x: 100, y: 220 },
        data: {
          label: 'Master Prompt',
          prompt: 'A futuristic cybernetic tiger in a vibrant neon rain forest, 8k resolution',
        },
      },
      {
        id: 'generate-1',
        type: NodeType.GENERATE_IMAGE,
        position: { x: 480, y: 190 },
        data: {
          label: 'AI Generator',
          presetId: 'preset-premium-3d',
          aspectRatio: '1:1',
        },
      },
      {
        id: 'result-1',
        type: NodeType.RESULT,
        position: { x: 860, y: 190 },
        data: {
          label: 'Result Preview',
        },
      },
    ],
    edges: [
      {
        id: 'e-p1-g1',
        source: 'prompt-1',
        sourceHandle: 'text-out',
        target: 'generate-1',
        targetHandle: 'text-in',
      },
      {
        id: 'e-g1-r1',
        source: 'generate-1',
        sourceHandle: 'image-out',
        target: 'result-1',
        targetHandle: 'image-in',
      },
    ],
  },
  {
    id: 'template-scenario-2',
    name: 'Scenario 2: Image Edit & Inpaint',
    description: '[ Image Input ] + [ Prompt ] → [ Edit Image ] → [ Result ]',
    nodes: [
      {
        id: 'image-input-1',
        type: NodeType.IMAGE_INPUT,
        position: { x: 100, y: 120 },
        data: {
          label: 'Source Image',
          imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
        },
      },
      {
        id: 'prompt-edit-1',
        type: NodeType.PROMPT,
        position: { x: 100, y: 380 },
        data: {
          label: 'Edit Instruction',
          prompt: 'Add futuristic glowing neon glasses and robotic cybernetic armor',
        },
      },
      {
        id: 'edit-1',
        type: NodeType.EDIT_IMAGE,
        position: { x: 500, y: 220 },
        data: {
          label: 'AI Image Editor',
          strength: 0.75,
        },
      },
      {
        id: 'result-edit-1',
        type: NodeType.RESULT,
        position: { x: 880, y: 220 },
        data: {
          label: 'Edited Result Preview',
        },
      },
    ],
    edges: [
      {
        id: 'e-img-edit',
        source: 'image-input-1',
        sourceHandle: 'image-out',
        target: 'edit-1',
        targetHandle: 'image-in',
      },
      {
        id: 'e-prompt-edit',
        source: 'prompt-edit-1',
        sourceHandle: 'text-out',
        target: 'edit-1',
        targetHandle: 'text-in',
      },
      {
        id: 'e-edit-res',
        source: 'edit-1',
        sourceHandle: 'image-out',
        target: 'result-edit-1',
        targetHandle: 'image-in',
      },
    ],
  },
  {
    id: 'template-scenario-3',
    name: 'Scenario 3: Parallel Branching (Mandatory)',
    description:
      '[ Prompt ] ──┬→ [ Generate A ] → [ Result A ]\n            └→ [ Generate B ] → [ Result B ]',
    nodes: [
      {
        id: 'prompt-branch-1',
        type: NodeType.PROMPT,
        position: { x: 80, y: 280 },
        data: {
          label: 'Shared Master Prompt',
          prompt:
            'An electric hypercar speeding through a rainy metropolis at night with volumetric reflections',
        },
      },
      // Branch A
      {
        id: 'generate-a',
        type: NodeType.GENERATE_IMAGE,
        position: { x: 480, y: 80 },
        data: {
          label: 'Branch A: Cyberpunk Neon',
          presetId: 'preset-cyberpunk-neon',
          aspectRatio: '16:9',
        },
      },
      {
        id: 'result-a',
        type: NodeType.RESULT,
        position: { x: 870, y: 80 },
        data: {
          label: 'Result A (Cyberpunk)',
        },
      },
      // Branch B
      {
        id: 'generate-b',
        type: NodeType.GENERATE_IMAGE,
        position: { x: 480, y: 440 },
        data: {
          label: 'Branch B: Anime Fantasy',
          presetId: 'preset-anime-fantasy',
          aspectRatio: '16:9',
        },
      },
      {
        id: 'result-b',
        type: NodeType.RESULT,
        position: { x: 870, y: 440 },
        data: {
          label: 'Result B (Anime)',
        },
      },
    ],
    edges: [
      // Branch A edges
      {
        id: 'e-p-ga',
        source: 'prompt-branch-1',
        sourceHandle: 'text-out',
        target: 'generate-a',
        targetHandle: 'text-in',
      },
      {
        id: 'e-ga-ra',
        source: 'generate-a',
        sourceHandle: 'image-out',
        target: 'result-a',
        targetHandle: 'image-in',
      },
      // Branch B edges
      {
        id: 'e-p-gb',
        source: 'prompt-branch-1',
        sourceHandle: 'text-out',
        target: 'generate-b',
        targetHandle: 'text-in',
      },
      {
        id: 'e-gb-rb',
        source: 'generate-b',
        sourceHandle: 'image-out',
        target: 'result-b',
        targetHandle: 'image-in',
      },
    ],
  },
];
