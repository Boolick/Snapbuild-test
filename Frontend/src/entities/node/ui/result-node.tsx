import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType, JobStatus } from '../../../shared/types/graph';
import { CustomNodeType } from '../model/types';
import { Modal, Spinner, Button } from '../../../shared/ui';
import { Eye, Download, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';

export const ResultNode: React.FC<NodeProps<CustomNodeType>> = ({
  id,
  data,
  selected,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const schema = NODE_SCHEMAS[NodeType.RESULT];
  const imageUrl = data.jobOutput?.imageUrl || data.jobOutput?.previewUrl || '';
  const isRunning = data.jobStatus === JobStatus.RUNNING;
  const isReady = data.jobStatus === JobStatus.SUCCESS && imageUrl;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `ai-workflow-result-${Date.now()}.png`;
    target: '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <BaseNode
        id={id}
        title={data.label || schema.label}
        icon={<Eye size={14} />}
        accentColor={schema.accentColor}
        selected={selected}
        inputs={schema.inputs}
        outputs={schema.outputs}
        jobStatus={data.jobStatus}
        jobError={data.jobError}
        jobDurationMs={data.jobDurationMs}
      >
        <div className="space-y-2.5">
          {isReady ? (
            <div className="space-y-2">
              <div
                onClick={() => setIsModalOpen(true)}
                className="relative group rounded-xl overflow-hidden border border-emerald-500/30 h-44 bg-black/60 cursor-pointer shadow-lg transition-transform hover:scale-[1.01]"
              >
                <img
                  src={imageUrl}
                  alt="Final AI Generation Result"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                  <span className="text-[11px] text-white font-medium flex items-center gap-1">
                    <Maximize2 size={12} /> Click to expand
                  </span>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-colors"
                    title="Download image"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={12} /> Ready
                </span>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-brand hover:underline"
                >
                  Full View
                </button>
              </div>
            </div>
          ) : isRunning ? (
            <div className="h-40 rounded-xl border border-dashed border-blue-500/50 bg-blue-950/20 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Spinner size="md" className="text-blue-400" />
              <div className="text-xs font-semibold text-blue-300">
                Generating Result...
              </div>
              <p className="text-[10px] text-text-dim max-w-[200px]">
                Waiting for upstream AI pipeline to finish processing
              </p>
            </div>
          ) : (
            <div className="h-32 rounded-xl border border-dashed border-border bg-panel-subtle/60 flex flex-col items-center justify-center gap-1.5 p-4 text-center">
              <Sparkles size={20} className="text-text-dim" />
              <div className="text-xs font-medium text-text-muted">
                Waiting for Execution
              </div>
              <p className="text-[10px] text-text-dim max-w-[200px]">
                Connect Generate or Edit node to preview output
              </p>
            </div>
          )}
        </div>
      </BaseNode>

      {/* Full Resolution Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="AI Generated Image Result"
        description="High-resolution preview with generation metadata"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="relative max-h-[70vh] rounded-xl overflow-hidden border border-border bg-black/80 flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Result full view"
              className="max-h-[65vh] w-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-text-muted space-y-0.5">
              <div>
                Duration: <span className="text-text font-semibold">{data.jobDurationMs || 0}ms</span>
              </div>
              {data.jobOutput?.promptUsed && (
                <div className="text-[11px] text-text-dim line-clamp-1 max-w-md">
                  Prompt: {data.jobOutput.promptUsed}
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download size={14} /> Download Image
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
