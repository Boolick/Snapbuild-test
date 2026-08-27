import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { Input } from '../../../shared/ui';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { useWorkflowStore } from '../model/use-workflow-store';
import { CustomNodeType } from '../model/types';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';

export const ImageInputNode: React.FC<NodeProps<CustomNodeType>> = ({ id, data, selected }) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const schema = NODE_SCHEMAS[NodeType.IMAGE_INPUT];
  const imageUrl = data.imageUrl || '';

  const sampleImages = [
    { label: 'Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800' },
    { label: 'City', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' },
    {
      label: 'Portrait',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    },
  ];

  return (
    <BaseNode
      id={id}
      title={data.label || schema.label}
      icon={<ImageIcon size={14} />}
      accentColor={schema.accentColor}
      selected={selected}
      inputs={schema.inputs}
      outputs={schema.outputs}
      jobStatus={data.jobStatus}
      jobError={data.jobError}
      jobDurationMs={data.jobDurationMs}
    >
      <div className="space-y-2">
        <div>
          <label className="text-[11px] font-medium text-text-muted mb-1 block">
            Image URL / Source
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => updateNodeData(id, { imageUrl: e.target.value })}
            placeholder="https://..."
            className="text-xs"
          />
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-dim">Samples:</span>
          {sampleImages.map((s) => (
            <button
              key={s.label}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, { imageUrl: s.url });
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-panel-subtle hover:bg-panel text-text-muted hover:text-text border border-border transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Thumbnail Preview */}
        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-border/80 h-28 bg-black/40">
            <img
              src={imageUrl}
              alt="Source preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
              }}
            />
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-white/80 hover:text-white transition-opacity"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </BaseNode>
  );
};
