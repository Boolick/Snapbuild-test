import React from 'react';
import { WORKFLOW_TEMPLATES } from '../lib/templates';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { GitFork, ArrowRightCircle } from 'lucide-react';
import { cn } from '../../../shared/lib/utils/cn';

export const TemplateSelector: React.FC = () => {
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const isExecuting = useWorkflowStore((s) => s.isExecuting);

  return (
    <div className="flex items-center gap-1.5 bg-panel-subtle/80 backdrop-blur-md p-1 rounded-xl border border-border">
      <span className="text-[11px] font-semibold text-text-dim px-2 flex items-center gap-1">
        Templates:
      </span>
      {WORKFLOW_TEMPLATES.map((tmpl, idx) => {
        const isActive = activeTemplateId === tmpl.id;
        const isBranching = idx === 2;

        return (
          <button
            key={tmpl.id}
            disabled={isExecuting}
            onClick={() => loadTemplate(tmpl)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none',
              isActive
                ? 'bg-brand/20 text-brand border border-brand/50 shadow-sm shadow-brand/20 font-bold'
                : 'text-text-muted hover:text-text hover:bg-[#1a232e] border border-transparent hover:border-border',
            )}
            title={tmpl.description}
          >
            {isBranching ? (
              <GitFork size={13} className={isActive ? 'text-brand' : 'text-text-muted'} />
            ) : (
              <ArrowRightCircle size={13} className={isActive ? 'text-brand' : 'text-text-muted'} />
            )}
            <span>{tmpl.name.split(':')[0]}</span>
          </button>
        );
      })}
    </div>
  );
};
