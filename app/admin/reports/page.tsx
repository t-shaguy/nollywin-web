"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileBarChart2, Calendar, Filter, Gift, CreditCard, Smartphone, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DownloadMenu } from "@/components/admin/download-menu";
import { PrintView } from "@/components/admin/print-view";
import { getReportConfig } from "@/lib/export/report-config";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime, getDatePresets, createLagosDateTime, getStartOfDay, getEndOfDay } from "@/lib/utils/date-format";
import {
  getSubscriptionReportSummary,
  getSubscriptionReport,
  getRaffleReport,
  getIncomeReport,
  getPackages,
  type SubscriptionReportSummary,
  type IncomeReportResponse,
  type SubscriptionPackage,
} from "@/lib/api/admin";

type ReportTab = "subscriptions" | "raffles" | "income";

interface SubscriptionEntry {
  id: string;
  subscriberName: string;
  email: string;
  phoneNumber: string;
  packageName: string;
  amount: number;
  status: "ACTIVE" | "EXPIRED" | "PENDING_PAYMENT";
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface SubscriptionReportResponse {
  entries: SubscriptionEntry[];
  page: number;
  size: number;
  total: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ReportTab>("subscriptions");
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Subscription report state
  const [summary, setSummary] = useState<SubscriptionReportSummary | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionReportResponse | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPage, setSubscriptionPage] = useState(0);
  const subscriptionPageSize = 50;
  
  // Subscription filters
  const [subscriptionFilters, setSubscriptionFilters] = useState({
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    search: searchParams.get("search") || "",
    packageId: searchParams.get("packageId") || "",
    status: searchParams.get("status") || "",
  });

  // Raffle report state
  const [raffleData, setRaffleData] = useState<{ entries: unknown[]; size: number; total: number } | null>(null);
  const [raffleLoading, setRaffleLoading] = useState(false);
  const [raffleError, setRaffleError] = useState<string | null>(null);
  const [raffleFilters, setRaffleFilters] = useState({
    from: "",
    to: "",
    status: "",
    raffleId: "",
    email: "",
    phone: "",
  });

  // Income report state
  const [incomeData, setIncomeData] = useState<IncomeReportResponse | null>(null);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [incomeFilters, setIncomeFilters] = useState({
    from: "",
    to: "",
  });

  // Load packages on mount
  useEffect(() => {
    async function loadPackages() {
      try {
        const data = await getPackages();
        setPackages(data);
      } catch (err) {
        console.error("Error loading packages:", err);
      }
    }
    loadPackages();
  }, []);

  // Load subscription report
  const loadSubscriptionReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters with Lagos timezone
      const apiFilters: Record<string, string> = {
        page: subscriptionPage.toString(),
        size: subscriptionPageSize.toString(),
      };
      
      if (subscriptionFilters.from) apiFilters.from = subscriptionFilters.from;
      if (subscriptionFilters.to) apiFilters.to = subscriptionFilters.to;
      if (subscriptionFilters.search) apiFilters.search = subscriptionFilters.search;
      if (subscriptionFilters.packageId) apiFilters.packageId = subscriptionFilters.packageId;
      if (subscriptionFilters.status) apiFilters.status = subscriptionFilters.status;
      
      const [summaryData, reportData] = await Promise.all([
        getSubscriptionReportSummary({
          from: subscriptionFilters.from || undefined,
          to: subscriptionFilters.to || undefined,
        }),
        getSubscriptionReport(apiFilters as any),
      ]);
      
      setSummary(summaryData);
      setSubscriptionData(reportData as SubscriptionReportResponse);
    } catch (err) {
      console.error("Error loading subscription report:", err);
      setError(err instanceof Error ? err.message : "Failed to load subscription report");
    } finally {
      setLoading(false);
    }
  };

  // Apply subscription filters
  const applySubscriptionFilters = () => {
    // Validate from/to
    if (subscriptionFilters.from && subscriptionFilters.to) {
      const from = new Date(subscriptionFilters.from);
      const to = new Date(subscriptionFilters.to);
      if (from > to) {
        setError("'from' must be on or before 'to'");
        return;
      }
    }
    
    // Update URL
    const params = new URLSearchParams();
    if (subscriptionFilters.from) params.set("from", subscriptionFilters.from);
    if (subscriptionFilters.to) params.set("to", subscriptionFilters.to);
    if (subscriptionFilters.search) params.set("search", subscriptionFilters.search);
    if (subscriptionFilters.packageId) params.set("packageId", subscriptionFilters.packageId);
    if (subscriptionFilters.status) params.set("status", subscriptionFilters.status);
    
    router.push(`/admin/reports?${params.toString()}`);
    
    setSubscriptionPage(0);
    loadSubscriptionReport();
  };

  // Clear subscription filters
  const clearSubscriptionFilters = () => {
    setSubscriptionFilters({
      from: "",
      to: "",
      search: "",
      packageId: "",
      status: "",
    });
    router.push("/admin/reports");
    setSubscriptionPage(0);
  };

  // Apply date preset
  const applyDatePreset = (preset: "today" | "last7Days" | "thisMonth") => {
    const presets = getDatePresets();
    const selected = presets[preset];
    setSubscriptionFilters({
      ...subscriptionFilters,
      from: selected.from,
      to: selected.to,
    });
  };

  // Load on mount and when filters change
  useEffect(() => {
    if (activeTab === "subscriptions") {
      loadSubscriptionReport();
    }
  }, [subscriptionPage, activeTab]);

  // Remove old subscription list loading
  // useEffect(() => {
  //   async function loadSummary() { ... }
  //   async function checkListEndpoint() { ... }
  //   loadSummary();
  //   checkListEndpoint();
  // }, []);

  // Load raffle report
  const loadRaffleReport = async () => {
    try {
      setRaffleLoading(true);
      setRaffleError(null);
      const data = await getRaffleReport({ ...raffleFilters, page: 0, size: 50 });
      setRaffleData(data as { entries: unknown[]; size: number; total: number });
    } catch (err) {
      console.error("Error loading raffle report:", err);
      setRaffleError(err instanceof Error ? err.message : "Failed to load raffle report");
    } finally {
      setRaffleLoading(false);
    }
  };

  // Load income report
  const loadIncomeReport = async () => {
    try {
      setIncomeLoading(true);
      setIncomeError(null);
      const data = await getIncomeReport(incomeFilters);
      setIncomeData(data);
    } catch (err) {
      console.error("Error loading income report:", err);
      setIncomeError(err instanceof Error ? err.message : "Failed to load income report");
    } finally {
      setIncomeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "raffles") {
      loadRaffleReport();
    }
    if (activeTab === "income") {
      loadIncomeReport();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <AdminPageHeader 
            title="Reports" 
            description="View platform analytics and reports" 
          />
        </div>
        <div className="bg-card border border-border rounded p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading reports...</div>
        </div>
      </div>
    );
  }

  // Print view for raffles
  if (showPrintView && activeTab === "raffles" && raffleData) {
    const config = getReportConfig("raffles");
    if (!config) return null;

    return (
      <PrintView
        title="Draws Report"
        filters={{
          "From": raffleFilters.from || "Any",
          "To": raffleFilters.to || "Any",
          "Status": raffleFilters.status || "All",
          "Draw ID": raffleFilters.raffleId || "Any",
          "Email": raffleFilters.email || "Any",
          "Phone": raffleFilters.phone || "Any",
        }}
        columns={config.columns}
        data={raffleData.entries as Record<string, unknown>[]}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <AdminPageHeader 
          title="Reports" 
          description="View platform analytics and reports" 
        />
        {activeTab === "raffles" && raffleData && raffleData.entries.length > 0 && (
          <DownloadMenu
            reportKey="raffles"
            filters={raffleFilters}
            onPrintClick={() => setShowPrintView(true)}
          />
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 text-[13px] font-medium transition-colors rounded-t ${
            activeTab === "subscriptions"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab("raffles")}
          className={`px-4 py-2 text-[13px] font-medium transition-colors rounded-t ${
            activeTab === "raffles"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Draws
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-2 text-[13px] font-medium transition-colors rounded-t ${
            activeTab === "income"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Income
        </button>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold">Filters</h3>
              </div>
              <p className="text-xs text-muted-foreground">Times are Lagos time (WAT)</p>
            </div>

            {/* Date Presets */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyDatePreset("today")}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyDatePreset("last7Days")}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyDatePreset("thisMonth")}
              >
                This month
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">From</label>
                <input
                  type="datetime-local"
                  value={subscriptionFilters.from.replace("+01:00", "")}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSubscriptionFilters({ ...subscriptionFilters, from: createLagosDateTime(date) });
                  }}
                  className="w-full px-3 h-9 text-sm rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">To</label>
                <input
                  type="datetime-local"
                  value={subscriptionFilters.to.replace("+01:00", "")}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSubscriptionFilters({ ...subscriptionFilters, to: createLagosDateTime(date) });
                  }}
                  className="w-full px-3 h-9 text-sm rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Search</label>
                <input
                  type="text"
                  value={subscriptionFilters.search}
                  onChange={(e) => setSubscriptionFilters({ ...subscriptionFilters, search: e.target.value })}
                  placeholder="Email or phone"
                  className="w-full px-3 h-9 text-sm rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Package</label>
                <select
                  value={subscriptionFilters.packageId}
                  onChange={(e) => setSubscriptionFilters({ ...subscriptionFilters, packageId: e.target.value })}
                  className="w-full px-3 h-9 text-sm rounded border border-border bg-background"
                >
                  <option value="">All packages</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Status</label>
                <select
                  value={subscriptionFilters.status}
                  onChange={(e) => setSubscriptionFilters({ ...subscriptionFilters, status: e.target.value })}
                  className="w-full px-3 h-9 text-sm rounded border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="PENDING_PAYMENT">Pending payment</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(subscriptionFilters.from || subscriptionFilters.to || subscriptionFilters.search || subscriptionFilters.packageId || subscriptionFilters.status) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {subscriptionFilters.from && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
                    From: {formatDateTime(subscriptionFilters.from)}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => setSubscriptionFilters({ ...subscriptionFilters, from: "" })}
                    />
                  </span>
                )}
                {subscriptionFilters.to && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
                    To: {formatDateTime(subscriptionFilters.to)}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => setSubscriptionFilters({ ...subscriptionFilters, to: "" })}
                    />
                  </span>
                )}
                {subscriptionFilters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
                    Search: {subscriptionFilters.search}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => setSubscriptionFilters({ ...subscriptionFilters, search: "" })}
                    />
                  </span>
                )}
                {subscriptionFilters.packageId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
                    Package: {packages.find(p => p.id.toString() === subscriptionFilters.packageId)?.name}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => setSubscriptionFilters({ ...subscriptionFilters, packageId: "" })}
                    />
                  </span>
                )}
                {subscriptionFilters.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
                    Status: {subscriptionFilters.status}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => setSubscriptionFilters({ ...subscriptionFilters, status: "" })}
                    />
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={applySubscriptionFilters} size="sm">
                Apply Filters
              </Button>
              <Button onClick={clearSubscriptionFilters} variant="outline" size="sm">
                Clear filters
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && <DataTableSkeleton rows={5} columns={8} />}

          {/* Summary Tiles */}
          {!loading && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Subscriptions */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <Users size={18} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">All subscriptions</p>
                </div>
                <p className="text-2xl font-bold tabular-nums">{summary.totalSubscriptions.toLocaleString()}</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <CreditCard size={18} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenue (paid)</p>
                </div>
                <p className="text-2xl font-bold tabular-nums">₦{summary.totalRevenue.toLocaleString()}</p>
              </div>

              {/* By Status */}
              {summary.byStatus && (summary.byStatus as Array<{ status: string; count: number }>).map((item) => (
                <div key={item.status} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={item.status as any} size="sm" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{item.count.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* By Package Breakdown */}
          {!loading && summary && summary.byPackage && summary.byPackage.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4">By Package</h3>
              <div className="space-y-3">
                {(summary.byPackage as Array<{ packageName: string; count: number; revenue: number }>).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{item.packageName}</p>
                        <p className="text-xs text-muted-foreground">{item.count} subscriptions</p>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">₦{item.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && subscriptionData && subscriptionData.entries.length > 0 && (
            <>
              <DataTableContainer>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Subscriber</DataTableHead>
                    <DataTableHead>Phone</DataTableHead>
                    <DataTableHead>Package</DataTableHead>
                    <DataTableHead align="right">Amount</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead>Starts</DataTableHead>
                    <DataTableHead>Expires</DataTableHead>
                    <DataTableHead>Created</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {subscriptionData.entries.map((entry) => (
                    <DataTableRow key={entry.id}>
                      <DataTableCell>
                        <DataTableCellStack
                          primary={entry.subscriberName}
                          secondary={entry.email}
                        />
                      </DataTableCell>
                      <DataTableCell>{entry.phoneNumber}</DataTableCell>
                      <DataTableCell>{entry.packageName}</DataTableCell>
                      <DataTableCell align="right" className="tabular-nums font-medium">
                        ₦{entry.amount.toLocaleString()}
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge status={entry.status} />
                      </DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {formatDate(entry.startsAt)}
                      </DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {formatDate(entry.expiresAt)}
                      </DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTableContainer>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {subscriptionData.entries.length} of {subscriptionData.total.toLocaleString()} subscriptions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubscriptionPage(p => Math.max(0, p - 1))}
                    disabled={subscriptionPage === 0 || loading}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubscriptionPage(p => p + 1)}
                    disabled={(subscriptionData?.entries.length || 0) < subscriptionPageSize || loading}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!loading && subscriptionData && subscriptionData.entries.length === 0 && (
            <DataTableEmpty
              message="No subscriptions found matching your filters."
              icon={<Users size={32} className="text-muted-foreground" />}
              action={
                <Button onClick={clearSubscriptionFilters} variant="outline" size="sm">
                  Clear filters
                </Button>
              }
            />
          )}
        </>
      )}

      {/* Raffles Tab */}
      {activeTab === "raffles" && (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">From Date</label>
                <input
                  type="date"
                  value={raffleFilters.from}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, from: e.target.value })}
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">To Date</label>
                <input
                  type="date"
                  value={raffleFilters.to}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, to: e.target.value })}
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Status</label>
                <select
                  value={raffleFilters.status}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, status: e.target.value })}
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="HISTORICAL">Historical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Draw ID</label>
                <input
                  type="text"
                  value={raffleFilters.raffleId}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, raffleId: e.target.value })}
                  placeholder="Enter draw ID"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Email</label>
                <input
                  type="text"
                  value={raffleFilters.email}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, email: e.target.value })}
                  placeholder="Filter by email"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Phone</label>
                <input
                  type="text"
                  value={raffleFilters.phone}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, phone: e.target.value })}
                  placeholder="Filter by phone"
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
            </div>
            
            <Button onClick={loadRaffleReport} size="sm" className="w-full md:w-auto">
              Apply Filters
            </Button>
          </div>

          {/* Error Message */}
          {raffleError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
              {raffleError}
            </div>
          )}

          {/* Loading State */}
          {raffleLoading && (
            <div className="bg-card border border-border rounded p-12 text-center text-muted-foreground text-sm">
              Loading raffle report...
            </div>
          )}

          {/* Raffle Report Table */}
          {!raffleLoading && raffleData && raffleData.entries && raffleData.entries.length > 0 && (
            <div className="bg-card border border-border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Draws</h2>
                <span className="text-xs text-muted-foreground">
                  {raffleData.total} total entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[140px]">Draw Code</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[180px]">Prize Name</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[120px]">Start Date</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[120px]">End Date</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[120px]">Draw Date</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[100px]">Max Winners</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[110px]">Schedule</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[100px]">Status</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[90px]">Entries</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[100px]">Winners</th>
                      <th className="text-left py-4 px-5 font-semibold text-foreground whitespace-nowrap min-w-[110px]">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffleData.entries.map((entry: any, idx: number) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-5 font-mono text-xs whitespace-nowrap">{entry.raffleCode || "—"}</td>
                        <td className="py-4 px-5 font-medium whitespace-nowrap">{entry.prizeName || "—"}</td>
                        <td className="py-4 px-5 text-muted-foreground whitespace-nowrap">{entry.startsOn || "—"}</td>
                        <td className="py-4 px-5 text-muted-foreground whitespace-nowrap">{entry.endsOn || "—"}</td>
                        <td className="py-4 px-5 text-muted-foreground whitespace-nowrap">{entry.drawDate || "—"}</td>
                        <td className="py-4 px-5 whitespace-nowrap">{entry.maxWinners || 0}</td>
                        <td className="py-4 px-5 whitespace-nowrap">{entry.scheduleLabel || "—"}</td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <Badge className={
                            entry.status === "ACTIVE" 
                              ? "bg-green-500/10 border-green-500/30 text-green-600"
                              : entry.status === "CLOSED"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                              : entry.status === "CANCELLED"
                              ? "bg-red-500/10 border-red-500/30 text-red-600"
                              : entry.status === "UPCOMING"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-600"
                              : ""
                          }>
                            {entry.status || "—"}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">{entry.entryCount || 0}</td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          {entry.winnersSelected ? (
                            <Badge className="bg-green-500/10 border-green-500/30 text-green-600">Selected</Badge>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-muted-foreground whitespace-nowrap">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!raffleLoading && raffleData && raffleData.entries.length === 0 && (
            <div className="bg-card border border-border rounded p-12 text-center">
              <Gift size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No draws found matching your filters.</p>
            </div>
          )}
        </>
      )}

      {/* Income Tab */}
      {activeTab === "income" && (
        <>
          {/* Date Range Filters */}
          <div className="bg-card border border-border rounded p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Date Range</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">From Date</label>
                <input
                  type="date"
                  value={incomeFilters.from}
                  onChange={(e) => setIncomeFilters({ ...incomeFilters, from: e.target.value })}
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">To Date</label>
                <input
                  type="date"
                  value={incomeFilters.to}
                  onChange={(e) => setIncomeFilters({ ...incomeFilters, to: e.target.value })}
                  className="w-full px-3 h-8 text-[13px] rounded border border-border bg-background"
                />
              </div>
            </div>
            
            <Button onClick={loadIncomeReport} size="sm" className="w-full md:w-auto">
              Apply Filters
            </Button>
          </div>

          {/* Error Message */}
          {incomeError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
              {incomeError}
            </div>
          )}

          {/* Loading State */}
          {incomeLoading && (
            <div className="bg-card border border-border rounded p-12 text-center text-muted-foreground text-sm">
              Loading income report...
            </div>
          )}

          {/* Income Report Data */}
          {!incomeLoading && incomeData && (
            <>
              {/* Top-Level Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Income Card */}
                <div className="bg-card border border-border rounded p-4">
                  <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <path d="M21 8v8M3 8v8M7 4h10v16H7z"/>
                      <path d="M7 10h10M7 14h10"/>
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">₦{incomeData?.totalIncome?.toLocaleString() ?? "0"}</p>
                </div>

                {/* Payment Count Card */}
                <div className="bg-card border border-border rounded p-4">
                  <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center mb-3">
                    <CreditCard size={16} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Count</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{incomeData?.paymentCount?.toLocaleString() ?? "0"}</p>
                </div>
              </div>

              {/* By Source Section */}
              <div className="bg-card border border-border rounded p-4">
                <h3 className="text-sm font-semibold mb-3">Income by Source</h3>
                <div className="space-y-4">{/* WEB */}
                  {(() => {
                    const webSource = incomeData?.bySource?.find(s => s.key === "WEB");
                    return webSource && (
                      <div className="border-b border-border pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center">
                              <Users size={16} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-[13px]">WEB</p>
                              <p className="text-xs text-muted-foreground">{webSource?.count ?? 0} payments</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm tabular-nums">₦{webSource?.amount?.toLocaleString() ?? "0"}</p>
                        </div>
                        {/* By Origin breakdown */}
                        {(webSource?.byOrigin?.length ?? 0) > 0 && (
                          <div className="ml-10 space-y-1.5">
                            {(webSource?.byOrigin ?? []).map((origin) => (
                              <div key={origin.key} className="flex items-center justify-between text-[13px]">
                                <span className="text-muted-foreground">{origin.key}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-secondary text-muted-foreground text-xs">{origin.count}</Badge>
                                  <span className="font-medium tabular-nums">₦{origin.amount.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* AIRTIME */}
                  {(() => {
                    const airtimeSource = incomeData?.bySource?.find(s => s.key === "AIRTIME");
                    return airtimeSource && (
                      <div className="border-b border-border pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center">
                              <Smartphone size={16} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-[13px]">AIRTIME</p>
                              <p className="text-xs text-muted-foreground">{airtimeSource?.count ?? 0} payments</p>
                            </div>
                          </div>
                          <p className="font-bold text-lg">₦{airtimeSource?.amount?.toLocaleString() ?? "0"}</p>
                        </div>
                        {/* By Origin breakdown */}
                        {(airtimeSource?.byOrigin?.length ?? 0) > 0 && (
                          <div className="ml-12 space-y-2">
                            {(airtimeSource?.byOrigin ?? []).map((origin) => (
                              <div key={origin.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{origin.key}</span>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-secondary text-muted-foreground text-xs">{origin.count}</Badge>
                                  <span className="font-medium">₦{origin.amount.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* USSD */}
                  {(() => {
                    const ussdSource = incomeData?.bySource?.find(s => s.key === "USSD");
                    return ussdSource && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                              <Smartphone size={20} className="text-teal-500" />
                            </div>
                            <div>
                              <p className="font-medium">USSD</p>
                              <p className="text-xs text-muted-foreground">{ussdSource?.count ?? 0} payments</p>
                            </div>
                          </div>
                          <p className="font-bold text-lg">₦{ussdSource?.amount?.toLocaleString() ?? "0"}</p>
                        </div>
                        {/* By Origin breakdown */}
                        {(ussdSource?.byOrigin?.length ?? 0) > 0 && (
                          <div className="ml-12 space-y-2">
                            {(ussdSource?.byOrigin ?? []).map((origin) => (
                              <div key={origin.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{origin.key}</span>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-secondary text-muted-foreground text-xs">{origin.count}</Badge>
                                  <span className="font-medium">₦{origin.amount.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Telco Total Section */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Telco Total (AIRTIME + USSD)</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Smartphone size={24} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Combined Telco Revenue</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{incomeData?.telcoTotal?.count ?? 0} payments</p>
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold">₦{incomeData?.telcoTotal?.amount?.toLocaleString() ?? "0"}</p>
                </div>
              </div>

              {/* By Product Section */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Income by Product</h3>
                <div className="space-y-4">
                  {/* Subscriptions */}
                  {(() => {
                    const subscriptions = incomeData?.byProduct?.find(p => p.key === "SUBSCRIPTIONS");
                    return subscriptions && (
                      <div className="flex items-center justify-between py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <FileBarChart2 size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">Subscriptions</p>
                            <p className="text-xs text-muted-foreground">{subscriptions?.count ?? 0} payments</p>
                          </div>
                        </div>
                        <p className="font-bold text-lg">₦{subscriptions?.amount?.toLocaleString() ?? "0"}</p>
                      </div>
                    );
                  })()}

                  {/* Token Top-ups */}
                  {(() => {
                    const tokenTopups = incomeData?.byProduct?.find(p => p.key === "TOKEN_TOPUPS");
                    return tokenTopups && (
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <CreditCard size={20} className="text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">Token Top-ups</p>
                            <p className="text-xs text-muted-foreground">{tokenTopups?.count ?? 0} payments</p>
                          </div>
                        </div>
                        <p className="font-bold text-lg">₦{tokenTopups?.amount?.toLocaleString() ?? "0"}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!incomeLoading && !incomeData && !incomeError && (
            <div className="bg-card border border-border rounded p-12 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-4">
                <path d="M21 8v8M3 8v8M7 4h10v16H7z"/>
                <path d="M7 10h10M7 14h10"/>
              </svg>
              <p className="text-muted-foreground text-sm">Select a date range and click Apply Filters to view income data.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
