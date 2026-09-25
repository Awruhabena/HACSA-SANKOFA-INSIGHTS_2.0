import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-card border border-border shadow-xl p-6 sm:p-7 relative z-10 transition-all`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
          {title ? (
            <h2 id="modal-title" className="font-heading text-lg font-bold text-navy">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-gray hover:text-ink rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
