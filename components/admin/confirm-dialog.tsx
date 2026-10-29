"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmDialogProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  const icons = {
    danger: <AlertTriangle size={20} className="text-[var(--danger)]" />,
    primary: <CheckCircle size={20} className="text-primary" />,
    info: <Info size={20} className="text-[var(--info)]" />,
  };

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={loading ? undefined : onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: "easeOut" }}
            className="relative bg-card border border-border rounded-xl w-full max-w-md shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-border">
              {icons[variant]}
              <div className="flex-1">
                <h2 id="confirm-dialog-title" className="text-base font-semibold">
                  {title}
                </h2>
                {description && (
                  <p className="text-[13px] text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={cn(
                  "w-8 h-8 rounded-lg border border-border flex items-center justify-center",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  "transition-colors duration-120",
                  loading && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Footer with actions */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <Button
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "gradient"}
                size="md"
                onClick={onConfirm}
                disabled={loading}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
