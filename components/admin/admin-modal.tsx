"use client";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  tone?: "dark" | "light";
  children: ReactNode;
  footer?: ReactNode;
  preventClose?: boolean; // When form is dirty
}

export function AdminModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  tone = "dark",
  children,
  footer,
  preventClose = false,
}: AdminModalProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (preventClose) {
          // Show discard confirmation
          if (confirm("You have unsaved changes. Discard them?")) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleEscape);

    // Focus trap - simplified
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = document.querySelector('[role="dialog"]');
    const firstFocusable = modal?.querySelector(focusableElements) as HTMLElement;
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose, preventClose]);

  if (!mounted || !open) return null;

  const sizeClasses = {
    sm: "max-w-[440px]",
    md: "max-w-[560px]",
    lg: "max-w-[760px]",
  };

  const toneClasses = {
    dark: {
      bg: "bg-card",
      border: "border-border",
      text: "text-foreground",
      muted: "text-muted-foreground",
    },
    light: {
      bg: "bg-white",
      border: "border-gray-200",
      text: "text-gray-900",
      muted: "text-gray-600",
    },
  };

  const handleBackdropClick = () => {
    if (preventClose) {
      if (confirm("You have unsaved changes. Discard them?")) {
        onClose();
      }
    } else {
      onClose();
    }
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
            onClick={handleBackdropClick}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: "easeOut" }}
            className={cn(
              "relative rounded-xl border shadow-2xl w-full max-h-[88vh] flex flex-col",
              sizeClasses[size],
              toneClasses[tone].bg,
              toneClasses[tone].border
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={description ? "modal-description" : undefined}
          >
            {/* Header */}
            <div className={cn("flex items-start justify-between gap-4 p-5 border-b", toneClasses[tone].border)}>
              <div className="flex-1">
                <h2 id="modal-title" className={cn("text-base font-semibold", toneClasses[tone].text)}>
                  {title}
                </h2>
                {description && (
                  <p id="modal-description" className={cn("text-[13px] mt-1", toneClasses[tone].muted)}>
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
                  "transition-colors duration-120",
                  tone === "dark"
                    ? "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}
                aria-label="Close modal"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>

            {/* Sticky Footer */}
            {footer && (
              <div className={cn("border-t p-4", toneClasses[tone].border)}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

/**
 * Modal Section - for grouping related fields with a label
 */
interface ModalSectionProps {
  label?: string;
  action?: ReactNode;
  bordered?: boolean;
  title?: string;
  helper?: string;
  children: ReactNode;
  className?: string;
}

export function ModalSection({ label, action, bordered, title, helper, children, className }: ModalSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </h3>
          {action}
        </div>
      )}
      {bordered ? (
        <div className="border border-border rounded-lg p-4 space-y-3">
          {title && (
            <div>
              <h4 className="text-sm font-semibold">{title}</h4>
              {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
            </div>
          )}
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Form Grid - responsive two-column layout for modal forms
 */
interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Modal Footer - consistent button layout
 */
interface ModalFooterProps {
  leftAction?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmVariant?: "gradient" | "danger";
  loading?: boolean;
  children?: ReactNode;
}

export function ModalFooter({
  leftAction,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
  confirmVariant = "gradient",
  loading = false,
  children,
}: ModalFooterProps) {
  if (children) {
    return <div className="flex items-center justify-between gap-3">{children}</div>;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      {leftAction && <div className="flex-1">{leftAction}</div>}
      <div className="flex items-center gap-2 ml-auto">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-8 px-3 text-[13px] font-medium rounded-lg border border-border bg-transparent hover:bg-secondary transition-colors duration-120 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "h-8 px-3 text-[13px] font-medium rounded-lg transition-colors duration-120 disabled:opacity-50 flex items-center gap-2",
              confirmVariant === "gradient" && "bg-brand-gradient text-white hover:opacity-90",
              confirmVariant === "danger" && "bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] hover:bg-[var(--danger)]/20"
            )}
          >
            {loading && (
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmLabel}
          </button>
        )}
      </div>
    </div>
  );
}
