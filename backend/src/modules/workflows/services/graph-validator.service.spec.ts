import { GraphValidatorService } from './graph-validator.service';
import { NodeType } from '../domain/port-type.enum';
import { ValidateGraphDto } from '../dto/validate-graph.dto';

describe('GraphValidatorService', () => {
  let service: GraphValidatorService;

  beforeEach(() => {
    service = new GraphValidatorService();
  });

  it('should validate a correct linear workflow (Scenario 1)', () => {
    const validGraph = {
      nodes: [
        {
          id: 'prompt-1',
          type: NodeType.PROMPT,
          position: { x: 0, y: 0 },
          data: { prompt: 'cyberpunk street' },
        },
        {
          id: 'gen-1',
          type: NodeType.GENERATE_IMAGE,
          position: { x: 200, y: 0 },
          data: {},
        },
        {
          id: 'res-1',
          type: NodeType.RESULT,
          position: { x: 400, y: 0 },
          data: {},
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'prompt-1',
          sourceHandle: 'text-out',
          target: 'gen-1',
          targetHandle: 'text-in',
        },
        {
          id: 'e2',
          source: 'gen-1',
          sourceHandle: 'image-out',
          target: 'res-1',
          targetHandle: 'image-in',
        },
      ],
    };

    const result = service.validate(validGraph as unknown as ValidateGraphDto);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.executionWaves).toEqual([['prompt-1'], ['gen-1'], ['res-1']]);
  });

  it('should detect and reject circular dependencies (cycles in graph)', () => {
    const cyclicGraph = {
      nodes: [
        {
          id: 'node-a',
          type: NodeType.PROMPT,
          position: { x: 0, y: 0 },
          data: {},
        },
        {
          id: 'node-b',
          type: NodeType.GENERATE_IMAGE,
          position: { x: 200, y: 0 },
          data: {},
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'node-a',
          sourceHandle: 'text-out',
          target: 'node-b',
          targetHandle: 'text-in',
        },
        {
          id: 'e2',
          source: 'node-b',
          sourceHandle: 'image-out',
          target: 'node-a',
          targetHandle: 'text-in',
        },
      ],
    };

    const result = service.validate(cyclicGraph as unknown as ValidateGraphDto);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'CYCLE_DETECTED')).toBe(true);
  });

  it('should reject incompatible port types (image output connected to text input)', () => {
    const incompatibleGraph = {
      nodes: [
        {
          id: 'img-node',
          type: NodeType.IMAGE_INPUT,
          position: { x: 0, y: 0 },
          data: {},
        },
        {
          id: 'gen-node',
          type: NodeType.GENERATE_IMAGE,
          position: { x: 200, y: 0 },
          data: {},
        },
      ],
      edges: [
        {
          id: 'bad-edge',
          source: 'img-node',
          sourceHandle: 'image-out',
          target: 'gen-node',
          targetHandle: 'text-in', // Image to Text -> INCOMPATIBLE!
        },
      ],
    };

    const result = service.validate(incompatibleGraph as unknown as ValidateGraphDto);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INCOMPATIBLE_PORTS')).toBe(true);
  });
});
