import { WorkflowNode } from '../../workflows/domain/node.entity';
import { WorkflowEdge } from '../../workflows/domain/edge.entity';

export interface SchedulerGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export class DagScheduler {
  /**
   * Partitions DAG nodes into topological execution waves.
   * Nodes in the same wave have zero inter-dependencies and can be executed concurrently in parallel.
   */
  static buildExecutionWaves(graph: SchedulerGraph): string[][] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of graph.edges) {
      if (inDegree.has(edge.target)) {
        inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
      }
      if (adjacency.has(edge.source)) {
        adjacency.get(edge.source)!.push(edge.target);
      }
    }

    const waves: string[][] = [];
    let currentWave = graph.nodes.filter((n) => (inDegree.get(n.id) || 0) === 0).map((n) => n.id);

    const visited = new Set<string>();

    while (currentWave.length > 0) {
      waves.push(currentWave);
      for (const id of currentWave) {
        visited.add(id);
      }

      const nextWaveCandidates: string[] = [];

      for (const nodeId of currentWave) {
        const neighbors = adjacency.get(nodeId) || [];
        for (const neighbor of neighbors) {
          const currentDeg = inDegree.get(neighbor) || 0;
          const updatedDeg = Math.max(0, currentDeg - 1);
          inDegree.set(neighbor, updatedDeg);
          if (updatedDeg === 0 && !visited.has(neighbor)) {
            nextWaveCandidates.push(neighbor);
          }
        }
      }

      // Filter unique
      currentWave = Array.from(new Set(nextWaveCandidates));
    }

    return waves;
  }

  /**
   * Identifies all downstream dependent nodes of a given node (transitive closure).
   * Useful when retrying a failed node to re-execute all downstream affected nodes.
   */
  static getDownstreamNodeIds(nodeId: string, edges: WorkflowEdge[]): Set<string> {
    const downstream = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoingEdges = edges.filter((e) => e.source === current);
      for (const edge of outgoingEdges) {
        if (!downstream.has(edge.target)) {
          downstream.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    return downstream;
  }

  /**
   * Identifies all upstream prerequisite nodes of a given node (transitive ancestors).
   */
  static getUpstreamNodeIds(nodeId: string, edges: WorkflowEdge[]): Set<string> {
    const upstream = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const incomingEdges = edges.filter((e) => e.target === current);
      for (const edge of incomingEdges) {
        if (!upstream.has(edge.source)) {
          upstream.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    return upstream;
  }

  /**
   * Resolves the complete set of node IDs that must execute for a retry:
   * 1. The target node itself.
   * 2. Any directly or transitively upstream ancestor that is NOT in SUCCESS state or is missing outputs.
   * 3. Any node whose data or parameters changed.
   * 4. All downstream descendants of any node scheduled for execution.
   */
  static resolveRetryNodeIds(
    targetNodeId: string,
    graph: SchedulerGraph,
    jobStatuses: Record<string, { status: string; outputs?: Record<string, unknown> }>,
    changedNodeIds?: Set<string>,
  ): Set<string> {
    const nodesToExecute = new Set<string>([targetNodeId]);

    if (changedNodeIds) {
      for (const id of changedNodeIds) {
        nodesToExecute.add(id);
      }
    }

    // 1. Expand upstream: Any node that needs to run requires all its upstream dependencies to be SUCCESS.
    // If any upstream dependency is NOT in SUCCESS (e.g. queued, error, or empty output), it MUST run too.
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const nodeId of Array.from(nodesToExecute)) {
        const upstream = this.getUpstreamNodeIds(nodeId, graph.edges);
        for (const upId of upstream) {
          const job = jobStatuses[upId];
          const hasOutput = job?.outputs && Object.keys(job.outputs).length > 0;
          const isSuccessful = job?.status === 'success' && hasOutput;
          if (!isSuccessful && !nodesToExecute.has(upId)) {
            nodesToExecute.add(upId);
            expanded = true;
          }
        }
      }
    }

    // 2. Expand downstream: Any node scheduled to execute will produce new outputs,
    // so ALL its downstream descendants MUST be re-executed as well.
    for (const nodeId of Array.from(nodesToExecute)) {
      const downstream = this.getDownstreamNodeIds(nodeId, graph.edges);
      for (const downId of downstream) {
        nodesToExecute.add(downId);
      }
    }

    return nodesToExecute;
  }
}
