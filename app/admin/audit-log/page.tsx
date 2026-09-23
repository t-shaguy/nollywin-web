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
    action: "",
    userId: "",
    startDate: "",
    endDate: "",
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
      
      const params: Record<string, string> = {};
      if (filters.action) params.action = filters.action;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const data = await getAuditLog(params);
      console.log("Audit log:", data);
      
      setLogs(Array.isArray(data) ? data : []);
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
        <p className="text-muted-foreground mt-1">Track system activity and administrative actions</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {/* TODO(tartor): Generic render until response shape confirmed */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="bg-card border border-border rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Activity size={24} className="text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-2xl font-extrabold mt-1">
                {typeof value === "number" ? value.toLocaleString() : String(value || "—")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Action</label>
            <Input
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="e.g. CREATE, UPDATE"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">User ID</label>
            <Input
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              placeholder="User UUID"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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
      {/* TODO(tartor): Generic render until response shape confirmed */}
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
