"use client";
import { useState, useEffect } from "react";
import { FileBarChart2, Calendar, Filter, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSubscriptionReportSummary,
  getSubscriptionReportList,
  getRaffleReport,
  type SubscriptionReportSummary,
} from "@/lib/api/admin";

type ReportTab = "subscriptions" | "raffles";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("subscriptions");
  
  // Subscription report state
  const [summary, setSummary] = useState<SubscriptionReportSummary | null>(null);
  const [listData, setListData] = useState<Record<string, unknown> | null>(null);
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
        setListData(data);
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

  useEffect(() => {
    if (activeTab === "raffles") {
      loadRaffleReport();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold">Reports</h1>
          <p className="text-muted-foreground mt-1">View platform analytics and subscription reports</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Reports</h1>
        <p className="text-muted-foreground mt-1">View platform analytics and reports</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "subscriptions"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab("raffles")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "raffles"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Raffles
        </button>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <>
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
              {error}
            </div>
          )}

          {/* Backend Status Message */}
          {listError && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-600">
              <p className="font-medium">Note: {listError}</p>
              <p className="text-sm mt-1 opacity-80">Summary data is available below.</p>
            </div>
          )}

          {/* Subscription Report Summary */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Subscriptions Card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <FileBarChart2 size={24} className="text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-extrabold mt-1">{summary.totalSubscriptions.toLocaleString()}</p>
              </div>

              {/* Total Revenue Card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                  <FileBarChart2 size={24} className="text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-extrabold mt-1">₦{summary.totalRevenue.toLocaleString()}</p>
              </div>

              {/* By Package (when available) */}
              {summary.byPackage && summary.byPackage.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2">
                  <h3 className="font-semibold mb-3">By Package</h3>
                  <div className="space-y-2">
                    {summary.byPackage.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{JSON.stringify(item)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Status (when available) */}
              {summary.byStatus && summary.byStatus.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2">
                  <h3 className="font-semibold mb-3">By Status</h3>
                  <div className="space-y-2">
                    {summary.byStatus.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{JSON.stringify(item)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!summary && !loading && !error && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              No subscription data available yet.
            </div>
          )}

          {/* Subscription List Data */}
          {listData && (
            <div className="bg-card border border-border rounded-2xl p-6 mt-8">
              <h2 className="text-xl font-bold mb-4">Subscription Entries</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Field</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(listData).map(([key, value]) => (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 font-medium">{key}</td>
                        <td className="py-3 px-4">
                          {Array.isArray(value) 
                            ? `[${value.length} items]` 
                            : typeof value === "object" && value !== null
                            ? JSON.stringify(value)
                            : String(value || "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Raffles Tab */}
      {activeTab === "raffles" && (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-muted-foreground" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">From Date</label>
                <input
                  type="date"
                  value={raffleFilters.from}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, from: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">To Date</label>
                <input
                  type="date"
                  value={raffleFilters.to}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, to: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select
                  value={raffleFilters.status}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">All</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="HISTORICAL">Historical</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Raffle ID</label>
                <input
                  type="text"
                  value={raffleFilters.raffleId}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, raffleId: e.target.value })}
                  placeholder="Enter raffle ID"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input
                  type="text"
                  value={raffleFilters.email}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, email: e.target.value })}
                  placeholder="Filter by email"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone</label>
                <input
                  type="text"
                  value={raffleFilters.phone}
                  onChange={(e) => setRaffleFilters({ ...raffleFilters, phone: e.target.value })}
                  placeholder="Filter by phone"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
            
            <Button onClick={loadRaffleReport} className="w-full md:w-auto">
              Apply Filters
            </Button>
          </div>

          {/* Error Message */}
          {raffleError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
              {raffleError}
            </div>
          )}

          {/* Loading State */}
          {raffleLoading && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              Loading raffle report...
            </div>
          )}

          {/* Raffle Report Table */}
          {!raffleLoading && raffleData && raffleData.entries && raffleData.entries.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Raffle Draws</h2>
                <span className="text-sm text-muted-foreground">
                  {raffleData.total} total entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prize Name</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ticket Cost</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Max Winners</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Schedule</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entries</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Winners</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffleData.entries.map((entry: any, idx: number) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="py-3 px-4 font-medium">{entry.prizeName || "—"}</td>
                        <td className="py-3 px-4">{entry.ticketCostTokens || 0} tokens</td>
                        <td className="py-3 px-4">{entry.maxWinners || 0}</td>
                        <td className="py-3 px-4">{entry.scheduleLabel || "—"}</td>
                        <td className="py-3 px-4">
                          <Badge className={entry.status === "ACTIVE" ? "bg-green-500/20 border-green-500/30 text-green-700" : ""}>
                            {entry.status || "—"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{entry.entryCount || 0}</td>
                        <td className="py-3 px-4">
                          {entry.winnersSelected ? (
                            <Badge className="bg-green-500/20 border-green-500/30 text-green-700">Selected</Badge>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
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
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Gift size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No raffle draws found matching your filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
