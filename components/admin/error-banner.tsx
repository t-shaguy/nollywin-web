"use client";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div className={`rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4 ${className || ""}`}>
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-[var(--danger)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">{message}</p>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="mt-2 h-8 px-3 text-xs gap-1.5"
            >
              <RefreshCw size={14} />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
