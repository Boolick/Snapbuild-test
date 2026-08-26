import React from 'react';
import { CanvasToolbar } from '../../../widgets/workflow-canvas/ui/canvas-toolbar';
import { WorkflowCanvas } from '../../../widgets/workflow-canvas/ui/workflow-canvas';
import { PresetDrawer } from '../../../widgets/preset-drawer/ui/preset-drawer';
import { NodeInspector } from '../../../widgets/node-inspector/ui/node-inspector';

export const WorkflowEditorPage: React.FC = () => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background text-text">
      {/* Top Header & Toolbar */}
      <CanvasToolbar />

      {/* Main Canvas Workspace Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <WorkflowCanvas />
        <NodeInspector />
        <PresetDrawer />
      </main>
    </div>
  );
};
