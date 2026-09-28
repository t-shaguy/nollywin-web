"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "./button";

interface Toast {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    const id = Date.now().toString();
    setToast({ id, message, action });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToast((current) => (current?.id === id ? null : current));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toast.message}</p>
              {toast.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.action!.onClick();
                    dismissToast(toast.id);
                  }}
                  className="mt-2"
                >
                  {toast.action.label}
                </Button>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
