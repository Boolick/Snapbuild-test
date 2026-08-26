import React, { useEffect } from 'react';
import { cn } from '../lib/utils/cn';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-panel border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150',
          maxWidthClasses[maxWidth],
        )}
      >
        {(title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
              {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-panel-subtle transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
