"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal content - bottom sheet on mobile, centered dialog on md+ */}
      <div className="
        relative bg-card border border-border w-full
        /* Mobile: bottom sheet */
        max-md:rounded-t-2xl max-md:max-h-[90dvh]
        /* Desktop: centered dialog */
        md:rounded-2xl md:max-w-md md:max-h-[85vh] md:m-4
        overflow-hidden flex flex-col
      ">
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-5 border-b border-border flex-shrink-0">
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
