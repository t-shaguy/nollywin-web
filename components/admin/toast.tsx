"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = toast.duration ?? (toast.type === "success" ? 4000 : 6000);
    
    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => {
    showToast({ type: "success", title, description });
  }, [showToast]);

  const error = useCallback((title: string, description?: string) => {
    showToast({ type: "error", title, description });
  }, [showToast]);

  const warning = useCallback((title: string, description?: string) => {
    showToast({ type: "warning", title, description });
  }, [showToast]);

  const info = useCallback((title: string, description?: string) => {
    showToast({ type: "info", title, description });
  }, [showToast]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-[var(--danger)]" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const content = toasts.length > 0 ? createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: "easeOut" }}
            layout={!shouldReduceMotion}
            className="pointer-events-auto"
            style={{ zIndex: 60 + index }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {icons[toast.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description && (
                  <p className="text-[13px] text-gray-400 mt-1">{toast.description}</p>
                )}
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action!.onClick();
                      dismiss(toast.id);
                    }}
                    className="mt-2 text-[13px] font-medium text-[var(--admin-primary)] hover:underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                  "text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                )}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  ) : null;

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss }}>
      {children}
      {content}
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return context;
}
