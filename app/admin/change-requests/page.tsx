"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-card";
import { DetailList } from "@/components/admin/value-renderer";
import { DownloadMenu } from "@/components/admin/download-menu";
import { PrintView } from "@/components/admin/print-view";
import { ApprovalsPreviewDrawer } from "@/components/admin/approvals-preview-drawer";
import { getReportConfig } from "@/lib/export/report-config";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils/date-format";
import {
  getChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type ChangeRequest,
} from "@/lib/api/admin";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function ChangeRequestsPage() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [showPrintView, setShowPrintView] = useState(false);
  const adminSession = useAdminAuthStore((s) => s.session);

  // Set page title
  useEffect(() => {
    document.title = "Approvals | NollyWin Admin";
  }, []);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<ChangeRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectingRequest, setRejectingRequest] = useState<ChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Preview drawer state
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const requestRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Role-based permissions: only CHECKER (AUTH) can approve/reject
  const isChecker = adminSession?.role === 'AUTH';
  const canApproveReject = isChecker;

  // Check if logged-in admin proposed this request (for checkers only)
  const isOwnRequest = (request: ChangeRequest): boolean => {
    if (!adminSession?.admin?.email) return false;
    const loggedInEmail = adminSession.admin.email.trim().toLowerCase();
    const proposedEmail = request.proposedByEmail.trim().toLowerCase();
    return loggedInEmail === proposedEmail;
  };

  useEffect(() => {
    async function loadChangeRequests() {
      try {
        setLoading(true);
        setError(null);
        const data = await getChangeRequests(statusFilter === "ALL" ? undefined : statusFilter);
        setChangeRequests(data);
      } catch (err) {
        console.error("Error loading change requests:", err);
        setError(err instanceof Error ? err.message : "Failed to load change requests");
      } finally {
        setLoading(false);
      }
    }
    
    loadChangeRequests();
  }, [statusFilter]);

  const handleApprove = async (request: ChangeRequest) => {
    // Only checker can approve
    if (!canApproveReject) return;
    
    // Show approval modal for financial requests (approvalNote required)
    if (request.financial) {
      setApprovingRequest(request);
      setApprovalNote("");
      setShowApprovalModal(true);
      return;
    }

    // Non-financial: approve directly
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await approveChangeRequest(request.id);
      
      // Show success message with resultSummary if available
      setSuccessMessage(response.resultSummary || response.approvalNote || "Change request approved successfully");
      
      // Remove from pending list (optimistic)
      setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: any) {
      console.error("Error approving change request:", err);
      
      // Extract backend error message
      const backendMessage = err?.message || err?.error || "Failed to approve change request";
      
      // Check for 403 Forbidden
      if (err?.status === 403 || backendMessage.includes("403") || backendMessage.includes("Forbidden")) {
        setError("Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator.");
      } 
      // For 4xx errors (including 409), show backend message and keep request in place
      else if (err?.status >= 400 && err?.status < 500) {
        setError(backendMessage);
        // Don't remove the request from the list - let user try again
      } 
      else {
        setError(backendMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalSubmit = async () => {
    // Only checker can approve
    if (!canApproveReject) return;
    
    if (!approvingRequest) return;

    // Financial requests require approval note
    if (approvingRequest.financial && !approvalNote.trim()) {
      setError("Approval note is required for financial change requests");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await approveChangeRequest(
        approvingRequest.id,
        approvalNote.trim() || undefined
      );
      
      // Show success message with resultSummary if available
      setSuccessMessage(response.resultSummary || response.approvalNote || "Change request approved successfully");
      
      // Remove from pending list (optimistic)
      setChangeRequests((prev) => prev.filter((r) => r.id !== approvingRequest.id));
      
      setShowApprovalModal(false);
      setApprovingRequest(null);
      setApprovalNote("");
    } catch (err: any) {
      console.error("Error approving change request:", err);
      
      // Extract backend error message
      const backendMessage = err?.message || err?.error || "Failed to approve change request";
      
      // Check for 403 Forbidden
      if (err?.status === 403 || backendMessage.includes("403") || backendMessage.includes("Forbidden")) {
        setError("Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator.");
      } 
      // For 4xx errors (including 409), show backend message and keep request in place
      else if (err?.status >= 400 && err?.status < 500) {
        setError(backendMessage);
        // Don't remove the request - leave modal open so user can see the error
        // They can close it manually and try again later
      } 
      else {
        setError(backendMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = (request: ChangeRequest) => {
    // Only checker can reject
    if (!canApproveReject) return;
    
    setRejectingRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    // Only checker can reject
    if (!canApproveReject) return;
    
    if (!rejectingRequest || !rejectionReason.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await rejectChangeRequest(rejectingRequest.id, rejectionReason);
      
      // Show success message
      setSuccessMessage(`Change request rejected: ${response.rejectionReason || "Rejected"}`);
      
      // Remove from pending list (optimistic)
      setChangeRequests((prev) => prev.filter((r) => r.id !== rejectingRequest.id));
      
      setShowRejectModal(false);
      setRejectingRequest(null);
      setRejectionReason("");
    } catch (err: any) {
      console.error("Error rejecting change request:", err);
      
      // Extract backend error message
      const backendMessage = err?.message || err?.error || "Failed to reject change request";
      
      // Check for 403 Forbidden
      if (err?.status === 403 || backendMessage.includes("403") || backendMessage.includes("Forbidden")) {
        setError("Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator.");
      } 
      // For 4xx errors, show backend message and keep request in place
      else if (err?.status >= 400 && err?.status < 500) {
        setError(backendMessage);
        // Don't remove the request - leave modal open
      } 
      else {
        setError(backendMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle request click from preview drawer
  const handlePreviewRequestClick = (request: ChangeRequest) => {
    setShowPreviewDrawer(false);
    
    // Scroll to the request card
    const element = requestRefs.current.get(request.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight effect
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  // Get only pending requests for preview
  const pendingRequests = changeRequests.filter(r => r.status === 'PENDING');

  // Parse JSON request body safely (for DetailList)
  const parseRequestBody = (requestBody: string | null): Record<string, unknown> | string => {
    if (!requestBody) return {};
    try {
      return JSON.parse(requestBody);
    } catch {
      // Return as-is string, DetailList will handle it
      return requestBody;
    }
  };

  // Humanize resource type (camelCase → Title Case)
  const humanizeResourceType = (resourceType: string): string => {
    return resourceType
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Humanize action
  const humanizeAction = (action: string): string => {
    switch (action) {
      case "CREATE": return "Create";
      case "UPDATE": return "Update";
      case "DELETE": return "Delete";
      case "CLOSE": return "Close";
      case "APPROVE": return "Approve";
      default: return action.charAt(0) + action.slice(1).toLowerCase();
    }
  };

  // Humanize status
  const humanizeStatus = (status: string): string => {
    switch (status) {
      case "PENDING": return "Pending (waiting for a checker)";
      case "APPROVED": return "Approved";
      case "REJECTED": return "Rejected";
      default: return status;
    }
  };

  // Humanize field key (camelCase → Title Case)
  const humanizeKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // No longer need local formatDate - using shared formatDateTime

  // No longer need getActionColor - using StatusBadge

  if (loading && changeRequests.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <AdminPageHeader title="Approvals" description="Review and approve change requests" />
        <AdminCard>
          <div className="py-8 flex items-center justify-center">
            <div className="text-muted-foreground text-xs">Loading change requests...</div>
          </div>
        </AdminCard>
      </div>
    );
  }

  // Print view
  if (showPrintView) {
    const config = getReportConfig("change-requests");
    if (!config) return null;

    return (
      <PrintView
        title="Change Requests"
        filters={{
          "Status": statusFilter === "ALL" ? "All" : statusFilter,
        }}
        columns={config.columns}
        data={changeRequests}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-4">
        <AdminPageHeader title="Approvals" description="Review and approve change requests" />
        <DownloadMenu
          reportKey="change-requests"
          filters={{ status: statusFilter === "ALL" ? undefined : statusFilter }}
          onPrintClick={() => setShowPrintView(true)}
        />
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-muted/50 border border-border rounded-xl p-3 flex items-start gap-2">
          <CheckCircle size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-xs text-foreground">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Change Requests */}
      {changeRequests.length === 0 && !loading ? (
        <AdminCard>
          <div className="py-8 text-center text-muted-foreground text-xs">
            {statusFilter === "ALL"
              ? "No change requests yet"
              : `No ${statusFilter.toLowerCase()} approvals`}
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {changeRequests.map((request) => {
            const parsedBody = parseRequestBody(request.requestBody);
            
            return (
              <div
                key={request.id}
                ref={(el) => {
                  if (el) {
                    requestRefs.current.set(request.id, el);
                  } else {
                    requestRefs.current.delete(request.id);
                  }
                }}
                className="transition-all duration-300 rounded-xl"
              >
                <AdminCard>
                {/* Detailed Information List */}
                <div className="space-y-3">
                  {/* Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xs text-muted-foreground min-w-[120px]">Item:</span>
                    <span className="font-medium text-sm">{humanizeResourceType(request.resourceType)}</span>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xs text-muted-foreground min-w-[120px]">Action:</span>
                    <span className="font-medium text-sm">{humanizeAction(request.action)}</span>
                  </div>

                  {/* Approval Type */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xs text-muted-foreground min-w-[120px]">Approval type:</span>
                    <span className="font-medium text-sm">
                      {request.financial 
                        ? "Financial (needs an approval note)" 
                        : "Standard"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xs text-muted-foreground min-w-[120px]">Status:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{humanizeStatus(request.status)}</span>
                      <StatusBadge status={request.status as "PENDING" | "APPROVED" | "REJECTED"} />
                    </div>
                  </div>

                  {/* Proposed By */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xs text-muted-foreground min-w-[120px]">Proposed by:</span>
                    <span className="font-medium text-sm">
                      {request.proposedByEmail} on {formatDateTime(request.createdAt)}
                    </span>
                  </div>

                  {/* Review Info (for non-PENDING) */}
                  {request.status !== "PENDING" && request.reviewedByEmail && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-xs text-muted-foreground min-w-[120px]"></span>
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          Reviewed by {request.reviewedByEmail}
                          {request.reviewedAt && ` on ${formatDateTime(request.reviewedAt)}`}
                        </p>
                        {request.approvalNote && (
                          <p className="text-green-600">
                            <span className="font-medium">Note:</span> {request.approvalNote}
                          </p>
                        )}
                        {request.rejectionReason && (
                          <p className="text-red-600">
                            <span className="font-medium">Reason:</span> {request.rejectionReason}
                          </p>
                        )}
                        {request.resultSummary && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Result:</span> {request.resultSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Details */}
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Request details:</p>
                    <DetailList data={parsedBody as Record<string, unknown>} />
                  </div>
                </div>

                {/* Actions (PENDING only) */}
                {request.status === "PENDING" && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={!canApproveReject || (canApproveReject && isOwnRequest(request)) || submitting}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
                        title={
                          !canApproveReject 
                            ? "Only a checker can approve or reject this request." 
                            : (isOwnRequest(request) ? "You proposed this request. A different admin must review it." : undefined)
                        }
                        aria-disabled={!canApproveReject || (canApproveReject && isOwnRequest(request))}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(request)}
                        disabled={!canApproveReject || (canApproveReject && isOwnRequest(request)) || submitting}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-destructive/50"
                        title={
                          !canApproveReject 
                            ? "Only a checker can approve or reject this request." 
                            : (isOwnRequest(request) ? "You proposed this request. A different admin must review it." : undefined)
                        }
                        aria-disabled={!canApproveReject || (canApproveReject && isOwnRequest(request))}
                      >
                        Reject
                      </Button>
                    </div>
                    {!canApproveReject && (
                      <p className="text-xs text-muted-foreground italic text-center">
                        Only a checker can approve or reject this request.
                      </p>
                    )}
                    {canApproveReject && isOwnRequest(request) && (
                      <p className="text-xs text-muted-foreground italic text-center">
                        You proposed this request. A different admin must review it.
                      </p>
                    )}
                  </div>
                )}
              </AdminCard>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Preview Button - Only show when there are pending requests */}
      {pendingRequests.length > 0 && (
        <button
          onClick={() => setShowPreviewDrawer(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          aria-label="Open approvals preview"
        >
          <List size={20} />
          <span className="text-sm font-medium pr-1">{pendingRequests.length}</span>
        </button>
      )}

      {/* Preview Drawer */}
      <ApprovalsPreviewDrawer
        open={showPreviewDrawer}
        onClose={() => setShowPreviewDrawer(false)}
        requests={pendingRequests}
        onRequestClick={handlePreviewRequestClick}
        loading={loading}
      />

      {/* Approval Modal (for financial requests) */}
      <Modal
        open={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovingRequest(null);
          setApprovalNote("");
        }}
        title="Approve Change Request"
      >
        <div className="space-y-4">
          {approvingRequest?.financial && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-600 text-xs">
              <p className="font-medium">Financial Change Request</p>
              <p className="mt-1">Approval note is required for financial transactions.</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {approvingRequest?.financial 
              ? "Please provide an approval note explaining your decision." 
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
                setApprovingRequest(null);
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
              disabled={submitting || (approvingRequest?.financial && !approvalNote.trim())}
              className="flex-1 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90"
            >
              {submitting ? "Approving..." : "Confirm Approve"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectingRequest(null);
          setRejectionReason("");
        }}
        title="Reject Change Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please provide a reason for rejecting this change request.
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
                setRejectingRequest(null);
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
              {submitting ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
