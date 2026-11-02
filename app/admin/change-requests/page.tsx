"use client";
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-card";
import { useAdminAuthStore } from "@/store/admin-auth-store";
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
  const adminSession = useAdminAuthStore((s) => s.session);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<ChangeRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectingRequest, setRejectingRequest] = useState<ChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Log admin session in dev to check for role field
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && adminSession) {
      console.debug('[AdminChangeRequests] Admin session:', adminSession);
    }
  }, [adminSession]);

  // Check if logged-in admin proposed this request
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
    setRejectingRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
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

  // Parse JSON request body safely
  const parseRequestBody = (requestBody: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(requestBody);
    } catch {
      return null;
    }
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-500/10 border-green-500/30 text-green-600";
      case "UPDATE":
        return "bg-blue-500/10 border-blue-500/30 text-blue-600";
      case "DELETE":
        return "bg-red-500/10 border-red-500/30 text-red-600";
      default:
        return "bg-gray-500/10 border-gray-500/30 text-gray-600";
    }
  };

  if (loading && changeRequests.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <AdminPageHeader title="Verifications" description="Review and approve change requests" />
        <AdminCard>
          <div className="py-8 flex items-center justify-center">
            <div className="text-muted-foreground text-xs">Loading change requests...</div>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <AdminPageHeader title="Verifications" description="Review and approve change requests" />

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
              : `No ${statusFilter.toLowerCase()} change requests`}
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {changeRequests.map((request) => {
            const parsedBody = parseRequestBody(request.requestBody);
            
            return (
              <AdminCard key={request.id}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                      <h3 className="font-bold text-sm">{request.resourceType}</h3>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className={`text-xs font-semibold ${
                        request.action === "CREATE" ? "text-green-600" :
                        request.action === "UPDATE" ? "text-blue-600" :
                        request.action === "DELETE" ? "text-red-600" :
                        "text-muted-foreground"
                      }`}>
                        {request.action}
                      </span>
                    </div>
                    {request.financial && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-600">
                        FINANCIAL
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      request.status === "PENDING"
                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600"
                        : request.status === "APPROVED"
                        ? "bg-green-500/10 border-green-500/30 text-green-600"
                        : "bg-red-500/10 border-red-500/30 text-red-600"
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground mb-3">
                  <p>
                    Proposed by <span className="font-medium text-foreground">{request.proposedByEmail}</span> on{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Request Body */}
                <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium mb-1.5">Request Details:</p>
                  {parsedBody ? (
                    <div className="space-y-1">
                      {Object.entries(parsedBody).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-muted-foreground min-w-[100px]">{key}:</span>
                          <span className="text-foreground break-all">
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-xs overflow-auto">{request.requestBody}</pre>
                  )}
                </div>

                {/* Review Info (for non-PENDING) */}
                {request.status !== "PENDING" && (
                  <div className="border-t border-border pt-3 mb-3 space-y-1.5 text-xs">
                    {request.reviewedByEmail && (
                      <p>
                        Reviewed by <span className="font-medium">{request.reviewedByEmail}</span>
                        {request.reviewedAt && ` on ${new Date(request.reviewedAt).toLocaleDateString()}`}
                      </p>
                    )}
                    {request.approvalNote && (
                      <p className="text-green-600">
                        <span className="font-medium">Approval Note:</span> {request.approvalNote}
                      </p>
                    )}
                    {request.rejectionReason && (
                      <p className="text-red-600">
                        <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                      </p>
                    )}
                    {request.resultSummary && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Result:</span> {request.resultSummary}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions (PENDING only) */}
                {request.status === "PENDING" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={submitting || isOwnRequest(request)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isOwnRequest(request) ? "You proposed this request. A different admin must review it." : undefined}
                        aria-disabled={isOwnRequest(request)}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(request)}
                        disabled={submitting || isOwnRequest(request)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={isOwnRequest(request) ? "You proposed this request. A different admin must review it." : undefined}
                        aria-disabled={isOwnRequest(request)}
                      >
                        Reject
                      </Button>
                    </div>
                    {isOwnRequest(request) && (
                      <p className="text-xs text-muted-foreground italic text-center">
                        You proposed this request. A different admin must review it.
                      </p>
                    )}
                  </div>
                )}
              </AdminCard>
            );
          })}
        </div>
      )}

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
