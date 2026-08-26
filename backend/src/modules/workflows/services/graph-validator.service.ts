import { Injectable, Logger } from '@nestjs/common';
import {
  ValidateGraphDto,
  ValidateGraphResponseDto,
  ValidationErrorDetail,
} from '../dto/validate-graph.dto';
import { NODE_SCHEMAS, NodeType } from '../domain/port-type.enum';

@Injectable()
export class GraphValidatorService {
  private readonly logger = new Logger(GraphValidatorService.name);

  validate(graph: ValidateGraphDto): ValidateGraphResponseDto {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];
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

    // 2. Validate Port Type Compatibility
    for (const edge of graph.edges) {
      const sourceNode = nodeMap.get(edge.source)!;
      const targetNode = nodeMap.get(edge.target)!;

      const sourceSchema = NODE_SCHEMAS[sourceNode.type as NodeType];
      const targetSchema = NODE_SCHEMAS[targetNode.type as NodeType];

      if (!sourceSchema || !targetSchema) {
        continue;
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
