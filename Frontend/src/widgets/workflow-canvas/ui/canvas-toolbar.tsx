import React from 'react';
import { RunButton } from '../../../features/execute-workflow/ui/run-button';
import { TemplateSelector } from '../../../features/workflow-templates/ui/template-selector';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { Trash2, Layers, Cpu } from 'lucide-react';
import { Button, toast } from '../../../shared/ui';

export const CanvasToolbar: React.FC = () => {
  const clearGraph = useWorkflowStore((s) => s.clearGraph);
  const openPresetDrawer = useWorkflowStore((s) => s.openPresetDrawer);
  const isExecuting = useWorkflowStore((s) => s.isExecuting);

  const handleClear = () => {
    clearGraph();
    toast.info('Canvas cleared');
  };

  return (
    <header className="h-16 border-b border-border bg-panel/95 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-purple-500 flex items-center justify-center text-white shadow-lg shadow-brand/20">
          <Cpu size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-text tracking-tight">AI Image Workflow Mini</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/30">
              FSD v2.1
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            DAG Parallel Execution Engine & Visual Canvas Editor
          </p>
        </div>
      </div>

      {/* Center: Template Quick Switcher */}
      <div className="hidden lg:flex items-center">
        <TemplateSelector />
      </div>

      {/* Right Controls: Presets, Clear, Run */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openPresetDrawer()}
          className="gap-1.5 text-xs text-text-muted hover:text-brand"
        >
          <Layers size={14} /> Presets Library
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={isExecuting}
          onClick={handleClear}
          className="gap-1.5 text-xs text-rose-400/80 hover:text-rose-400 hover:bg-rose-950/20"
          title="Clear canvas"
        >
          <Trash2 size={14} /> Clear
        </Button>

        <RunButton />
      </div>
    </header>
  );
};
