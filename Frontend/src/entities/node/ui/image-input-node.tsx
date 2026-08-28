import React, { useRef, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { Input, toast } from '../../../shared/ui';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { useWorkflowStore } from '../model/use-workflow-store';
import { CustomNodeType } from '../model/types';
import { Image as ImageIcon, ExternalLink, Upload, X } from 'lucide-react';
import { cn } from '../../../shared/lib/utils/cn';

export const ImageInputNode: React.FC<NodeProps<CustomNodeType>> = ({ id, data, selected }) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const schema = NODE_SCHEMAS[NodeType.IMAGE_INPUT];
  const imageUrl = (typeof data.imageUrl === 'string' && data.imageUrl) || '';
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleImages = [
    { label: 'Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800' },
    { label: 'City', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' },
    {
      label: 'Portrait',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    },
  ];

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPEG, WebP, GIF)', 'Invalid File Type');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size exceeds maximum limit of 10MB', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      if (base64Url) {
        updateNodeData(id, {
          imageUrl: base64Url,
          fileName: file.name,
          fileSize: file.size,
        });
        toast.success(`Uploaded "${file.name}"`, 'Image Attached');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file from disk', 'Upload Error');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

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
      <div className="space-y-2.5">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileChange(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        {/* Upload Button & Action Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex-1 py-1.5 px-2.5 bg-brand/15 hover:bg-brand/25 active:bg-brand/35 text-brand border border-brand/40 hover:border-brand rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload size={12} className="shrink-0" />
            <span>Upload from PC</span>
          </button>

          {imageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, { imageUrl: '', fileName: undefined, fileSize: undefined });
              }}
              title="Clear Image"
              className="p-1.5 bg-panel-subtle hover:bg-rose-950/40 text-text-dim hover:text-rose-400 border border-border hover:border-rose-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Drag & Drop Thumbnail Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={(e) => {
            e.stopPropagation();
            if (!imageUrl) {
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            'relative rounded-lg overflow-hidden border transition-all text-center flex flex-col items-center justify-center cursor-pointer',
            isDragging && 'border-brand bg-brand/10 ring-2 ring-brand/40 h-28',
            !isDragging && imageUrl && 'border-border/80 h-28 bg-black/40',
            !isDragging &&
              !imageUrl &&
              'border-dashed border-border/80 hover:border-brand/60 bg-panel-subtle/50 hover:bg-panel-subtle h-24 p-2',
          )}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Source preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/300x200?text=Invalid+Image+Source';
                }}
              />
              {!imageUrl.startsWith('data:') && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-white/80 hover:text-white transition-opacity"
                >
                  <ExternalLink size={12} />
                </a>
              )}
              {typeof data.fileName === 'string' && (
                <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-0.5 text-[10px] text-white/90 truncate text-left backdrop-blur-xs">
                  {data.fileName}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1 select-none pointer-events-none">
              <Upload size={16} className="mx-auto text-text-dim" />
              <p className="text-[10px] text-text-muted">
                {isDragging ? 'Drop image here...' : 'Click or drop image file here'}
              </p>
              <span className="text-[9px] text-text-dim block">PNG, JPG, WebP up to 10MB</span>
            </div>
          )}
        </div>

        {/* URL Input */}
        <div>
          <label className="text-[10px] font-medium text-text-dim mb-0.5 block">
            Or paste Image URL
          </label>
          <Input
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={(e) => updateNodeData(id, { imageUrl: e.target.value, fileName: undefined })}
            placeholder="https://..."
            className="text-[11px] h-7"
          />
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1 pt-0.5">
          <span className="text-[10px] text-text-dim">Samples:</span>
          {sampleImages.map((s) => (
            <button
              key={s.label}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, { imageUrl: s.url, fileName: undefined });
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-panel-subtle hover:bg-panel text-text-muted hover:text-text border border-border transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </BaseNode>
  );
};
