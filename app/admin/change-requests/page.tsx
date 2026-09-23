"use client";
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<ChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await approveChangeRequest(request.id);
      
      // Show success message with resultSummary if available
      setSuccessMessage(response.resultSummary || response.approvalNote || "Change request approved successfully");
      
      // Remove from pending list (optimistic)
      setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error("Error approving change request:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to approve change request";
      
      // Check for 403 Forbidden
      if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
        setError("Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator.");
      } else {
        setError(errorMessage);
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
    } catch (err) {
      console.error("Error rejecting change request:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to reject change request";
      
      // Check for 403 Forbidden
      if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
        setError("Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator.");
      } else {
        setError(errorMessage);
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold">Verifications</h1>
          <p className="text-muted-foreground mt-2">Review and approve change requests</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading change requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Verifications</h1>
          <p className="text-muted-foreground mt-2">Review and approve change requests</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
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
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Change Requests */}
      {changeRequests.length === 0 && !loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          {statusFilter === "ALL"
            ? "No change requests yet"
            : `No ${statusFilter.toLowerCase()} change requests`}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {changeRequests.map((request) => {
            const parsedBody = parseRequestBody(request.requestBody);
            
            return (
              <div key={request.id} className="bg-card border border-border rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-lg">{request.resourceType}</h3>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getActionColor(request.action)}`}>
                      {request.action}
                    </span>
                    {request.financial && (
                      <span className="text-xs font-medium px-3 py-1 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-600">
                        FINANCIAL
                      </span>
                    )}
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
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
                <div className="text-sm text-muted-foreground mb-4">
                  <p>
                    Proposed by <span className="font-medium text-foreground">{request.proposedByEmail}</span> on{" "}
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Request Body */}
                <div className="bg-secondary/30 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium mb-2">Request Details:</p>
                  {parsedBody ? (
                    <div className="space-y-1">
                      {Object.entries(parsedBody).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-sm">
                          <span className="font-medium text-muted-foreground min-w-[120px]">{key}:</span>
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
                  <div className="border-t border-border pt-4 mb-4 space-y-2 text-sm">
                    {request.reviewedByEmail && (
                      <p>
                        Reviewed by <span className="font-medium">{request.reviewedByEmail}</span>
                        {request.reviewedAt && ` on ${new Date(request.reviewedAt).toLocaleString()}`}
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
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={submitting}
                      variant="gradient"
                      className="flex-1"
                    >
                      {submitting ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(request)}
                      disabled={submitting}
                      variant="outline"
                      className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
