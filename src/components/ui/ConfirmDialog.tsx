import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'navy';
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  loading = false,
  disabled = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {confirmVariant === 'danger' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-clay/10 border border-clay/20 text-clay">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">This action cannot be undone.</span>
          </div>
        )}

        <div className="text-sm text-ink/80 leading-relaxed font-body">
          {description}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            disabled={disabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
