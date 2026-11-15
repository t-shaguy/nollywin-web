/**
 * Approval Detail Drawer
 * 
 * Shows full details of a change request with file viewer:
 * - Desktop (≥1024px): Right-side drawer (480px width)
 * - Mobile (<1024px): Bottom sheet (90dvh height)
 * - File viewer for attached files
 * - Approval/Reject actions with required note for Financial
 * - Only non-empty fields displayed
 */

"use client";
import { X, ChevronLeft, FileText, Download, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils/date-format";
import { cleanLabel } from "@/lib/utils/label-cleaner";
import type { ChangeRequest } from "@/lib/api/admin";

interface ApprovalDetailDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** The change request to display */
  request: ChangeRequest | null;
  /** Whether approval/rejection is in progress */
  submitting?: boolean;
  /** Callback when approve is clicked */
  onApprove?: (request: ChangeRequest, note?: string) => void;
  /** Callback when reject is clicked */
  onReject?: (request: ChangeRequest, reason: string) => void;
  /** Whether the current user can approve/reject */
  canApproveReject?: boolean;
  /** Whether this is the user's own request */
  isOwnRequest?: boolean;
}

export function ApprovalDetailDrawer({
  open,
  onClose,
  request,
  submitting = false,
  onApprove,
  onReject,
  canApproveReject = false,
  isOwnRequest = false,
}: ApprovalDetailDrawerProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  if (!open || !request) return null;

  // Parse request body to extract fields
  const parseRequestBody = (body: string | null): Record<string, any> => {
    if (!body) return {};
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  };

  const requestData = parseRequestBody(request.requestBody);

  // Filter out empty fields
  const nonEmptyFields = Object.entries(requestData).filter(([_, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && Object.keys(value).length === 0) return false;
    return true;
  });

  // Humanize field key
  const humanizeKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Mask account number (show last 4 digits)
  const maskAccountNumber = (value: string): string => {
    const str = String(value);
    if (str.length <= 4) return str;
    return "****" + str.slice(-4);
  };

  // Format field value
  const formatValue = (key: string, value: any): string => {
    if (key.toLowerCase().includes("accountnumber")) {
      return maskAccountNumber(value);
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const handleApproveClick = () => {
    if (request.financial) {
      setApprovalNote("");
      setShowApprovalModal(true);
    } else {
      onApprove?.(request);
    }
  };

  const handleRejectClick = () => {
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleApprovalSubmit = () => {
    if (request.financial && !approvalNote.trim()) return;
    onApprove?.(request, approvalNote.trim() || undefined);
    setShowApprovalModal(false);
    setApprovalNote("");
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) return;
    onReject?.(request, rejectionReason.trim());
    setShowRejectModal(false);
    setRejectionReason("");
  };

  // Get file attachment URL if available
  const fileUrl = request.hasFile ? `/api/admin/change-requests/${request.id}/file` : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Right side on desktop, bottom sheet on mobile */}
      <div
        className={`
          fixed z-50 bg-background border-border overflow-hidden
          lg:top-0 lg:right-0 lg:h-full lg:w-[480px] lg:border-l
          max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:rounded-t-2xl max-lg:border-t
          max-lg:h-[90dvh]
          shadow-xl
          animate-in
          lg:slide-in-from-right
          max-lg:slide-in-from-bottom
          flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close detail view"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 id="drawer-title" className="text-sm font-bold flex-1">
            Request Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors lg:hidden"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Status */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status as "PENDING" | "APPROVED" | "REJECTED"} />
                <span className="text-sm font-medium">{request.status}</span>
              </div>
            </div>

            {/* Type Badge */}
            {request.financial && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-600">Financial Request</p>
                <p className="text-xs text-amber-600/80 mt-0.5">Approval note required</p>
              </div>
            )}

            {/* Proposed By */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Proposed by</div>
              <div className="text-sm">{cleanLabel(request.proposedByEmail)}</div>
              <div className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</div>
            </div>

            {/* Reviewed Info */}
            {request.status !== "PENDING" && request.reviewedByEmail && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Reviewed by</div>
                <div className="text-sm">{cleanLabel(request.reviewedByEmail)}</div>
                {request.reviewedAt && (
                  <div className="text-xs text-muted-foreground">{formatDateTime(request.reviewedAt)}</div>
                )}
                {request.approvalNote && (
                  <div className="mt-2 text-xs bg-green-500/10 border border-green-500/30 rounded p-2">
                    <span className="font-medium text-green-600">Note: </span>
                    <span className="text-green-600/90">{cleanLabel(request.approvalNote)}</span>
                  </div>
                )}
                {request.rejectionReason && (
                  <div className="mt-2 text-xs bg-red-500/10 border border-red-500/30 rounded p-2">
                    <span className="font-medium text-red-600">Reason: </span>
                    <span className="text-red-600/90">{cleanLabel(request.rejectionReason)}</span>
                  </div>
                )}
                {request.resultSummary && (
                  <div className="mt-2 text-xs bg-muted border border-border rounded p-2">
                    <span className="font-medium">Result: </span>
                    <span className="text-muted-foreground">{cleanLabel(request.resultSummary)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Request Fields - Only Non-Empty */}
            {nonEmptyFields.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Request data</div>
                <div className="space-y-2">
                  {nonEmptyFields.map(([key, value]) => (
                    <div key={key} className="bg-muted/30 rounded-lg p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {cleanLabel(humanizeKey(key))}
                      </div>
                      <div className="text-sm break-words whitespace-pre-wrap">
                        {formatValue(key, value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Attachment */}
            {fileUrl && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Attached file</div>
                <div className="border border-border rounded-lg p-3 flex items-center gap-3">
                  <div className="p-2 bg-muted rounded">
                    <FileText size={20} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">Attachment</div>
                    <div className="text-xs text-muted-foreground">View or download file</div>
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    aria-label="Download attachment"
                  >
                    <Download size={18} className="text-muted-foreground" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions - Fixed at bottom for PENDING requests */}
        {request.status === "PENDING" && (
          <div className="border-t border-border p-4 space-y-3 shrink-0 bg-background">
            {(!canApproveReject || isOwnRequest) && (
              <div className="text-xs text-muted-foreground text-center italic">
                {!canApproveReject
                  ? "Only a checker can approve or reject this request."
                  : "You proposed this request. A different admin must review it."}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleApproveClick}
                disabled={!canApproveReject || isOwnRequest || submitting}
                className="flex-1 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle size={16} className="mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleRejectClick}
                disabled={!canApproveReject || isOwnRequest || submitting}
                variant="outline"
                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      <Modal
        open={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovalNote("");
        }}
        title="Approve Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {request.financial
              ? "Please provide an approval note (required for financial requests)."
              : "Optionally provide an approval note."}
          </p>
          <textarea
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder="Enter approval note..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground resize-none min-h-[100px]"
            disabled={submitting}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowApprovalModal(false);
                setApprovalNote("");
              }}
              disabled={submitting}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              disabled={submitting || (request.financial && !approvalNote.trim())}
              className="flex-1 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90"
            >
              {submitting ? "Approving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason("");
        }}
        title="Reject Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please provide a reason for rejecting this request.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground resize-none min-h-[100px]"
            disabled={submitting}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              disabled={submitting}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={submitting || !rejectionReason.trim()}
              variant="gradient"
              className="flex-1"
            >
              {submitting ? "Rejecting..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
