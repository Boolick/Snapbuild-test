import React from 'react';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { Type, Image as ImageIcon, Wand2, Sliders, Eye, Plus } from 'lucide-react';
import { toast } from '../../../shared/ui';

export const CanvasNodePalette: React.FC = () => {
  const addNode = useWorkflowStore((s) => s.addNode);

  const paletteItems = [
    { type: NodeType.PROMPT, icon: <Type size={14} /> },
    { type: NodeType.IMAGE_INPUT, icon: <ImageIcon size={14} /> },
    { type: NodeType.GENERATE_IMAGE, icon: <Wand2 size={14} /> },
    { type: NodeType.EDIT_IMAGE, icon: <Sliders size={14} /> },
    { type: NodeType.RESULT, icon: <Eye size={14} /> },
  ];

  const handleAddNode = (type: NodeType) => {
    const schema = NODE_SCHEMAS[type];
    addNode(type);
    toast.info(`Added ${schema.label} to canvas`, 'Node Created');
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-panel/90 backdrop-blur-md p-2 rounded-2xl border border-border shadow-2xl">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim px-2 pt-1">
        Add Nodes
      </div>
      <div className="flex flex-col gap-1">
        {paletteItems.map((item) => {
          const schema = NODE_SCHEMAS[item.type];
          return (
            <button
              key={item.type}
              onClick={() => handleAddNode(item.type)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text hover:bg-panel-subtle border border-transparent hover:border-border transition-all text-left group"
              title={schema.description}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${schema.accentColor}20`,
                  color: schema.accentColor,
                }}
              >
                {item.icon}
              </div>
              <span>{schema.label}</span>
              <Plus size={12} className="ml-auto opacity-0 group-hover:opacity-100 text-brand" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
