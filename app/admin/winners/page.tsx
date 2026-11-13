"use client";
import { useState, useEffect } from "react";
import { Search, Filter, Trophy, ChevronLeft, ChevronRight, Eye, AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DownloadMenu } from "@/components/admin/download-menu";
import { PrintView } from "@/components/admin/print-view";
import { WinnerDetailDrawer } from "@/components/admin/winner-detail-drawer";
import {
  RedeemCashModal,
  RedeemItemModal,
  FulfilCashModal,
  FulfilItemModal,
} from "@/components/admin/winner-action-modals";
import { getReportConfig } from "@/lib/export/report-config";
import { 
  listWinners, 
  listRedemptions, 
  type WinnerRow, 
  type RedemptionRow 
} from "@/lib/api/admin-winners";
import {
  DataTableContainer,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableCellStack,
  DataTableEmpty,
  DataTableSkeleton,
} from "@/components/ui/data-table";
import { StatusBadge, AwaitingApprovalBadge, TypeBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/utils/date-format";

type TabType = "winners" | "redemptions";

export default function WinnersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("winners");
  const [showPrintView, setShowPrintView] = useState(false);

  // Winners state
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [winnersPage, setWinnersPage] = useState(0);
  const [winnersTotalPages, setWinnersTotalPages] = useState(0);
  const [winnersTotal, setWinnersTotal] = useState(0);
  const pageSize = 50;

  // Winners filters
  const [winnersFilters, setWinnersFilters] = useState({
    drawId: "",
    status: "",
    prizeType: "",
    search: "",
    from: "",
    to: "",
  });

  // Redemptions state
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [redemptionsError, setRedemptionsError] = useState<string | null>(null);
  const [redemptionsPage, setRedemptionsPage] = useState(0);
  const [redemptionsTotalPages, setRedemptionsTotalPages] = useState(0);
  const [redemptionsTotal, setRedemptionsTotal] = useState(0);

  // Redemptions filters
  const [redemptionsFilters, setRedemptionsFilters] = useState({
    drawId: "",
    redeemType: "",
    status: "",
    search: "",
    from: "",
    to: "",
  });

  // Selected winner for detail drawer
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [selectedWinnerName, setSelectedWinnerName] = useState<string>("");
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  // Action modals state
  const [showRedeemCashModal, setShowRedeemCashModal] = useState(false);
  const [showRedeemItemModal, setShowRedeemItemModal] = useState(false);
  const [showFulfilCashModal, setShowFulfilCashModal] = useState(false);
  const [showFulfilItemModal, setShowFulfilItemModal] = useState(false);

  // Handle view winner
  const handleViewWinner = (winnerId: string) => {
    const winner = winners.find((w) => w.id === winnerId);
    setSelectedWinnerId(winnerId);
    setSelectedWinnerName(winner?.subscriberName || "Unknown");
    setShowDetailDrawer(true);
  };

  // Handle close detail drawer
  const handleCloseDetailDrawer = () => {
    setShowDetailDrawer(false);
    setSelectedWinnerId(null);
    setSelectedWinnerName("");
  };

  // Handle action from detail drawer (redeem/fulfil)
  const handleActionClick = (
    action: "REDEEM_CASH" | "REDEEM_ITEM" | "FULFIL_CASH" | "FULFIL_ITEM",
    winnerId: string
  ) => {
    const winner = winners.find((w) => w.id === winnerId);
    setSelectedWinnerId(winnerId);
    setSelectedWinnerName(winner?.subscriberName || "Unknown");
    
    // Close detail drawer
    setShowDetailDrawer(false);
    
    // Open appropriate modal
    switch (action) {
      case "REDEEM_CASH":
        setShowRedeemCashModal(true);
        break;
      case "REDEEM_ITEM":
        setShowRedeemItemModal(true);
        break;
      case "FULFIL_CASH":
        setShowFulfilCashModal(true);
        break;
      case "FULFIL_ITEM":
        setShowFulfilItemModal(true);
        break;
    }
  };

  // Handle action success (reload winners)
  const handleActionSuccess = () => {
    loadWinners();
  };

  // Load winners
  const loadWinners = async () => {
    try {
      setWinnersLoading(true);
      setWinnersError(null);
      const response = await listWinners({
        ...winnersFilters,
        page: winnersPage,
        size: pageSize,
      });
      setWinners(response.entries);
      setWinnersTotal(response.total);
      setWinnersTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      console.error("Error loading winners:", err);
      setWinnersError(err instanceof Error ? err.message : "Failed to load winners");
    } finally {
      setWinnersLoading(false);
    }
  };

  // Load redemptions
  const loadRedemptions = async () => {
    try {
      setRedemptionsLoading(true);
      setRedemptionsError(null);
      const response = await listRedemptions({
        ...redemptionsFilters,
        page: redemptionsPage,
        size: pageSize,
      });
      setRedemptions(response.entries);
      setRedemptionsTotal(response.total);
      setRedemptionsTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      console.error("Error loading redemptions:", err);
      setRedemptionsError(err instanceof Error ? err.message : "Failed to load redemptions");
    } finally {
      setRedemptionsLoading(false);
    }
  };

  // Load winners on mount and when page/filters change
  useEffect(() => {
    if (activeTab === "winners") {
      loadWinners();
    }
  }, [winnersPage, activeTab]);

  // Load redemptions when tab switches
  useEffect(() => {
    if (activeTab === "redemptions") {
      loadRedemptions();
    }
  }, [redemptionsPage, activeTab]);

  // Apply winners filters
  const applyWinnersFilters = () => {
    setWinnersPage(0);
    loadWinners();
  };

  // Apply redemptions filters
  const applyRedemptionsFilters = () => {
    setRedemptionsPage(0);
    loadRedemptions();
  };

  // Get redemption summary stats
  const redemptionStats = {
    totalAmount: redemptions
      .filter((r) => r.prizeType === "CASH")
      .reduce((sum, r) => sum + (r.cashAmount || 0), 0),
    cashCount: redemptions.filter((r) => r.prizeType === "CASH").length,
    itemCount: redemptions.filter((r) => r.prizeType === "ITEM").length,
  };

  // Print view for winners
  if (showPrintView && activeTab === "winners") {
    const config = getReportConfig("winners");
    if (!config) return null;

    return (
      <PrintView
        title="Winners Report"
        filters={{
          "Draw ID": winnersFilters.drawId || "Any",
          "Status": winnersFilters.status || "All",
          "Prize Type": winnersFilters.prizeType || "All",
          "Search": winnersFilters.search || "None",
          "From": winnersFilters.from || "Any",
          "To": winnersFilters.to || "Any",
        }}
        columns={config.columns}
        data={winners as unknown as Record<string, unknown>[]}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  // Print view for redemptions
  if (showPrintView && activeTab === "redemptions") {
    const config = getReportConfig("redemptions");
    if (!config) return null;

    return (
      <PrintView
        title="Redemptions Report"
        filters={{
          "Draw ID": redemptionsFilters.drawId || "Any",
          "Type": redemptionsFilters.redeemType || "All",
          "Status": redemptionsFilters.status || "All",
          "Search": redemptionsFilters.search || "None",
          "From": redemptionsFilters.from || "Any",
          "To": redemptionsFilters.to || "Any",
        }}
        columns={config.columns}
        data={redemptions as unknown as Record<string, unknown>[]}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <AdminPageHeader
          title="Winners"
          description="Manage draw winners and prize redemptions"
        />
        {((activeTab === "winners" && winners.length > 0) ||
          (activeTab === "redemptions" && redemptions.length > 0)) && (
          <DownloadMenu
            reportKey={activeTab === "winners" ? "winners" : "redemptions"}
            filters={activeTab === "winners" ? winnersFilters : redemptionsFilters}
            onPrintClick={() => setShowPrintView(true)}
          />
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("winners")}
          className={`px-4 py-2 text-[13px] font-medium transition-colors rounded-t ${
            activeTab === "winners"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Winners
        </button>
        <button
          onClick={() => setActiveTab("redemptions")}
          className={`px-4 py-2 text-[13px] font-medium transition-colors rounded-t ${
            activeTab === "redemptions"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Redemptions
        </button>
      </div>

      {/* Winners Tab */}
      {activeTab === "winners" && (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Draw ID</label>
                <input
                  type="text"
                  value={winnersFilters.drawId}
                  onChange={(e) =>
                    setWinnersFilters({ ...winnersFilters, drawId: e.target.value })
                  }
                  placeholder="Enter draw ID"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Status</label>
                <select
                  value={winnersFilters.status}
                  onChange={(e) =>
                    setWinnersFilters({ ...winnersFilters, status: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REDEEMED">Redeemed</option>
                  <option value="DISBURSED">Disbursed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Prize Type</label>
                <select
                  value={winnersFilters.prizeType}
                  onChange={(e) =>
                    setWinnersFilters({ ...winnersFilters, prizeType: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="CASH">Cash</option>
                  <option value="ITEM">Item</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Search</label>
                <input
                  type="text"
                  value={winnersFilters.search}
                  onChange={(e) =>
                    setWinnersFilters({ ...winnersFilters, search: e.target.value })
                  }
                  placeholder="Name, email, or phone"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">From Date</label>
                <input
                  type="date"
                  value={winnersFilters.from}
                  onChange={(e) =>
                    setWinnersFilters({ ...winnersFilters, from: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">To Date</label>
                <input
                  type="date"
                  value={winnersFilters.to}
                  onChange={(e) =>
                    setWinnersFilters({ ...winnersFilters, to: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
            </div>

            <Button onClick={applyWinnersFilters} size="sm" className="w-full md:w-auto">
              Apply Filters
            </Button>
          </div>

          {/* Error Message */}
          {winnersError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
              {winnersError}
            </div>
          )}

          {/* Loading State */}
          {winnersLoading && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
              Loading winners...
            </div>
          )}

          {/* Winners Table */}
          {!winnersLoading && winners.length > 0 && (
            <>
              <DataTableContainer stickyFirstColumn>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead sticky>Winner</DataTableHead>
                    <DataTableHead>Phone</DataTableHead>
                    <DataTableHead>Draw</DataTableHead>
                    <DataTableHead>Prize</DataTableHead>
                    <DataTableHead>Type</DataTableHead>
                    <DataTableHead align="right">Amount</DataTableHead>
                    <DataTableHead>Plan</DataTableHead>
                    <DataTableHead>Rank / Points</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead>Awaiting approval</DataTableHead>
                    <DataTableHead>Selected on</DataTableHead>
                    <DataTableHead align="right"><span className="sr-only">Actions</span></DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {winners.map((winner) => {
                    const prizeName = winner.prizeName ?? winner.drawName;
                    const tierLabel = winner.tierName ? `Tier: ${winner.tierName}` : "No tier";
                    const planWithStatus = winner.subscriptionPackage
                      ? `${winner.subscriptionPackage}${winner.subscriptionStatus ? ` · ${winner.subscriptionStatus}` : ""}`
                      : "—";
                    const rankPoints = (winner.rankPosition && winner.points)
                      ? `${winner.rankPosition} · ${winner.points} pts`
                      : "—";

                    return (
                      <DataTableRow key={winner.id} onClick={() => handleViewWinner(winner.id)}>
                        <DataTableCell sticky>
                          <DataTableCellStack
                            primary={winner.subscriberName}
                            secondary={winner.email}
                          />
                        </DataTableCell>
                        <DataTableCell>{winner.phoneNumber}</DataTableCell>
                        <DataTableCell>
                          <DataTableCellStack
                            primary={winner.drawName}
                            secondary={<span className="font-mono" title="Draw code">{winner.raffleCode}</span>}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <DataTableCellStack
                            primary={prizeName}
                            secondary={tierLabel}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <TypeBadge type={winner.prizeType} />
                        </DataTableCell>
                        <DataTableCell align="right" className="tabular-nums font-medium">
                          {winner.prizeType === "CASH" && winner.cashAmount
                            ? `₦${winner.cashAmount.toLocaleString()}`
                            : "—"}
                        </DataTableCell>
                        <DataTableCell className="text-muted-foreground">
                          {planWithStatus}
                        </DataTableCell>
                        <DataTableCell className="text-muted-foreground">
                          {rankPoints}
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge status={winner.status as any} prizeType={winner.prizeType} />
                        </DataTableCell>
                        <DataTableCell>
                          {winner.pendingAction ? (
                            <AwaitingApprovalBadge action={winner.pendingAction} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </DataTableCell>
                        <DataTableCell className="text-muted-foreground">
                          {formatDateTime(winner.selectedAt)}
                        </DataTableCell>
                        <DataTableCell align="right">
                          <ChevronDown size={16} className="text-muted-foreground" />
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTableContainer>

              {/* Pagination */}
              {winnersTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {winnersPage + 1} of {winnersTotalPages} • {winnersTotal.toLocaleString()}{" "}
                    total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setWinnersPage((p) => Math.max(0, p - 1))}
                      disabled={winnersPage === 0 || winnersLoading}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setWinnersPage((p) => Math.min(winnersTotalPages - 1, p + 1))
                      }
                      disabled={winnersPage >= winnersTotalPages - 1 || winnersLoading}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!winnersLoading && winners.length === 0 && (
            <DataTableEmpty
              message="No winners found matching your filters."
              icon={<Trophy size={32} className="text-muted-foreground" />}
            />
          )}

          {/* Loading State */}
          {winnersLoading && <DataTableSkeleton rows={5} columns={12} />}
        </>
      )}

      {/* Redemptions Tab */}
      {activeTab === "redemptions" && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total Cash Disbursed
              </p>
              <p className="text-2xl font-bold tabular-nums">
                ₦{redemptionStats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Cash Redemptions
              </p>
              <p className="text-2xl font-bold tabular-nums">{redemptionStats.cashCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Item Redemptions
              </p>
              <p className="text-2xl font-bold tabular-nums">{redemptionStats.itemCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Draw ID</label>
                <input
                  type="text"
                  value={redemptionsFilters.drawId}
                  onChange={(e) =>
                    setRedemptionsFilters({ ...redemptionsFilters, drawId: e.target.value })
                  }
                  placeholder="Enter draw ID"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Type</label>
                <select
                  value={redemptionsFilters.redeemType}
                  onChange={(e) =>
                    setRedemptionsFilters({ ...redemptionsFilters, redeemType: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="CASH">Cash</option>
                  <option value="ITEM">Item</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Status</label>
                <select
                  value={redemptionsFilters.status}
                  onChange={(e) =>
                    setRedemptionsFilters({ ...redemptionsFilters, status: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="REDEEMED">Redeemed</option>
                  <option value="DISBURSED">Disbursed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Search</label>
                <input
                  type="text"
                  value={redemptionsFilters.search}
                  onChange={(e) =>
                    setRedemptionsFilters({ ...redemptionsFilters, search: e.target.value })
                  }
                  placeholder="Name, email, or phone"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">From Date</label>
                <input
                  type="date"
                  value={redemptionsFilters.from}
                  onChange={(e) =>
                    setRedemptionsFilters({ ...redemptionsFilters, from: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">To Date</label>
                <input
                  type="date"
                  value={redemptionsFilters.to}
                  onChange={(e) =>
                    setRedemptionsFilters({ ...redemptionsFilters, to: e.target.value })
                  }
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
            </div>

            <Button onClick={applyRedemptionsFilters} size="sm" className="w-full md:w-auto">
              Apply Filters
            </Button>
          </div>

          {/* Error Message */}
          {redemptionsError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
              {redemptionsError}
            </div>
          )}

          {/* Loading State */}
          {redemptionsLoading && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
              Loading redemptions...
            </div>
          )}

          {/* Redemptions Table */}
          {!redemptionsLoading && redemptions.length > 0 && (
            <>
              <DataTableContainer>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Winner</DataTableHead>
                    <DataTableHead>Phone</DataTableHead>
                    <DataTableHead>Draw</DataTableHead>
                    <DataTableHead>Prize</DataTableHead>
                    <DataTableHead>Type</DataTableHead>
                    <DataTableHead align="right">Amount</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead>Redeemed on</DataTableHead>
                    <DataTableHead>Paid/Collected on</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {redemptions.map((redemption) => {
                    const prizeName = redemption.prizeName ?? redemption.drawName;

                    return (
                      <DataTableRow key={redemption.winnerId}>
                        <DataTableCell>
                          <DataTableCellStack
                            primary={redemption.subscriberName}
                            secondary={redemption.email}
                          />
                        </DataTableCell>
                        <DataTableCell>{redemption.phoneNumber}</DataTableCell>
                        <DataTableCell>
                          <DataTableCellStack
                            primary={redemption.drawName}
                            secondary={<span className="font-mono" title="Draw code">{redemption.raffleCode}</span>}
                          />
                        </DataTableCell>
                        <DataTableCell>{prizeName}</DataTableCell>
                        <DataTableCell>
                          <TypeBadge type={redemption.prizeType} />
                        </DataTableCell>
                        <DataTableCell align="right" className="tabular-nums font-medium">
                          {redemption.prizeType === "CASH" && redemption.cashAmount
                            ? `₦${redemption.cashAmount.toLocaleString()}`
                            : "—"}
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge status={redemption.status as any} prizeType={redemption.prizeType} />
                        </DataTableCell>
                        <DataTableCell className="text-muted-foreground">
                          {formatDateTime(redemption.redeemedAt)}
                        </DataTableCell>
                        <DataTableCell className="text-muted-foreground">
                          {formatDateTime(redemption.fulfilledAt)}
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTableContainer>

              {/* Pagination */}
              {redemptionsTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-muted-foreground">
                    Page {redemptionsPage + 1} of {redemptionsTotalPages} •{" "}
                    {redemptionsTotal.toLocaleString()} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setRedemptionsPage((p) => Math.max(0, p - 1))}
                      disabled={redemptionsPage === 0 || redemptionsLoading}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft size={14} className="mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setRedemptionsPage((p) => Math.min(redemptionsTotalPages - 1, p + 1))
                      }
                      disabled={
                        redemptionsPage >= redemptionsTotalPages - 1 || redemptionsLoading
                      }
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!redemptionsLoading && redemptions.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <AlertCircle size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No redemptions found matching your filters.
              </p>
            </div>
          )}
        </>
      )}

      {/* Winner Detail Drawer */}
      <WinnerDetailDrawer
        open={showDetailDrawer}
        onClose={handleCloseDetailDrawer}
        winnerId={selectedWinnerId}
        onActionClick={handleActionClick}
      />

      {/* Action Modals */}
      <RedeemCashModal
        open={showRedeemCashModal}
        onClose={() => setShowRedeemCashModal(false)}
        winnerId={selectedWinnerId || ""}
        winnerName={selectedWinnerName}
        onSuccess={handleActionSuccess}
      />

      <RedeemItemModal
        open={showRedeemItemModal}
        onClose={() => setShowRedeemItemModal(false)}
        winnerId={selectedWinnerId || ""}
        winnerName={selectedWinnerName}
        onSuccess={handleActionSuccess}
      />

      <FulfilCashModal
        open={showFulfilCashModal}
        onClose={() => setShowFulfilCashModal(false)}
        winnerId={selectedWinnerId || ""}
        winnerName={selectedWinnerName}
        onSuccess={handleActionSuccess}
      />

      <FulfilItemModal
        open={showFulfilItemModal}
        onClose={() => setShowFulfilItemModal(false)}
        winnerId={selectedWinnerId || ""}
        winnerName={selectedWinnerName}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
