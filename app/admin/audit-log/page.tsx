"use client";
import { useState, useEffect } from "react";
import { FileText, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAuditLog, getAuditLogSummary, type AuditLogSummary } from "@/lib/api/admin";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    resourceType: "",
    actorEmail: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      setSummaryLoading(true);
      const data = await getAuditLogSummary();
      console.log("Audit log summary:", data);
      setSummary(data);
    } catch (err) {
      console.error("Error loading audit log summary:", err);
      // Don't set error - summary is optional
    } finally {
      setSummaryLoading(false);
    }
  }

  const handleLoadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditLog({
        resourceType: filters.resourceType || undefined,
        actorEmail: filters.actorEmail || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      setLogs(data.entries ?? []);
    } catch (err) {
      console.error("Error loading audit log:", err);
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">See who made changes, when, and whether they went through</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Activity size={24} className="text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-extrabold mt-1">{summary.totalActions.toLocaleString()}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Activity size={24} className="text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-extrabold mt-1">{summary.successCount.toLocaleString()}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                <Activity size={24} className="text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground">Didn't Go Through</p>
              <p className="text-2xl font-extrabold mt-1">{summary.failureCount.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold mb-3">By Resource Type</h3>
              <div className="space-y-2">
                {summary.byResourceType.map((r) => (
                  <div key={r.resourceType} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.resourceType}</span>
                    <span className="font-medium">{r.total} ({r.successCount} ok, {r.failureCount} failed)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold mb-3">By Admin</h3>
              <div className="space-y-2">
                {summary.byActor.map((a) => (
                  <div key={a.actorEmail} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate">{a.actorEmail}</span>
                    <span className="font-medium">{a.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing activity from {new Date(summary.from).toLocaleDateString()} to {new Date(summary.to).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Resource Type</label>
            <Input
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              placeholder="e.g. TriviaPrize, RaffleDraw"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Admin Email</label>
            <Input
              value={filters.actorEmail}
              onChange={(e) => setFilters({ ...filters, actorEmail: e.target.value })}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">From</label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleLoadLogs} disabled={loading} variant="gradient" className="w-full">
              {loading ? "Loading..." : "Load Log"}
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Audit Log Entries</h2>
        </div>
        
        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((entry, idx) => (
              <div key={idx} className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(entry).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="font-medium text-sm">
                        {typeof value === "object" && value !== null 
                          ? JSON.stringify(value) 
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? "Loading..." : "No audit log entries yet. Use filters above to load data."}
          </div>
        )}
      </div>
    </div>
  );
}
