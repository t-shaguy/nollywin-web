"use client";
import { useState, useEffect } from "react";
import { CheckCircle, ChevronRight, Calendar, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DownloadMenu } from "@/components/admin/download-menu";
import { PrintView } from "@/components/admin/print-view";
import { ApprovalDetailDrawer } from "@/components/admin/approval-detail-drawer";
import { getReportConfig } from "@/lib/export/report-config";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { summarizeChangeRequest } from "@/lib/utils/change-request-summary";
import {
  getChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type ChangeRequest,
} from "@/lib/api/admin";

type StatusFilter = "ALL" | "DRAW" | "WINNER";

export default function ChangeRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showPrintView, setShowPrintView] = useState(false);
  const adminSession = useAdminAuthStore((s) => s.session);

  // Detail drawer state - controlled by URL
  const crId = searchParams.get("cr");
  const selectedRequest = changeRequests.find((r) => r.id === crId) || null;

  // Set page title
  useEffect(() => {
    document.title = "Approvals | NollyWin Admin";
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Role-based permissions
  const isChecker = adminSession?.role === "AUTH";
  const canApproveReject = isChecker;

  const isOwnRequest = (request: ChangeRequest): boolean => {
    if (!adminSession?.admin?.email) return false;
    const loggedInEmail = adminSession.admin.email.trim().toLowerCase();
    const proposedEmail = request.proposedByEmail.trim().toLowerCase();
    return loggedInEmail === proposedEmail;
  };

  // Load change requests
  useEffect(() => {
    async function loadChangeRequests() {
      try {
        setLoading(true);
        setError(null);
        const data = await getChangeRequests("PENDING");
        setChangeRequests(data);
      } catch (err) {
        console.error("Error loading change requests:", err);
        setError(err instanceof Error ? err.message : "Failed to load change requests");
      } finally {
        setLoading(false);
      }
    }

    loadChangeRequests();
  }, []);

  // Filter by type (DRAW or WINNER)
  const filteredRequests = changeRequests.filter((r) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "DRAW") return r.resourceType.toLowerCase().includes("draw");
    if (statusFilter === "WINNER") return r.resourceType.toLowerCase().includes("winner");
    return true;
  });

  const handleApprove = async (request: ChangeRequest, note?: string) => {
    if (!canApproveReject) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await approveChangeRequest(request.id, note);

      setSuccessMessage(
        response.resultSummary || response.approvalNote || "Change request approved successfully"
      );

      // Remove from list
      setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));

      // Close drawer
      router.push("/admin/change-requests");
    } catch (err: any) {
      console.error("Error approving change request:", err);

      const backendMessage = err?.message || err?.error || "Failed to approve change request";

      if (err?.status === 403 || backendMessage.includes("403") || backendMessage.includes("Forbidden")) {
        setError(
          "Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator."
        );
      } else if (err?.status >= 400 && err?.status < 500) {
        setError(backendMessage);
      } else {
        setError(backendMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (request: ChangeRequest, reason: string) => {
    if (!canApproveReject) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await rejectChangeRequest(request.id, reason);

      setSuccessMessage(`Change request rejected: ${response.rejectionReason || "Rejected"}`);

      // Remove from list
      setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));

      // Close drawer
      router.push("/admin/change-requests");
    } catch (err: any) {
      console.error("Error rejecting change request:", err);

      const backendMessage = err?.message || err?.error || "Failed to reject change request";

      if (err?.status === 403 || backendMessage.includes("403") || backendMessage.includes("Forbidden")) {
        setError(
          "Access denied: Your admin account doesn't have CHECKER role permissions. Please contact your system administrator."
        );
      } else if (err?.status >= 400 && err?.status < 500) {
        setError(backendMessage);
      } else {
        setError(backendMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardClick = (request: ChangeRequest) => {
    router.push(`/admin/change-requests?cr=${request.id}`);
  };

  const handleCloseDrawer = () => {
    router.push("/admin/change-requests");
  };

  // Format short date for preview cards
  const formatShortDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "Africa/Lagos",
      }).format(date);
    } catch {
      return "";
    }
  };

  if (loading && changeRequests.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <AdminPageHeader title="Approvals" description="Review and approve change requests" />
        <div className="py-8 flex items-center justify-center">
          <div className="text-muted-foreground text-xs">Loading approvals...</div>
        </div>
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
          Status: "PENDING",
          Type: statusFilter === "ALL" ? "All" : statusFilter,
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
          filters={{ status: "PENDING" }}
          onPrintClick={() => setShowPrintView(true)}
        />
      </div>

      {/* Type Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "DRAW", "WINNER"] as StatusFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {filter === "ALL" ? "All" : `${filter.charAt(0)}${filter.slice(1).toLowerCase()}s`}
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

      {/* Preview Cards */}
      {filteredRequests.length === 0 && !loading ? (
        <div className="py-12 text-center">
          <div className="text-muted-foreground text-sm">
            {statusFilter === "ALL" ? "No pending approvals" : `No pending ${statusFilter.toLowerCase()}s`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredRequests.map((request) => {
            const summary = summarizeChangeRequest(request);
            const dateStr = formatShortDate(request.createdAt);

            return (
              <button
                key={request.id}
                onClick={() => handleCardClick(request)}
                className="w-full bg-card border border-border rounded-xl p-4 hover:bg-secondary/30 hover:border-primary/50 transition-all text-left flex items-start gap-3 group"
              >
                {/* Status Indicator */}
                <div
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    request.financial ? "bg-amber-500" : "bg-blue-500"
                  }`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="font-medium text-sm truncate">{summary}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User size={12} />
                      <span className="truncate max-w-[200px]">{request.proposedByEmail}</span>
                    </div>
                    {dateStr && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{dateStr}</span>
                      </div>
                    )}
                  </div>
                  {request.financial && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                      Financial
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <ChevronRight
                  size={20}
                  className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <ApprovalDetailDrawer
        open={!!selectedRequest}
        onClose={handleCloseDrawer}
        request={selectedRequest}
        submitting={submitting}
        onApprove={handleApprove}
        onReject={handleReject}
        canApproveReject={canApproveReject}
        isOwnRequest={selectedRequest ? isOwnRequest(selectedRequest) : false}
      />
    </div>
  );
}
