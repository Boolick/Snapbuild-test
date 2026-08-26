import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { Textarea } from '../../../shared/ui';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { useWorkflowStore } from '../model/use-workflow-store';
import { CustomNodeType } from '../model/types';
import { Type } from 'lucide-react';

export const PromptNode: React.FC<NodeProps<CustomNodeType>> = ({
  id,
  data,
  selected,
}) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const schema = NODE_SCHEMAS[NodeType.PROMPT];
  const promptText = data.prompt || '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { prompt: e.target.value });
  };

  return (
    <BaseNode
      id={id}
      title={data.label || schema.label}
      icon={<Type size={14} />}
      accentColor={schema.accentColor}
      selected={selected}
      inputs={schema.inputs}
      outputs={schema.outputs}
      jobStatus={data.jobStatus}
      jobError={data.jobError}
      jobDurationMs={data.jobDurationMs}
    >
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-text-muted flex justify-between">
          <span>Master Prompt</span>
          <span className="text-[10px] text-text-dim">{promptText.length} chars</span>
        </label>
        <Textarea
          value={promptText}
          onChange={handleChange}
          placeholder="Enter prompt description for image generation..."
          rows={3}
          className="text-xs focus:ring-blue-500/50"
        />
      </div>
    </BaseNode>
  );
};
