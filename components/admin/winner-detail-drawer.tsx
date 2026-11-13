/**
 * Winner Detail Drawer
 * 
 * Full winner details with redemption information:
 * - Desktop (≥1024px): Wide side drawer from right (600px)
 * - Mobile (<1024px): Full screen modal
 */

"use client";
import { useState, useEffect } from "react";
import { X, User, Trophy, Gift, Clock, CheckCircle, FileText, Image as ImageIcon, FileIcon, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWinner, fetchProofBlob, type WinnerDetail, type Proof } from "@/lib/api/admin-winners";

interface WinnerDetailDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Winner ID to display */
  winnerId: string | null;
  /** Callback when redeem/fulfil action is triggered */
  onActionClick?: (action: "REDEEM_CASH" | "REDEEM_ITEM" | "FULFIL_CASH" | "FULFIL_ITEM", winnerId: string) => void;
}

export function WinnerDetailDrawer({
  open,
  onClose,
  winnerId,
  onActionClick,
}: WinnerDetailDrawerProps) {
  const [detail, setDetail] = useState<WinnerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<Proof | null>(null);
  const [proofBlob, setProofBlob] = useState<Blob | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  useEffect(() => {
    if (!open || !winnerId) {
      setDetail(null);
      setError(null);
      return;
    }

    async function loadDetail() {
      try {
        setLoading(true);
        setError(null);
        const data = await getWinner(winnerId!);
        setDetail(data);
      } catch (err) {
        console.error("Error loading winner detail:", err);
        setError(err instanceof Error ? err.message : "Failed to load winner details");
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [open, winnerId]);

  // View proof
  const handleViewProof = async (proof: Proof) => {
    try {
      setLoadingProof(true);
      console.log('Fetching proof:', { winnerId, proofId: proof.id, fileName: proof.fileName });
      const result = await fetchProofBlob(winnerId!, proof.id);
      setProofBlob(result.blob);
      setViewingProof(proof);
    } catch (err) {
      console.error("Error loading proof:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load proof";
      alert(`${errorMessage}\n\nPlease check:\n1. The proof file exists on the server\n2. You have permission to view it\n3. The backend endpoint is configured correctly`);
    } finally {
      setLoadingProof(false);
    }
  };

  // Close proof viewer
  const closeProofViewer = () => {
    setViewingProof(null);
    setProofBlob(null);
  };

  // Download proof
  const handleDownloadProof = () => {
    if (!proofBlob || !viewingProof) return;
    const url = URL.createObjectURL(proofBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = viewingProof.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Humanize proof kind
  const humanizeProofKind = (kind: string) => {
    return kind
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED":
        return "bg-blue-500/10 border-blue-500/30 text-blue-600";
      case "REDEEMED":
        return "bg-amber-500/10 border-amber-500/30 text-amber-600";
      case "DISBURSED":
        return "bg-green-500/10 border-green-500/30 text-green-600";
      default:
        return "bg-secondary border-border text-muted-foreground";
    }
  };

  // Get prize type badge
  const getPrizeTypeBadge = (prizeType: string) => {
    if (prizeType === "CASH") {
      return "bg-green-500/10 border-green-500/30 text-green-600";
    }
    return "bg-blue-500/10 border-blue-500/30 text-blue-600";
  };

  if (!open) return null;

  // Proof viewer modal
  if (viewingProof && proofBlob) {
    const isImage = viewingProof.contentType.startsWith("image/");
    const blobUrl = URL.createObjectURL(proofBlob);

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 z-[60]"
          onClick={closeProofViewer}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <h3 className="text-sm font-semibold">{humanizeProofKind(viewingProof.kind)}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {viewingProof.fileName} • {formatFileSize(viewingProof.sizeBytes)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadProof}
                >
                  <Download size={14} className="mr-1" />
                  Download
                </Button>
                <button
                  onClick={closeProofViewer}
                  className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                  aria-label="Close proof viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-secondary/30">
              {isImage ? (
                <img
                  src={blobUrl}
                  alt={viewingProof.fileName}
                  className="max-w-full h-auto mx-auto rounded border border-border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileIcon size={48} className="text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Preview not available for this file type
                  </p>
                  <Button onClick={handleDownloadProof}>
                    <Download size={14} className="mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Wide side drawer on desktop, full screen on mobile */}
      <div
        className={`
          fixed z-50 bg-background border-border
          lg:top-0 lg:right-0 lg:h-full lg:w-[600px] lg:border-l
          max-lg:inset-0
          shadow-xl
          animate-in
          lg:slide-in-from-right
          max-lg:fade-in
          flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 id="drawer-title" className="text-sm font-bold">
            Winner Details
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
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <div className="text-sm text-muted-foreground">Loading winner details...</div>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
                {error}
              </div>
            </div>
          ) : detail ? (
            <div className="p-4 space-y-6">
              {/* Winner Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Winner</h3>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{detail.winner.subscriberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{detail.winner.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{detail.winner.phoneNumber}</span>
                  </div>
                  {detail.winner.subscriptionPackage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">
                        {detail.winner.subscriptionPackage}
                        {detail.winner.subscriptionStatus && ` (${detail.winner.subscriptionStatus})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Draw Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Draw</h3>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{detail.winner.drawName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-mono text-xs">{detail.winner.raffleCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Draw Date:</span>
                    <span>{formatDate(detail.winner.drawDate)}</span>
                  </div>
                  {detail.drawStartsOn && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span>
                        {formatDate(detail.drawStartsOn)} - {formatDate(detail.drawEndsOn)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prize Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Prize</h3>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prize:</span>
                    <span className="font-medium">
                      {detail.winner.prizeName ?? detail.winner.drawName}
                    </span>
                  </div>
                  {detail.winner.tierName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tier:</span>
                      <span className="font-medium">{detail.winner.tierName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge className={getPrizeTypeBadge(detail.winner.prizeType)}>
                      {detail.winner.prizeType}
                    </Badge>
                  </div>
                  {detail.winner.prizeType === "CASH" && detail.winner.cashAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold tabular-nums">
                        ₦{detail.winner.cashAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {detail.winner.rankPosition !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rank:</span>
                      <span className="font-medium">{detail.winner.rankPosition}</span>
                    </div>
                  )}
                  {detail.winner.points !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points:</span>
                      <span className="font-medium">{detail.winner.points}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Next Step */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Status</h3>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 space-y-3">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-muted-foreground">Current Status:</span>
                    <Badge className={getStatusBadge(detail.winner.status)}>
                      {detail.winner.status}
                    </Badge>
                  </div>
                  
                  {detail.winner.pendingAction && (
                    <div className="pt-2 border-t border-border">
                      <Badge className="bg-yellow-500/10 border-yellow-500/30 text-yellow-600 w-full justify-center">
                        {detail.winner.pendingAction} awaiting approval
                      </Badge>
                    </div>
                  )}

                  {detail.requires && onActionClick && (
                    <div className="pt-2 border-t border-border">
                      <Button
                        onClick={() => onActionClick(detail.requires!, winnerId!)}
                        className="w-full"
                        size="sm"
                      >
                        {detail.requires === "REDEEM_CASH" && "Redeem (CASH)"}
                        {detail.requires === "REDEEM_ITEM" && "Redeem (ITEM)"}
                        {detail.requires === "FULFIL_CASH" && "Fulfil (CASH)"}
                        {detail.requires === "FULFIL_ITEM" && "Fulfil (ITEM)"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Redemption Details */}
              {detail.redemption && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Redemption Details</h3>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-[13px]">
                    {detail.redemption.prizeType === "CASH" ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="font-medium">{detail.redemption.bankName || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Name:</span>
                          <span className="font-medium">{detail.redemption.accountName || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-mono text-xs">
                            {detail.redemption.accountNumber
                              ? `****${detail.redemption.accountNumber.slice(-4)}`
                              : "—"}
                          </span>
                        </div>
                        {detail.redemption.payoutReference && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payout Ref:</span>
                            <span className="font-mono text-xs">{detail.redemption.payoutReference}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contact Phone:</span>
                          <span className="font-medium">{detail.redemption.contactPhone || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Delivery Address:</span>
                          <span className="font-medium text-xs leading-relaxed">
                            {detail.redemption.deliveryAddress || "—"}
                          </span>
                        </div>
                      </>
                    )}
                    {detail.redemption.redeemNote && (
                      <div className="flex flex-col gap-1 pt-2 border-t border-border">
                        <span className="text-muted-foreground">Redeem Note:</span>
                        <span className="text-xs leading-relaxed">{detail.redemption.redeemNote}</span>
                      </div>
                    )}
                    {detail.redemption.fulfilNote && (
                      <div className="flex flex-col gap-1 pt-2 border-t border-border">
                        <span className="text-muted-foreground">Fulfil Note:</span>
                        <span className="text-xs leading-relaxed">{detail.redemption.fulfilNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Steps History */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Steps History</h3>
                </div>
                <div className="space-y-2">
                  {/* Selected */}
                  <div className="bg-secondary/50 rounded-lg p-3 text-[13px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Selected</span>
                      <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-600 text-xs">
                        Completed
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(detail.winner.selectedAt)}
                    </div>
                  </div>

                  {/* Redeemed */}
                  {detail.winner.redeemedAt && (
                    <div className="bg-secondary/50 rounded-lg p-3 text-[13px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Redeemed</span>
                        <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-600 text-xs">
                          Completed
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{formatDateTime(detail.winner.redeemedAt)}</div>
                        {detail.redemption?.redeemApprovedBy && (
                          <div>Approved by: {detail.redemption.redeemApprovedBy}</div>
                        )}
                        {detail.redemption?.redeemProposedBy && (
                          <div>Proposed by: {detail.redemption.redeemProposedBy}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fulfilled */}
                  {detail.winner.fulfilledAt && (
                    <div className="bg-secondary/50 rounded-lg p-3 text-[13px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Fulfilled</span>
                        <Badge className="bg-green-500/10 border-green-500/30 text-green-600 text-xs">
                          Completed
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{formatDateTime(detail.winner.fulfilledAt)}</div>
                        {detail.redemption?.fulfilledOn && (
                          <div>Fulfilled on: {detail.redemption.fulfilledOn}</div>
                        )}
                        {detail.redemption?.fulfilApprovedBy && (
                          <div>Approved by: {detail.redemption.fulfilApprovedBy}</div>
                        )}
                        {detail.redemption?.fulfilProposedBy && (
                          <div>Proposed by: {detail.redemption.fulfilProposedBy}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Proofs */}
              {detail.redemption && detail.redemption.proofs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Proofs ({detail.redemption.proofs.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {detail.redemption.proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="bg-secondary/50 rounded-lg p-3 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium mb-0.5">
                            {humanizeProofKind(proof.kind)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {proof.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(proof.sizeBytes)}</span>
                            <span>•</span>
                            <span>{formatDateTime(proof.uploadedAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            By: {proof.uploadedBy}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProof(proof)}
                          disabled={loadingProof}
                        >
                          <ExternalLink size={14} className="mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
