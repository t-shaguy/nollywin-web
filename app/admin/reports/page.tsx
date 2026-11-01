"use client";
import { useState, useEffect } from "react";
import { FileBarChart2, Calendar, Filter, Gift, CreditCard, Smartphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getSubscriptionReportSummary,
  getSubscriptionReportList,
  getRaffleReport,
  getIncomeReport,
  type SubscriptionReportSummary,
  type IncomeReportResponse,
} from "@/lib/api/admin";

type ReportTab = "subscriptions" | "raffles" | "income";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("subscriptions");
  
  // Subscription report state
  const [summary, setSummary] = useState<SubscriptionReportSummary | null>(null);
  const [listData, setListData] = useState<{ page: number; entries: any[]; size: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

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

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);
        const data = await getSubscriptionReportSummary();
        setSummary(data);
      } catch (err) {
        console.error("Error loading subscription report summary:", err);
        setError(err instanceof Error ? err.message : "Failed to load subscription report");
      } finally {
        setLoading(false);
      }
    }

    async function checkListEndpoint() {
      try {
        const data = await getSubscriptionReportList(0, 10);
        setListData(data as any);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "status" in err && err.status === 404) {
          setListError("Subscription report list endpoint not available yet (404)");
        } else {
          setListError(err instanceof Error ? err.message : "Failed to load subscription list");
        }
      }
    }
    
    loadSummary();
    checkListEndpoint();
  }, []);

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
        <AdminPageHeader 
          title="Reports" 
          description="View platform analytics and reports" 
        />
        <div className="bg-card border border-border rounded p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Reports" 
        description="View platform analytics and reports" 
      />

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
          Raffles
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
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Backend Status Message */}
          {listError && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4 text-yellow-600 text-sm">
              <p className="font-medium">Note: {listError}</p>
              <p className="text-xs mt-1 opacity-80">Summary data is available below.</p>
            </div>
          )}

          {/* Subscription Report Summary */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Subscriptions Card */}
              <div className="bg-card border border-border rounded p-4">
                <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center mb-3">
                  <FileBarChart2 size={16} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Subscriptions</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{summary.totalSubscriptions.toLocaleString()}</p>
              </div>

              {/* Total Revenue Card */}
              <div className="bg-card border border-border rounded p-4">
                <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 8v8M3 8v8M7 4h10v16H7z"/>
                    <path d="M7 10h10M7 14h10"/>
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">₦{summary.totalRevenue.toLocaleString()}</p>
              </div>

              {/* By Package (when available) */}
              {summary.byPackage && summary.byPackage.length > 0 && (
                <div className="bg-card border border-border rounded p-4 md:col-span-2">
                  <h3 className="text-sm font-semibold mb-3">By Package</h3>
                  <div className="space-y-2">
                    {summary.byPackage.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[13px]">{item.packageName}</span>
                          <Badge className="bg-secondary text-muted-foreground text-xs">{item.count} subs</Badge>
                        </div>
                        <span className="font-semibold text-[13px] tabular-nums">₦{item.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Status (when available) */}
              {summary.byStatus && summary.byStatus.length > 0 && (
                <div className="bg-card border border-border rounded p-4 md:col-span-2">
                  <h3 className="text-sm font-semibold mb-3">By Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {summary.byStatus.map((item: any, idx: number) => {
                      const statusColors: Record<string, string> = {
                        ACTIVE: "bg-green-500/10 text-green-600 border-green-500/30",
                        EXPIRED: "bg-secondary text-muted-foreground border-border",
                        PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                      };
                      const colorClass = statusColors[item.status] || "bg-secondary text-muted-foreground border-border";
                      return (
                        <div key={idx} className={`rounded border px-3 py-2 ${colorClass}`}>
                          <p className="text-xs font-medium uppercase tracking-wide">{item.status.replace("_", " ")}</p>
                          <p className="text-xl font-bold mt-0.5 tabular-nums">{item.count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!summary && !loading && !error && (
            <div className="bg-card border border-border rounded p-12 text-center text-muted-foreground text-sm">
              No subscription data available yet.
            </div>
          )}

          {/* Subscription List Data */}
          {listData && listData.entries && listData.entries.length > 0 && (
            <div className="bg-card border border-border rounded p-4 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Subscription Entries</h2>
                <span className="text-xs text-muted-foreground">
                  {listData.total} total subscriptions
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Subscriber</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Package</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Start Date</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Expires At</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.entries.map((entry: any) => (
                      <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium">{entry.subscriberName}</p>
                            <p className="text-xs text-muted-foreground">{entry.email}</p>
                            <p className="text-xs text-muted-foreground">{entry.phoneNumber}</p>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium">{entry.packageName}</td>
                        <td className="py-2 px-3 tabular-nums">₦{entry.amount.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <Badge className={
                            entry.status === "ACTIVE" 
                              ? "bg-green-500/10 border-green-500/30 text-green-600"
                              : entry.status === "EXPIRED"
                              ? "bg-secondary border-border text-muted-foreground"
                              : entry.status === "PENDING_PAYMENT"
                              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600"
                              : "bg-secondary border-border text-muted-foreground"
                          }>
                            {entry.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {entry.startsAt ? new Date(entry.startsAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination info */}
              <div className="mt-3 text-xs text-muted-foreground text-center">
                Showing {listData.entries.length} of {listData.total} subscriptions
              </div>
            </div>
          )}

          {/* No entries state */}
          {listData && listData.entries && listData.entries.length === 0 && (
            <div className="bg-card border border-border rounded p-12 text-center text-muted-foreground text-sm mt-6">
              No subscription entries found.
            </div>
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
                <label className="text-xs font-medium mb-1.5 block">Raffle ID</label>
                <input
                  type="text"
                  value={raffleFilters.raffleId}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, raffleId: e.target.value })}
                  placeholder="Enter raffle ID"
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
                <h2 className="text-sm font-semibold">Raffle Draws</h2>
                <span className="text-xs text-muted-foreground">
                  {raffleData.total} total entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Raffle Code</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Prize Name</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Starts On</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Ends On</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Draw Date</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Max Winners</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Schedule</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Entries</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Winners</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffleData.entries.map((entry: any, idx: number) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="py-2 px-3 font-mono text-xs">{entry.raffleCode || "—"}</td>
                        <td className="py-2 px-3 font-medium">{entry.prizeName || "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{entry.startsOn || "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{entry.endsOn || "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{entry.drawDate || "—"}</td>
                        <td className="py-2 px-3">{entry.maxWinners || 0}</td>
                        <td className="py-2 px-3">{entry.scheduleLabel || "—"}</td>
                        <td className="py-2 px-3">
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
                        <td className="py-2 px-3">{entry.entryCount || 0}</td>
                        <td className="py-2 px-3">
                          {entry.winnersSelected ? (
                            <Badge className="bg-green-500/10 border-green-500/30 text-green-600">Selected</Badge>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
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
              <p className="text-muted-foreground text-sm">No raffle draws found matching your filters.</p>
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
