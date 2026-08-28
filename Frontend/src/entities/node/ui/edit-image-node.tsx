import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { useWorkflowStore } from '../model/use-workflow-store';
import { CustomNodeType } from '../model/types';
import { Sliders, Sparkles } from 'lucide-react';

export const EditImageNode: React.FC<NodeProps<CustomNodeType>> = ({ id, data, selected }) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const retryNode = useWorkflowStore((s) => s.retryNode);
  const schema = NODE_SCHEMAS[NodeType.EDIT_IMAGE];
  const strength = data.strength !== undefined ? data.strength : 0.75;

  return (
    <BaseNode
      id={id}
      title={data.label || schema.label}
      icon={<Sliders size={14} />}
      accentColor={schema.accentColor}
      selected={selected}
      inputs={schema.inputs}
      outputs={schema.outputs}
      jobStatus={data.jobStatus}
      jobError={data.jobError}
      jobDurationMs={data.jobDurationMs}
      onRetry={() => retryNode(id)}
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-text-muted">
              Edit Transformation Strength
            </span>
            <span className="text-xs font-mono font-semibold text-brand">
              {Math.round(strength * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={strength}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateNodeData(id, { strength: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-panel-subtle rounded-lg appearance-none cursor-pointer accent-brand nodrag"
          />
          <div className="flex justify-between text-[10px] text-text-dim mt-1">
            <span>Subtle (10%)</span>
            <span>Heavy (100%)</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-pink-950/20 border border-pink-800/40 text-[11px] text-pink-200/90 flex items-start gap-2">
          <Sparkles size={14} className="text-pink-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-tight">
            <span className="font-semibold text-pink-300 block text-[10px] uppercase tracking-wider">
              Connection Guide
            </span>
            <span className="block text-[10px] text-pink-200/80">
              🟣 Top port: <strong>Source Image</strong>
            </span>
            <span className="block text-[10px] text-pink-200/80">
              🔵 Bottom port: <strong>Text Instruction</strong>
            </span>
          </div>
        </div>

        {data.jobOutput?.imageUrl && (
          <div className="pt-1">
            <span className="text-[10px] text-text-dim block mb-1">Edited Result:</span>
            <img
              src={data.jobOutput.imageUrl}
              alt="Edited preview"
              className="w-full h-24 object-cover rounded-lg border border-border/80"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
};
