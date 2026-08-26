import { DagScheduler } from './dag-scheduler';
import { NodeType } from '../../workflows/domain/port-type.enum';
import { Workflow } from '../../workflows/domain/workflow.entity';
import { WorkflowEdge } from '../../workflows/domain/edge.entity';

describe('DagScheduler', () => {
  it('should schedule parallel branches in the same execution wave', () => {
    // Branching graph:
    //                   ┌→ Generate A → Result A
    // Prompt ───────────┤
    //                   └→ Generate B → Result B
    const graph = {
      nodes: [
        { id: 'prompt', type: NodeType.PROMPT, position: { x: 0, y: 0 }, data: {} },
        { id: 'gen-a', type: NodeType.GENERATE_IMAGE, position: { x: 0, y: 0 }, data: {} },
        { id: 'gen-b', type: NodeType.GENERATE_IMAGE, position: { x: 0, y: 0 }, data: {} },
        { id: 'res-a', type: NodeType.RESULT, position: { x: 0, y: 0 }, data: {} },
        { id: 'res-b', type: NodeType.RESULT, position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'prompt', target: 'gen-a' },
        { id: 'e2', source: 'prompt', target: 'gen-b' },
        { id: 'e3', source: 'gen-a', target: 'res-a' },
        { id: 'e4', source: 'gen-b', target: 'res-b' },
      ],
    };

    const waves = DagScheduler.buildExecutionWaves(graph as unknown as Workflow);

    expect(waves).toHaveLength(3);
    expect(waves[0]).toEqual(['prompt']);
    // Wave 1 must contain BOTH gen-a and gen-b so they execute in parallel!
    expect(waves[1].sort()).toEqual(['gen-a', 'gen-b'].sort());
    // Wave 2 must contain BOTH res-a and res-b
    expect(waves[2].sort()).toEqual(['res-a', 'res-b'].sort());
  });

  it('should find downstream subtree node IDs for retry', () => {
    const edges = [
      { id: 'e1', source: 'prompt', target: 'gen-a' },
      { id: 'e2', source: 'prompt', target: 'gen-b' },
      { id: 'e3', source: 'gen-a', target: 'res-a' },
      { id: 'e4', source: 'gen-b', target: 'res-b' },
    ];

    const downstreamA = DagScheduler.getDownstreamNodeIds(
      'gen-a',
      edges as unknown as WorkflowEdge[],
    );
    expect(Array.from(downstreamA)).toEqual(['res-a']);

    const downstreamPrompt = DagScheduler.getDownstreamNodeIds(
      'prompt',
      edges as unknown as WorkflowEdge[],
    );
    expect(Array.from(downstreamPrompt).sort()).toEqual(
      ['gen-a', 'gen-b', 'res-a', 'res-b'].sort(),
    );
  });
});
