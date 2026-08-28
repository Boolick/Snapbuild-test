import { Connection, addEdge, reconnectEdge } from '@xyflow/react';
import { CustomNodeType, CustomEdgeType } from '../model/types';
import { CanvasNode, WorkflowTemplate } from '../../../shared/types/graph';
import { validateConnection } from '../../../shared/lib/graph/port-validator';
import { toast } from '../../../shared/ui';

export function connectNodesSingleInput(
  connection: Connection,
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
): { success: boolean; edges?: CustomEdgeType[] } {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return { success: false };
  }

  const validation = validateConnection(
    sourceNode as unknown as CanvasNode,
    connection.sourceHandle,
    targetNode as unknown as CanvasNode,
    connection.targetHandle,
  );

  if (!validation.isValid) {
    toast.error(
      validation.reason || 'Cannot connect incompatible port types',
      'Incompatible Port Connection',
    );
    return { success: false };
  }

  const targetHandle = connection.targetHandle || 'default';
  const remainingEdges = edges.filter(
    (e) => !(e.target === connection.target && (e.targetHandle || 'default') === targetHandle),
  );

  const updatedEdges = addEdge(
    {
      ...connection,
      animated: true,
      style: {
        stroke: validation.sourceType === 'image' ? '#a78bfa' : '#60a5fa',
        strokeWidth: 2,
      },
    },
    remainingEdges,
  );

  return { success: true, edges: updatedEdges };
}

export function reconnectNodeEdge(
  oldEdge: CustomEdgeType,
  newConnection: Connection,
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
): { success: boolean; edges?: CustomEdgeType[] } {
  const sourceNode = nodes.find((n) => n.id === newConnection.source);
  const targetNode = nodes.find((n) => n.id === newConnection.target);

  if (!sourceNode || !targetNode) {
    return { success: false };
  }

  const validation = validateConnection(
    sourceNode as unknown as CanvasNode,
    newConnection.sourceHandle,
    targetNode as unknown as CanvasNode,
    newConnection.targetHandle,
  );

  if (!validation.isValid) {
    toast.error(
      validation.reason || 'Cannot connect incompatible port types',
      'Incompatible Connection',
    );
    return { success: false };
  }

  const targetHandle = newConnection.targetHandle || 'default';
  const filteredEdges = edges.filter(
    (e) =>
      e.id !== oldEdge.id &&
      !(e.target === newConnection.target && (e.targetHandle || 'default') === targetHandle),
  );

  const updatedEdges = reconnectEdge(oldEdge, newConnection, filteredEdges).map((e) =>
    e.id === oldEdge.id
      ? {
          ...e,
          animated: true,
          style: {
            stroke: validation.sourceType === 'image' ? '#a78bfa' : '#60a5fa',
            strokeWidth: 2,
          },
        }
      : e,
  );

  return { success: true, edges: updatedEdges };
}

export function formatTemplateEdges(template: WorkflowTemplate): CustomEdgeType[] {
  return template.edges.map((e) => {
    const isImage =
      e.sourceHandle === 'image-out' ||
      e.targetHandle === 'image-in' ||
      e.id.includes('img') ||
      e.id.includes('g1-r1') ||
      e.id.includes('ga-ra') ||
      e.id.includes('gb-rb');
    return {
      ...e,
      animated: true,
      style: { stroke: isImage ? '#a78bfa' : '#60a5fa', strokeWidth: 2 },
    };
  });
}
