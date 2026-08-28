import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { useWorkflowStore } from '../model/use-workflow-store';
import { X } from 'lucide-react';
import { toast } from '../../../shared/ui';

export const CustomWorkflowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const deleteEdge = useWorkflowStore((s) => s.deleteEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEdge(id);
    toast.info('Wire disconnected', 'Connection Removed');
  };

  const strokeColor = (style?.stroke as string) || '#7d8cff';

  const edgeStyle: React.CSSProperties = {
    ...style,
    stroke: strokeColor,
    strokeWidth: selected ? 3 : 2,
    filter: selected ? `drop-shadow(0 0 6px ${strokeColor}99)` : undefined,
    transition: 'stroke-width 0.15s ease, filter 0.15s ease',
  };

  const showButton = isHovered || selected;

  return (
    <>
      {/* Invisible wider hit-area path for easy hovering and clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        className="cursor-pointer"
        style={{ pointerEvents: 'stroke' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible Base Edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
        className={selected ? '!stroke-brand' : undefined}
      />

      {/* Disconnect [x] Button rendered on the edge midpoint */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {showButton && (
            <button
              onClick={handleDelete}
              className="w-5 h-5 rounded-full bg-[#11161b] border border-border text-text-dim hover:text-rose-400 hover:border-rose-500 hover:bg-rose-950/80 transition-all flex items-center justify-center shadow-lg hover:scale-125 active:scale-95 group/btn"
              title="Disconnect wire (Click to remove)"
            >
              <X size={11} className="transition-transform group-hover/btn:rotate-90" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
