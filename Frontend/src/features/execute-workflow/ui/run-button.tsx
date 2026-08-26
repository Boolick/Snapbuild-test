import React from 'react';
import { useExecuteWorkflow } from '../model/use-execute-workflow';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { Button } from '../../../shared/ui';
import { Play, Sparkles } from 'lucide-react';

export const RunButton: React.FC = () => {
  const { execute, loading, error } = useExecuteWorkflow();
  const isExecuting = useWorkflowStore((s) => s.isExecuting);
  const nodes = useWorkflowStore((s) => s.nodes);

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-rose-400 font-medium px-2 py-1 bg-rose-950/60 rounded border border-rose-800 animate-fade-in">
          {error}
        </span>
      )}

      <Button
        variant="primary"
        size="md"
        loading={loading || isExecuting}
        onClick={execute}
        disabled={nodes.length === 0}
        className="gap-2 px-5 py-2.5 font-bold shadow-brand/30 shadow-xl bg-gradient-to-r from-[#6d7dff] to-[#8d62ff] hover:from-[#5d6eff] hover:to-[#7d52ff]"
      >
        {isExecuting ? (
          <>
            <Sparkles size={16} className="animate-spin" />
            <span>Running Pipeline...</span>
          </>
        ) : (
          <>
            <Play size={15} className="fill-current" />
            <span>Run Workflow</span>
          </>
        )}
      </Button>
    </div>
  );
};
