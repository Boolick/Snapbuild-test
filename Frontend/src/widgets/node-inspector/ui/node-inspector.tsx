import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { NODE_SCHEMAS } from '../../../shared/config/constants';
import { NodeType } from '../../../shared/types/graph';
import { NodeStatusBadge } from '../../../entities/run/ui/node-status-badge';
import { Button, Input } from '../../../shared/ui';

export const NodeInspector: React.FC = () => {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  if (!selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const schema = NODE_SCHEMAS[node.type as NodeType];
  const incomingEdges = edges.filter((e) => e.target === node.id);
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  return (
    <aside className="absolute top-4 right-4 z-20 w-80 bg-panel/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-150">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-panel-subtle/50">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: schema?.accentColor || '#7d8cff' }}
          />
          <h3 className="text-xs font-bold text-text truncate">
            {node.data.label || schema?.label || node.id}
          </h3>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-panel transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto text-xs">
        {/* Node Metadata & Status */}
        <div className="space-y-2 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-text-dim">Node ID</span>
            <span className="font-mono text-[11px] text-text-muted">{node.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-dim">Type</span>
            <span className="font-medium text-text">{schema?.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-dim">Job Status</span>
            <NodeStatusBadge
              status={node.data.jobStatus}
              durationMs={node.data.jobDurationMs}
            />
          </div>
        </div>

        {/* Node Label Editing */}
        <div>
          <label className="text-[11px] font-medium text-text-muted block mb-1">
            Display Label
          </label>
          <Input
            value={node.data.label || ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            placeholder="Custom node label..."
            className="text-xs"
          />
        </div>

        {/* Connections overview */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider block">
            Connections
          </span>
          <div className="text-[11px] text-text-muted flex justify-between">
            <span>Inputs connected:</span>
            <span className="font-semibold text-text">{incomingEdges.length}</span>
          </div>
          <div className="text-[11px] text-text-muted flex justify-between">
            <span>Outputs connected:</span>
            <span className="font-semibold text-text">{outgoingEdges.length}</span>
          </div>
        </div>

        {/* Execution Output Inspection */}
        {node.data.jobOutput && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Last Job Outputs
            </span>
            <pre className="p-2 rounded-lg bg-[#080b0e] border border-border text-[10px] text-text-muted overflow-x-auto max-h-36">
              {JSON.stringify(node.data.jobOutput, null, 2)}
            </pre>
          </div>
        )}

        {/* Delete action */}
        <div className="pt-2 border-t border-border">
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteNode(node.id)}
            className="w-full gap-1.5 text-xs"
          >
            <Trash2 size={13} /> Delete Node
          </Button>
        </div>
      </div>
    </aside>
  );
};
