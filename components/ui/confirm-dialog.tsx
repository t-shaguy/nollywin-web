/**
 * Confirm Dialog Component
 * Modal dialog for confirming actions with customizable buttons
 */

import { X } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmVariant?: "gradient" | "outline" | "ghost" | "secondary" | "danger";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmVariant = "gradient",
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
