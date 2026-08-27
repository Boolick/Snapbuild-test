import React, { useEffect, useState } from 'react';
import { ToastItem, useToastStore } from './toast-store';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface ToastProps {
  toast: ToastItem;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const removeToast = useToastStore((s) => s.removeToast);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) {
      return;
    }

    const startTime = Date.now();
    const duration = toast.duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        removeToast(toast.id);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [toast.id, toast.duration, removeToast]);

  const typeConfig = {
    error: {
      icon: <AlertCircle size={16} className="text-rose-400 shrink-0" />,
      border: 'border-rose-700/80 shadow-rose-950/40',
      bg: 'bg-[#181115]/95',
      titleColor: 'text-rose-300',
      barColor: 'bg-rose-500',
      accentGlow: 'shadow-rose-900/20',
      defaultTitle: 'Error',
    },
    warning: {
      icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
      border: 'border-amber-700/80 shadow-amber-950/40',
      bg: 'bg-[#191610]/95',
      titleColor: 'text-amber-300',
      barColor: 'bg-amber-500',
      accentGlow: 'shadow-amber-900/20',
      defaultTitle: 'Warning',
    },
    success: {
      icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
      border: 'border-emerald-700/80 shadow-emerald-950/40',
      bg: 'bg-[#101915]/95',
      titleColor: 'text-emerald-300',
      barColor: 'bg-emerald-500',
      accentGlow: 'shadow-emerald-900/20',
      defaultTitle: 'Success',
    },
    info: {
      icon: <Info size={16} className="text-blue-400 shrink-0" />,
      border: 'border-blue-700/80 shadow-blue-950/40',
      bg: 'bg-[#10141c]/95',
      titleColor: 'text-blue-300',
      barColor: 'bg-blue-500',
      accentGlow: 'shadow-blue-900/20',
      defaultTitle: 'Information',
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto relative flex flex-col w-full max-w-sm rounded-xl border backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-200 animate-slide-up',
        config.bg,
        config.border,
        config.accentGlow,
      )}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className="pt-0.5">{config.icon}</div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className={cn('text-xs font-bold leading-tight', config.titleColor)}>
            {toast.title || config.defaultTitle}
          </h4>
          <p className="text-[12px] text-text-muted mt-1 leading-snug break-words">
            {toast.message}
          </p>
        </div>

        <button
          onClick={() => removeToast(toast.id)}
          className="text-text-dim hover:text-text p-1 rounded-md transition-colors -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-0.5 w-full bg-white/5 overflow-hidden">
          <div
            className={cn('h-full transition-all linear', config.barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
