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

  it('should find upstream ancestor node IDs', () => {
    const edges = [
      { id: 'e1', source: 'prompt', target: 'gen-a' },
      { id: 'e2', source: 'gen-a', target: 'edit-a' },
      { id: 'e3', source: 'edit-a', target: 'res-a' },
    ];

    const upstreamRes = DagScheduler.getUpstreamNodeIds(
      'res-a',
      edges as unknown as WorkflowEdge[],
    );
    expect(Array.from(upstreamRes).sort()).toEqual(['edit-a', 'gen-a', 'prompt'].sort());
  });

  it('should automatically resolve uncompleted upstream dependencies when retrying a leaf node', () => {
    // Scenario: User clicks retry on "res-b", but "gen-b" was queued/failed
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

    const jobStatuses = {
      prompt: { status: 'success', outputs: { text: 'anime' } },
      'gen-a': { status: 'success', outputs: { imageUrl: 'http://img-a' } },
      'gen-b': { status: 'queued' }, // Uncompleted!
      'res-a': { status: 'success', outputs: { imageUrl: 'http://img-a' } },
      'res-b': { status: 'error' }, // Target to retry
    };

    const retryNodes = DagScheduler.resolveRetryNodeIds(
      'res-b',
      graph as unknown as Workflow,
      jobStatuses,
    );

    // Must include BOTH gen-b (to produce the image) AND res-b!
    expect(Array.from(retryNodes).sort()).toEqual(['gen-b', 'res-b'].sort());
  });

  it('should re-execute the entire subtree when an upstream prompt node has changed', () => {
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

    const jobStatuses = {
      prompt: { status: 'success', outputs: { text: 'new prompt' } },
      'gen-a': { status: 'error' },
      'gen-b': { status: 'queued' },
      'res-a': { status: 'queued' },
      'res-b': { status: 'queued' },
    };

    const changedNodeIds = new Set(['prompt']);
    const retryNodes = DagScheduler.resolveRetryNodeIds(
      'gen-a',
      graph as unknown as Workflow,
      jobStatuses,
      changedNodeIds,
    );

    // Because prompt changed, prompt and all its descendants are scheduled
    expect(Array.from(retryNodes).sort()).toEqual(
      ['prompt', 'gen-a', 'gen-b', 'res-a', 'res-b'].sort(),
    );
  });
});
