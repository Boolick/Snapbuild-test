import React from 'react';
import { Preset } from '../../../shared/types/api';
import { cn } from '../../../shared/lib/utils/cn';
import { Sparkles, Check } from 'lucide-react';
import { Badge } from '../../../shared/ui';

export interface PresetCardProps {
  preset: Preset;
  isSelected?: boolean;
  onSelect?: (preset: Preset) => void;
  compact?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected = false,
  onSelect,
  compact = false,
}) => {
  return (
    <div
      onClick={() => onSelect?.(preset)}
      className={cn(
        'group relative bg-panel-subtle border border-border rounded-xl p-3.5 cursor-pointer transition-all duration-200 hover:border-brand/60 hover:bg-[#19212a]',
        isSelected && 'border-brand bg-[#171d2c] shadow-lg shadow-brand/10 ring-1 ring-brand',
        compact && 'p-2.5',
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 bg-brand text-white p-1 rounded-full shadow-md">
          <Check size={12} strokeWidth={3} />
        </div>
      )}

      <div className="flex items-start gap-3">
        {preset.thumbnailUrl ? (
          <img
            src={preset.thumbnailUrl}
            alt={preset.name}
            className={cn(
              'w-14 h-14 rounded-lg object-cover border border-border group-hover:scale-105 transition-transform shrink-0',
              compact && 'w-10 h-10',
            )}
          />
        ) : (
          <div
            className={cn(
              'w-14 h-14 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0',
              compact && 'w-10 h-10',
            )}
          >
            <Sparkles size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-text truncate">{preset.name}</h4>
            {preset.defaultParams?.style && (
              <Badge variant="default" className="text-[10px] py-0">
                {preset.defaultParams.style}
              </Badge>
            )}
          </div>

          <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
            {preset.description}
          </p>

          {!compact && preset.references && preset.references.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-text-dim">References:</span>
              <div className="flex -space-x-1">
                {preset.references.slice(0, 3).map((ref, idx) => (
                  <img
                    key={idx}
                    src={ref}
                    alt="Ref"
                    className="w-4 h-4 rounded-full object-cover border border-panel"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
