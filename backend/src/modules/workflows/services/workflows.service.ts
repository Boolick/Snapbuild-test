import { Injectable, NotFoundException } from '@nestjs/common';
import { Workflow } from '../domain/workflow.entity';
import { NodeType } from '../domain/port-type.enum';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { generateId } from '../../../common/utils/id-generator.util';

@Injectable()
export class WorkflowsService {
  private readonly templates: Map<string, Workflow> = new Map();

  constructor() {
    this.seedTemplates();
  }

  private seedTemplates(): void {
    // Scenario 1: [ Prompt ] -> [ Generate Image ] -> [ Result ]
    const scenario1 = new Workflow({
      id: 'template-scenario-1',
      name: 'Scenario 1: Text to Image Pipeline',
      description: 'Standard prompt input flowing to AI Image Generation and Result node',
      nodes: [
        {
          id: 'prompt-1',
          type: NodeType.PROMPT,
          position: { x: 100, y: 200 },
          data: {
            label: 'Prompt Input',
            prompt: 'A majestic cybernetic tiger walking in a neon rainforest at night',
          },
        },
        {
          id: 'generate-1',
          type: NodeType.GENERATE_IMAGE,
          position: { x: 450, y: 180 },
          data: {
            label: 'AI Generator (3D)',
            presetId: 'preset-premium-3d',
            aspectRatio: '1:1',
          },
        },
        {
          id: 'result-1',
          type: NodeType.RESULT,
          position: { x: 800, y: 180 },
          data: {
            label: 'Image Result Preview',
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
    });

    // Scenario 2: [ Image Input ] -> [ Edit Image ] -> [ Result ]
    const scenario2 = new Workflow({
      id: 'template-scenario-2',
      name: 'Scenario 2: Image Edit & Inpaint Pipeline',
      description: 'Image input and text instruction feeding into AI Image Editor',
      nodes: [
        {
          id: 'image-input-1',
          type: NodeType.IMAGE_INPUT,
          position: { x: 100, y: 140 },
          data: {
            label: 'Source Image',
            imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
          },
        },
        {
          id: 'prompt-edit-1',
          type: NodeType.PROMPT,
          position: { x: 100, y: 350 },
          data: {
            label: 'Edit Instruction',
            prompt: 'Add futuristic glowing neon glasses and metallic cybernetic armor',
          },
        },
        {
          id: 'edit-1',
          type: NodeType.EDIT_IMAGE,
          position: { x: 480, y: 220 },
          data: {
            label: 'AI Image Editor',
            strength: 0.75,
          },
        },
        {
          id: 'result-edit-1',
          type: NodeType.RESULT,
          position: { x: 850, y: 220 },
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
    });

    // Mandatory Scenario 3: Branching & Parallel Execution
    //                ┌→ [ Generate A ] → [ Result A ]
    // [ Prompt ] ────┤
    //                └→ [ Generate B ] → [ Result B ]
    const scenario3 = new Workflow({
      id: 'template-scenario-3',
      name: 'Scenario 3: Parallel Branching (Mandatory)',
      description: 'Single prompt branching concurrently into two different AI generators and results',
      nodes: [
        {
          id: 'prompt-branch-1',
          type: NodeType.PROMPT,
          position: { x: 80, y: 260 },
          data: {
            label: 'Shared Master Prompt',
            prompt: 'A futuristic electric hypercar speeding through a rainy metropolis at night',
          },
        },
        // Branch A
        {
          id: 'generate-a',
          type: NodeType.GENERATE_IMAGE,
          position: { x: 450, y: 100 },
          data: {
            label: 'Branch A: Cyberpunk Neon',
            presetId: 'preset-cyberpunk-neon',
            aspectRatio: '16:9',
          },
        },
        {
          id: 'result-a',
          type: NodeType.RESULT,
          position: { x: 820, y: 100 },
          data: {
            label: 'Result A (Cyberpunk)',
          },
        },
        // Branch B
        {
          id: 'generate-b',
          type: NodeType.GENERATE_IMAGE,
          position: { x: 450, y: 400 },
          data: {
            label: 'Branch B: Anime Fantasy',
            presetId: 'preset-anime-fantasy',
            aspectRatio: '16:9',
          },
        },
        {
          id: 'result-b',
          type: NodeType.RESULT,
          position: { x: 820, y: 400 },
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
    });

    this.templates.set(scenario1.id, scenario1);
    this.templates.set(scenario2.id, scenario2);
    this.templates.set(scenario3.id, scenario3);
  }

  getTemplates(): Workflow[] {
    return Array.from(this.templates.values());
  }

  getTemplateById(id: string): Workflow {
    const template = this.templates.get(id);
    if (!template) {
      throw new NotFoundException(`Workflow template "${id}" not found`);
    }
    return template;
  }
}
