import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { PromptNode } from '../../../entities/node/ui/prompt-node';
import { ImageInputNode } from '../../../entities/node/ui/image-input-node';
import { GenerateImageNode } from '../../../entities/node/ui/generate-image-node';
import { EditImageNode } from '../../../entities/node/ui/edit-image-node';
import { ResultNode } from '../../../entities/node/ui/result-node';
import { CanvasNodePalette } from './canvas-node-palette';
import { WORKFLOW_TEMPLATES } from '../../../features/workflow-templates/lib/templates';
import { presetApi } from '../../../entities/preset/api/preset-api';
import { NodeType } from '../../../shared/types/graph';

export const WorkflowCanvas: React.FC = () => {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const setPresets = useWorkflowStore((s) => s.setPresets);

  // Register Custom Node Types
  const nodeTypes = useMemo(
    () => ({
      [NodeType.PROMPT]: PromptNode,
      [NodeType.IMAGE_INPUT]: ImageInputNode,
      [NodeType.GENERATE_IMAGE]: GenerateImageNode,
      [NodeType.EDIT_IMAGE]: EditImageNode,
      [NodeType.RESULT]: ResultNode,
    }),
    [],
  );

  // Initial load: fetch presets and load default Scenario 3 (Branching) or Scenario 1
  useEffect(() => {
    // 1. Fetch presets from backend
    presetApi
      .getAll()
      .then((data) => setPresets(data))
      .catch((err) => console.warn('Could not load presets from backend, using defaults', err));

    // 2. Load Scenario 3 (Parallel Branching) by default if canvas is empty
    if (nodes.length === 0) {
      loadTemplate(WORKFLOW_TEMPLATES[2]); // Scenario 3: Branching & Parallelism
    }
  }, [loadTemplate, setPresets]);

  return (
    <div className="relative w-full h-full bg-[#080b0e] overflow-hidden">
      {/* Floating Node Palette */}
      <CanvasNodePalette />

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#7d8cff', strokeWidth: 2 },
        }}
        minZoom={0.2}
        maxZoom={2.0}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#1e2631"
        />
        <Controls className="!bg-panel !border-border !rounded-xl !overflow-hidden !shadow-2xl fill-text [&>button]:!bg-panel [&>button]:!border-border [&>button]:!text-text-muted hover:[&>button]:!bg-panel-subtle hover:[&>button]:!text-text" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            switch (node.type) {
              case NodeType.PROMPT:
                return '#3b82f6';
              case NodeType.IMAGE_INPUT:
                return '#8b5cf6';
              case NodeType.GENERATE_IMAGE:
                return '#7d8cff';
              case NodeType.EDIT_IMAGE:
                return '#ec4899';
              case NodeType.RESULT:
                return '#10b981';
              default:
                return '#64748b';
            }
          }}
          maskColor="rgba(11, 14, 17, 0.85)"
          className="!bg-panel/90 !border !border-border !rounded-xl !overflow-hidden !shadow-2xl"
        />
      </ReactFlow>
    </div>
  );
};
