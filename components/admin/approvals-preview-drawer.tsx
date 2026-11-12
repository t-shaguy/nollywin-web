/**
 * Approvals Preview Drawer
 * 
 * Compact list view of pending approvals with responsive drawer:
 * - Desktop (≥1024px): Side drawer from right
 * - Mobile (<1024px): Bottom sheet
 */

"use client";
import { X, ChevronRight, AlertCircle } from "lucide-react";
import { summarizeChangeRequest } from "@/lib/utils/change-request-summary";
import type { ChangeRequest } from "@/lib/api/admin";

interface ApprovalsPreviewDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** List of pending change requests */
  requests: ChangeRequest[];
  /** Callback when a request is clicked */
  onRequestClick: (request: ChangeRequest) => void;
  /** Whether data is loading */
  loading?: boolean;
}

export function ApprovalsPreviewDrawer({
  open,
  onClose,
  requests,
  onRequestClick,
  loading = false,
}: ApprovalsPreviewDrawerProps) {
  if (!open) return null;

  // Format date as "DD MMM" (e.g., "14 Sep")
  const formatShortDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Africa/Lagos',
      }).format(date);
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Side drawer on desktop, bottom sheet on mobile */}
      <div
        className={`
          fixed z-50 bg-background border-border
          lg:top-0 lg:right-0 lg:h-full lg:w-96 lg:border-l
          max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:rounded-t-2xl max-lg:border-t
          max-lg:max-h-[80vh]
          shadow-xl
          animate-in
          lg:slide-in-from-right
          max-lg:slide-in-from-bottom
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 id="drawer-title" className="text-sm font-bold">
            Pending Approvals ({requests.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-lg:max-h-[calc(80vh-60px)] lg:h-[calc(100vh-60px)]">
          {loading ? (
            <div className="py-8 text-center">
              <div className="text-xs text-muted-foreground">Loading approvals...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <AlertCircle size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((request) => {
                const summary = summarizeChangeRequest(request);
                const dateStr = formatShortDate(request.createdAt);
                const isFinancial = request.financial;

                return (
                  <button
                    key={request.id}
                    onClick={() => onRequestClick(request)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {/* Icon indicator */}
                    <div className={`
                      mt-0.5 w-2 h-2 rounded-full shrink-0
                      ${isFinancial ? 'bg-amber-500' : 'bg-blue-500'}
                    `} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate mb-0.5">
                        {summary}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{request.proposedByEmail}</span>
                        {dateStr && (
                          <>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </>
                        )}
                      </div>
                      {isFinancial && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                            Financial
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
