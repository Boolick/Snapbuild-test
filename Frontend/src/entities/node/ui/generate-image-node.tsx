import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { useWorkflowStore } from '../model/use-workflow-store';
import { CustomNodeType } from '../model/types';
import { runApi } from '../../run/api/run-api';
import { Sparkles, Wand2, Layers } from 'lucide-react';
import { cn } from '../../../shared/lib/utils/cn';

export const GenerateImageNode: React.FC<NodeProps<CustomNodeType>> = ({
  id,
  data,
  selected,
}) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const openPresetDrawer = useWorkflowStore((s) => s.openPresetDrawer);
  const presets = useWorkflowStore((s) => s.presets);
  const activeRunId = useWorkflowStore((s) => s.activeRunId);

  const schema = NODE_SCHEMAS[NodeType.GENERATE_IMAGE];
  const currentPreset = presets.find((p) => p.id === data.presetId);
  const aspectRatio = data.aspectRatio || '1:1';

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3'] as const;

  const handleRetry = async () => {
    if (!activeRunId) return;
    try {
      await runApi.retryNode(activeRunId, id);
    } catch (err) {
      console.error('Failed to retry node:', err);
    }
  };

  return (
    <BaseNode
      id={id}
      title={data.label || schema.label}
      icon={<Wand2 size={14} />}
      accentColor={schema.accentColor}
      selected={selected}
      inputs={schema.inputs}
      outputs={schema.outputs}
      jobStatus={data.jobStatus}
      jobError={data.jobError}
      jobDurationMs={data.jobDurationMs}
      onRetry={handleRetry}
    >
      <div className="space-y-3">
        {/* Preset Selector Card Trigger */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
              <Layers size={11} /> AI Preset
            </span>
            <button
              onClick={() => openPresetDrawer(id)}
              className="text-[11px] text-brand hover:text-brand-hover font-semibold transition-colors"
            >
              Browse
            </button>
          </div>

          <div
            onClick={() => openPresetDrawer(id)}
            className="flex items-center gap-2 p-2 rounded-lg bg-panel-subtle hover:bg-[#18212c] border border-border cursor-pointer transition-colors group"
          >
            {currentPreset?.thumbnailUrl ? (
              <img
                src={currentPreset.thumbnailUrl}
                alt={currentPreset.name}
                className="w-7 h-7 rounded object-cover border border-border"
              />
            ) : (
              <div className="w-7 h-7 rounded bg-brand/10 text-brand flex items-center justify-center">
                <Sparkles size={14} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text truncate group-hover:text-brand transition-colors">
                {currentPreset?.name || 'Select Preset...'}
              </div>
              <div className="text-[10px] text-text-dim truncate">
                {currentPreset ? currentPreset.description : 'Click to apply rules'}
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div>
          <span className="text-[11px] font-medium text-text-muted mb-1.5 block">
            Aspect Ratio
          </span>
          <div className="grid grid-cols-4 gap-1">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => updateNodeData(id, { aspectRatio: ratio })}
                className={cn(
                  'py-1 text-[11px] font-medium rounded border transition-all',
                  aspectRatio === ratio
                    ? 'bg-brand/20 text-brand border-brand/60 font-bold'
                    : 'bg-panel-subtle text-text-dim border-border hover:text-text hover:bg-panel',
                )}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Intermediate Output Thumbnail if generated */}
        {data.jobOutput?.imageUrl && (
          <div className="pt-1">
            <span className="text-[10px] text-text-dim block mb-1">
              Generated Preview ({data.jobOutput.provider || 'AI'}):
            </span>
            <img
              src={data.jobOutput.imageUrl}
              alt="Generated preview"
              className="w-full h-24 object-cover rounded-lg border border-border/80"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
};
