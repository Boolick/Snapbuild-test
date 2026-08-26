import React, { useState } from 'react';
import { useWorkflowStore } from '../../../entities/node/model/use-workflow-store';
import { PresetCard } from '../../../entities/preset/ui/preset-card';
import { Preset } from '../../../shared/types/api';
import { X, Sparkles, Search } from 'lucide-react';
import { Button } from '../../../shared/ui';

export const PresetDrawer: React.FC = () => {
  const isOpen = useWorkflowStore((s) => s.isPresetDrawerOpen);
  const closeDrawer = useWorkflowStore((s) => s.closePresetDrawer);
  const targetNodeId = useWorkflowStore((s) => s.targetPresetNodeId);
  const applyPresetToNode = useWorkflowStore((s) => s.applyPresetToNode);
  const presets = useWorkflowStore((s) => s.presets);
  const nodes = useWorkflowStore((s) => s.nodes);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  if (!isOpen) {
    return null;
  }

  const targetNode = nodes.find((n) => n.id === targetNodeId);

  const filteredPresets = presets.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mainPrompt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleApply = () => {
    if (selectedPreset && targetNodeId) {
      applyPresetToNode(targetNodeId, selectedPreset);
    } else {
      closeDrawer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      {/* Slide-over Drawer Panel */}
      <aside className="relative w-full max-w-md bg-panel border-l border-border h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Presets Library</h2>
              <p className="text-[11px] text-text-muted">
                {targetNode
                  ? `Applying to node: ${targetNode.data.label || targetNode.id}`
                  : 'Browse AI rendering styles & prompt presets'}
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-panel-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-border bg-panel-subtle/30">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, prompt or style..."
              className="w-full bg-[#080b0e] border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text placeholder-text-dim outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Presets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 text-text-dim text-xs">
              No presets matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isSelected={
                  selectedPreset?.id === preset.id || targetNode?.data.presetId === preset.id
                }
                onSelect={(p) => setSelectedPreset(p)}
              />
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-panel-subtle/50 flex items-center justify-between gap-3">
          <div className="text-xs text-text-dim">
            {selectedPreset ? `Selected: ${selectedPreset.name}` : 'Choose a preset above'}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeDrawer}>
              Cancel
            </Button>
            {targetNodeId && (
              <Button variant="primary" size="sm" disabled={!selectedPreset} onClick={handleApply}>
                Apply to Node
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
