"use client";
import { useState, useEffect } from "react";
import { FileBarChart2 } from "lucide-react";
import {
  getSubscriptionReportSummary,
  getSubscriptionReportList,
  type SubscriptionReportSummary,
} from "@/lib/api/admin";

export default function ReportsPage() {
  const [summary, setSummary] = useState<SubscriptionReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

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
      // TODO(backend): Subscription report list endpoint returns 404
      // This is a known issue - the endpoint is not available yet
      try {
        await getSubscriptionReportList(0, 10);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "status" in err && err.status === 404) {
          setListError("Subscription report list endpoint not available yet (404)");
        }
      }
    }
    
    loadSummary();
    checkListEndpoint();
  }, []);

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
        <p className="text-muted-foreground mt-1">View platform analytics and subscription reports</p>
        {/* TODO: raffle report endpoint 404s as of 2026-09-22, confirm with backend before building this page */}
      </div>

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

      {/* Subscription Report Summary - Generic Render */}
      {/* TODO(tartor): once real field names are confirmed via console.log, replace generic render with named cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="bg-card border border-border rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <FileBarChart2 size={24} className="text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">{key}</p>
              <p className="text-2xl font-extrabold mt-1">
                {typeof value === "number" ? value.toLocaleString() : String(value || "—")}
              </p>
            </div>
          ))}
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          No subscription data available yet.
        </div>
      )}
    </div>
  );
}
