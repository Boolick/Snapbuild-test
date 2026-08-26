import { PortType, NodeType, CanvasNode } from '../../types/graph';
import { NODE_SCHEMAS } from '../../config/constants';

export interface ConnectionValidation {
  isValid: boolean;
  reason?: string;
  sourceType?: PortType;
  targetType?: PortType;
}

export function validateConnection(
  sourceNode: CanvasNode,
  sourceHandleId: string | null | undefined,
  targetNode: CanvasNode,
  targetHandleId: string | null | undefined,
): ConnectionValidation {
  // Self connection is disallowed
  if (sourceNode.id === targetNode.id) {
    return { isValid: false, reason: 'Cannot connect a node to itself.' };
  }

  const sourceSchema = NODE_SCHEMAS[sourceNode.type as NodeType];
  const targetSchema = NODE_SCHEMAS[targetNode.type as NodeType];

  if (!sourceSchema || !targetSchema) {
    return { isValid: false, reason: 'Unknown node type.' };
  }

  const sourcePort = sourceHandleId
    ? sourceSchema.outputs.find((p) => p.id === sourceHandleId)
    : sourceSchema.outputs[0];

  const targetPort = targetHandleId
    ? targetSchema.inputs.find((p) => p.id === targetHandleId)
    : targetSchema.inputs[0];

  if (!sourcePort) {
    return {
      isValid: false,
      reason: `Node "${sourceSchema.label}" has no matching output port.`,
    };
  }

  if (!targetPort) {
    return {
      isValid: false,
      reason: `Node "${targetSchema.label}" has no matching input port.`,
    };
  }

  if (sourcePort.type !== targetPort.type) {
    return {
      isValid: false,
      reason: `Incompatible types! Output "${sourcePort.name}" (${sourcePort.type}) cannot connect to Input "${targetPort.name}" (${targetPort.type}).`,
      sourceType: sourcePort.type,
      targetType: targetPort.type,
    };
  }

  return {
    isValid: true,
    sourceType: sourcePort.type,
    targetType: targetPort.type,
  };
}
