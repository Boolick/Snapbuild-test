import React from 'react';
import { WORKFLOW_TEMPLATES } from '../lib/templates';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { GitFork, ArrowRightCircle } from 'lucide-react';
import { cn } from '../../../shared/lib/utils/cn';

export const TemplateSelector: React.FC = () => {
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const isExecuting = useWorkflowStore((s) => s.isExecuting);

  return (
    <div className="flex items-center gap-1.5 bg-panel-subtle/80 backdrop-blur-md p-1 rounded-xl border border-border">
      <span className="text-[11px] font-semibold text-text-dim px-2 flex items-center gap-1">
        Templates:
      </span>
      {WORKFLOW_TEMPLATES.map((tmpl, idx) => (
        <button
          key={tmpl.id}
          disabled={isExecuting}
          onClick={() => loadTemplate(tmpl)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-text-muted hover:text-text hover:bg-[#1a232e] border border-transparent hover:border-border transition-all disabled:opacity-40 disabled:cursor-not-allowed',
            idx === 2 && 'bg-brand/10 text-brand border-brand/30 hover:bg-brand/20',
          )}
          title={tmpl.description}
        >
          {idx === 2 ? (
            <GitFork size={13} className="text-brand" />
          ) : (
            <ArrowRightCircle size={13} />
          )}
          <span>{tmpl.name.split(':')[0]}</span>
        </button>
      ))}
    </div>
  );
};
