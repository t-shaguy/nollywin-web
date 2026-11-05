"use client";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingAirtimePayment } from "@/hooks/use-pending-airtime-payment";

interface PendingPaymentBannerProps {
  onRefresh?: () => void;
}

/**
 * Banner shown when there's a pending airtime payment (<30 min old)
 * Shows package name and allows user to refresh their subscription status
 */
export function PendingPaymentBanner({ onRefresh }: PendingPaymentBannerProps) {
  const { pendingPayment, hasPendingPayment, clearPendingPayment } = usePendingAirtimePayment();

  if (!hasPendingPayment || !pendingPayment) {
    return null;
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    // Don't clear the pending payment here - let the user see the result first
  };

  const handleDismiss = () => {
    clearPendingPayment();
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-start gap-2.5 sm:gap-3">
      <AlertCircle size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
          Payment started for {pendingPayment.packageName}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
          If confirmed, your plan will appear shortly.
        </p>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="mt-2 h-8 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-500/20 px-3"
        >
          Refresh status
        </Button>
      </div>
      <button
        onClick={handleDismiss}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  );
}
