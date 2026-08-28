import { Injectable, Logger } from '@nestjs/common';
import {
  ValidateGraphDto,
  ValidateGraphResponseDto,
  ValidationErrorDetail,
} from '../dto/validate-graph.dto';
import { NODE_SCHEMAS, NodeType } from '../domain/port-type.enum';
import { WORKFLOW_LIMITS } from '../domain/workflow-limits.constants';

@Injectable()
export class GraphValidatorService {
  private readonly logger = new Logger(GraphValidatorService.name);

  validate(graph: ValidateGraphDto): ValidateGraphResponseDto {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];

    // 0. Enforce Graph Node & Edge Quantity Limits (DoS Prevention)
    if (graph.nodes.length > WORKFLOW_LIMITS.MAX_TOTAL_NODES) {
      errors.push({
        code: 'LIMIT_EXCEEDED',
        message: `Graph exceeds maximum allowed node limit (${graph.nodes.length}/${WORKFLOW_LIMITS.MAX_TOTAL_NODES}).`,
      });
    }

    if (graph.edges.length > WORKFLOW_LIMITS.MAX_TOTAL_EDGES) {
      errors.push({
        code: 'LIMIT_EXCEEDED',
        message: `Graph exceeds maximum allowed edge limit (${graph.edges.length}/${WORKFLOW_LIMITS.MAX_TOTAL_EDGES}).`,
      });
    }

    // Count node types & heavy AI nodes
    const typeCounts: Record<string, number> = {};
    let heavyNodeCount = 0;

    for (const node of graph.nodes) {
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
      if (node.type === NodeType.GENERATE_IMAGE || node.type === NodeType.EDIT_IMAGE) {
        heavyNodeCount++;
      }
      const typeLimit = WORKFLOW_LIMITS.MAX_NODES_PER_TYPE[node.type];
      if (typeLimit && typeCounts[node.type] > typeLimit) {
        errors.push({
          code: 'LIMIT_EXCEEDED',
          message: `Too many nodes of type "${node.type}" (${typeCounts[node.type]}/${typeLimit}).`,
          nodeId: node.id,
        });
      }
    }

    if (heavyNodeCount > WORKFLOW_LIMITS.MAX_HEAVY_NODES) {
      errors.push({
        code: 'LIMIT_EXCEEDED',
        message: `Total AI generator and editor nodes exceed safety threshold (${heavyNodeCount}/${WORKFLOW_LIMITS.MAX_HEAVY_NODES}).`,
      });
    }

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    // 1. Verify that all edge endpoints refer to existing nodes
    for (const edge of graph.edges) {
      if (!nodeMap.has(edge.source)) {
        errors.push({
          code: 'UNKNOWN_NODE',
          message: `Edge ${edge.id} references non-existent source node "${edge.source}"`,
          edgeId: edge.id,
        });
      }
      if (!nodeMap.has(edge.target)) {
        errors.push({
          code: 'UNKNOWN_NODE',
          message: `Edge ${edge.id} references non-existent target node "${edge.target}"`,
          edgeId: edge.id,
        });
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // 2. Validate Single-Input (Target Port Occupancy) and Port Type Compatibility
    const targetPortOccupancy = new Map<string, string>(); // "nodeId:handleId" -> edgeId

    for (const edge of graph.edges) {
      const sourceNode = nodeMap.get(edge.source)!;
      const targetNode = nodeMap.get(edge.target)!;

      const sourceSchema = NODE_SCHEMAS[sourceNode.type as NodeType];
      const targetSchema = NODE_SCHEMAS[targetNode.type as NodeType];

      if (!sourceSchema || !targetSchema) {
        continue;
      }

      // Check single input constraint (at most 1 incoming wire per input port)
      const targetHandleKey = `${edge.target}:${edge.targetHandle || 'default'}`;
      if (targetPortOccupancy.has(targetHandleKey)) {
        errors.push({
          code: 'MULTIPLE_INPUTS_TO_PORT',
          message: `Target input port "${edge.targetHandle || 'default'}" on node "${targetNode.id}" (${targetSchema.label}) already has an incoming connection from Edge "${targetPortOccupancy.get(targetHandleKey)}". Multiple inputs to one port are disallowed.`,
          edgeId: edge.id,
          nodeId: targetNode.id,
        });
      } else {
        targetPortOccupancy.set(targetHandleKey, edge.id);
      }

      // Determine source output port type
      const sourcePort = edge.sourceHandle
        ? sourceSchema.outputs.find((p) => p.id === edge.sourceHandle)
        : sourceSchema.outputs[0];

      // Determine target input port type
      const targetPort = edge.targetHandle
        ? targetSchema.inputs.find((p) => p.id === edge.targetHandle)
        : targetSchema.inputs[0];

      if (!sourcePort) {
        errors.push({
          code: 'INVALID_PORT',
          message: `Node "${sourceNode.id}" (${sourceNode.type}) has no output port "${edge.sourceHandle || 'default'}"`,
          nodeId: sourceNode.id,
          edgeId: edge.id,
        });
        continue;
      }

      if (!targetPort) {
        errors.push({
          code: 'INVALID_PORT',
          message: `Node "${targetNode.id}" (${targetNode.type}) has no input port "${edge.targetHandle || 'default'}"`,
          nodeId: targetNode.id,
          edgeId: edge.id,
        });
        continue;
      }

      // Strict Port Type Matching
      if (sourcePort.type !== targetPort.type) {
        errors.push({
          code: 'INCOMPATIBLE_PORTS',
          message: `Type mismatch on connection: Output "${sourcePort.name}" (${sourcePort.type}) cannot connect to Input "${targetPort.name}" (${targetPort.type})`,
          edgeId: edge.id,
          nodeId: targetNode.id,
        });
      }
    }

    // 3. Cycle Detection & Topological Waves calculation (Kahn's Algorithm)
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of graph.edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      adjacency.get(edge.source)!.push(edge.target);
    }

    // Kahn's algorithm with wave grouping for parallel execution preview
    const executionWaves: string[][] = [];
    let currentWave = graph.nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);

    let processedCount = 0;

    while (currentWave.length > 0) {
      executionWaves.push(currentWave);
      processedCount += currentWave.length;
      const nextWave: string[] = [];

      for (const nodeId of currentWave) {
        const neighbors = adjacency.get(nodeId) || [];
        for (const neighbor of neighbors) {
          const updatedDeg = (inDegree.get(neighbor) || 1) - 1;
          inDegree.set(neighbor, updatedDeg);
          if (updatedDeg === 0) {
            nextWave.push(neighbor);
          }
        }
      }

      currentWave = nextWave;
    }

    if (processedCount < graph.nodes.length) {
      errors.push({
        code: 'CYCLE_DETECTED',
        message: 'Graph contains a cycle / circular dependency. Execution is not a valid DAG.',
      });
    }

    // Check for orphan / unused nodes as warnings
    if (graph.nodes.length > 1 && executionWaves.length > 0) {
      const hasResultNode = graph.nodes.some((n) => n.type === NodeType.RESULT);
      if (!hasResultNode) {
        warnings.push('Graph does not contain any Result node to view output.');
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      executionWaves: isValid ? executionWaves : undefined,
    };
  }
}
