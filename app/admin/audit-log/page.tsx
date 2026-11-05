"use client";
import { useState, useEffect } from "react";
import { Activity, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuditLog, getAuditLogSummary, type AuditLogSummary } from "@/lib/api/admin";
import { AdminInput, AdminSelect } from "@/components/admin/admin-field";
import { StatusBadge, CountPill } from "@/components/admin/status-badge";
import { DataTable, Column } from "@/components/admin/data-table";
import { SkeletonCard, EmptyState, InlineError } from "@/components/admin/loading-states";
import { AvatarInitials } from "@/components/admin/avatar-initials";
import { Icon } from "@/components/admin/icon";
import { DetailValue } from "@/components/admin/value-renderer";
import { 
  formatNumber, 
  formatRelativeTime, 
  humanizeResourceType,
  formatDate 
} from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id?: string;
  occurredAt?: string; // API field name
  actorEmail?: string;
  httpMethod?: string;
  resourceType?: string;
  resourcePath?: string;
  pathParams?: string;
  requestBody?: string;
  responseStatus?: number;
  description?: string;
  success?: boolean;
  actorRoles?: string;
  [key: string]: unknown;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simple filter state
  const [filters, setFilters] = useState({
    resourceType: "",
    actorEmail: "",
    status: "",
    description: "",
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadSummary();
    loadEntries();
  }, []);

  async function loadSummary() {
    try {
      setSummaryLoading(true);
      const data = await getAuditLogSummary();
      setSummary(data);
    } catch (err) {
      console.error("Error loading audit log summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadEntriesWithFilters(filterOverrides: typeof filters, resetPage = false) {
    const currentPage = resetPage ? 1 : page;
    return loadEntriesDirectly(filterOverrides, currentPage, size);
  }

  async function loadEntriesDirectly(filterOverrides: typeof filters, targetPage: number, targetSize: number) {
    try {
      setLoading(true);
      setError(null);
      
      // Convert 1-indexed UI page to 0-indexed API page
      const apiPage = targetPage - 1;
      
      const data = await getAuditLog({
        resourceType: filterOverrides.resourceType || undefined,
        actorEmail: filterOverrides.actorEmail || undefined,
        description: filterOverrides.description || undefined,
        success: filterOverrides.status ? filterOverrides.status === "success" : undefined,
        page: apiPage, // API expects 0-indexed
        size: targetSize,
      });
      
      setEntries(data.entries as AuditLogEntry[]);
      setTotal(data.total || data.entries.length);
      
      // Update state if needed
      if (targetPage !== page) setPage(targetPage);
      if (targetSize !== size) setSize(targetSize);
    } catch (err) {
      console.error("Error loading audit log:", err);
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }

  async function loadEntries(resetPage = false) {
    return loadEntriesWithFilters(filters, resetPage);
  }

  const handleRefresh = () => {
    loadSummary();
    loadEntries();
  };

  const handleApplyFilters = () => {
    loadEntries(true);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      resourceType: "",
      actorEmail: "",
      status: "",
      description: "",
    };
    setFilters(resetFilters);
    loadEntriesWithFilters(resetFilters, true);
  };

  const handleResourceTypeClick = (resourceType: string) => {
    const newFilters = { ...filters, resourceType };
    setFilters(newFilters);
    loadEntriesWithFilters(newFilters, true);
  };

  const handleAdminClick = (email: string) => {
    const newFilters = { ...filters, actorEmail: email };
    setFilters(newFilters);
    loadEntriesWithFilters(newFilters, true);
  };

  // Active filters for display
  const activeFilters = Object.entries(filters).filter(([, value]) => value !== "");
  const hasActiveFilters = activeFilters.length > 0;

  // DataTable columns
  const columns: Column<AuditLogEntry>[] = [
    {
      key: "occurredAt",
      header: "Time",
      render: (entry) => {
        const timestamp = entry.occurredAt || "";
        const date = timestamp ? new Date(timestamp) : null;
        const isValid = date && !isNaN(date.getTime());
        
        return (
          <div>
            <div className="text-[13px] font-medium">
              {isValid ? formatRelativeTime(timestamp) : "-"}
            </div>
            {isValid && (
              <div className="text-xs text-muted-foreground">
                {new Date(timestamp).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actorEmail",
      header: "Admin",
      render: (entry) => {
        const email = entry.actorEmail || "";
        if (!email || email.trim() === "") {
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--neutral-bg)] flex items-center justify-center">
                <Icon icon={Activity} size="sm" />
              </div>
              <span className="text-[13px] text-muted-foreground">System</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <AvatarInitials email={email} size="sm" />
            <div>
              <div className="text-[13px] truncate max-w-[200px]" title={email}>{email}</div>
              {entry.actorRoles && (
                <div className="text-xs text-muted-foreground capitalize">
                  {String(entry.actorRoles).toLowerCase()}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (entry) => (
        <div className="max-w-[300px]">
          <div className="text-[13px] truncate" title={entry.description as string}>
            {entry.description || entry.httpMethod || "-"}
          </div>
          {entry.resourcePath && (
            <code className="text-xs text-muted-foreground font-mono truncate block">
              {String(entry.resourcePath)}
            </code>
          )}
        </div>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      render: (entry) => (
        <div>
          <div className="text-[13px]">{humanizeResourceType(entry.resourceType as string || "-")}</div>
          {entry.responseStatus && (
            <div className="text-xs text-muted-foreground">
              HTTP {entry.responseStatus}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "success",
      header: "Result",
      render: (entry) => (
        <div className="whitespace-nowrap">
          <StatusBadge status={entry.success ? "SUCCESS" : "FAILED"} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Audit Log</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Track all administrative actions and system events
          </p>
        </div>
        <Button
          variant="ghost"
          size="md"
          icon={<RefreshCw size={16} strokeWidth={1.5} className={loading || summaryLoading ? "animate-spin" : ""} />}
          onClick={handleRefresh}
          disabled={loading || summaryLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Actions */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Icon icon={Activity} size="md" />
              </div>
              <CountPill count={summary.totalActions} />
            </div>
            <div className="tabular-nums text-xl font-semibold mb-1">
              {formatNumber(summary.totalActions)}
            </div>
            <div className="text-[13px] text-muted-foreground">Total actions</div>
          </div>

          {/* Successful */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Icon icon={CheckCircle2} size="md" className="text-[var(--success)]" muted={false} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                <span className="text-xs text-[var(--success)] font-medium">
                  {summary.totalActions > 0 ? Math.round((summary.successCount / summary.totalActions) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="tabular-nums text-xl font-semibold mb-1">
              {formatNumber(summary.successCount)}
            </div>
            <div className="text-[13px] text-muted-foreground">Successful</div>
          </div>

          {/* Didn't Go Through */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Icon 
                  icon={AlertCircle} 
                  size="md" 
                  className={summary.failureCount > 0 ? "text-[var(--danger)]" : undefined}
                  muted={summary.failureCount === 0}
                />
              </div>
              {summary.failureCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                  <span className="text-xs text-[var(--danger)] font-medium">
                    {summary.totalActions > 0 ? Math.round((summary.failureCount / summary.totalActions) * 100) : 0}%
                  </span>
                </div>
              )}
            </div>
            <div className="tabular-nums text-xl font-semibold mb-1">
              {formatNumber(summary.failureCount)}
            </div>
            <div className="text-[13px] text-muted-foreground">
              Didn't go through
            </div>
          </div>
        </div>
      ) : null}

      {/* Breakdown Cards */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Resource Type */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">By resource type</h3>
            <div className="space-y-2.5">
              {summary.byResourceType.length > 0 ? (
                summary.byResourceType
                  .sort((a, b) => b.total - a.total)
                  .map((r) => (
                    <button
                      key={r.resourceType}
                      type="button"
                      onClick={() => handleResourceTypeClick(r.resourceType)}
                      className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-medium">
                          {humanizeResourceType(r.resourceType)}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums">
                          {r.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          {r.successCount} successful
                        </span>
                        {r.failureCount > 0 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-[var(--danger)]">
                              {r.failureCount} failed
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                <p className="text-[13px] text-muted-foreground py-4 text-center">No data</p>
              )}
            </div>
          </div>

          {/* By Admin */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">By admin</h3>
            <div className="space-y-2.5">
              {summary.byActor.length > 0 ? (
                summary.byActor
                  .sort((a, b) => b.total - a.total)
                  .map((a) => {
                    const email = a.actorEmail || "";
                    
                    return (
                      <button
                        key={email || "unknown"}
                        type="button"
                        onClick={() => handleAdminClick(email)}
                        className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {email && email.trim() !== "" ? (
                            <AvatarInitials email={email} size="sm" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[var(--neutral-bg)] flex items-center justify-center shrink-0">
                              <Icon icon={Activity} size="sm" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate">
                              {email || "System / unknown"}
                            </div>
                          </div>
                          <span className="text-[13px] font-semibold tabular-nums shrink-0">
                            {a.total}
                          </span>
                        </div>
                      </button>
                    );
                  })
              ) : (
                <p className="text-[13px] text-muted-foreground py-4 text-center">No data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Inline Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Filter Logs</h3>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X size={12} strokeWidth={1.5} />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <AdminInput
            label="Search action"
            placeholder="e.g. 'Approved change request'"
            value={filters.description}
            onChange={(e) => setFilters((prev) => ({ ...prev, description: e.target.value }))}
          />
          
          <AdminSelect
            label="Resource"
            value={filters.resourceType}
            onChange={(e) => setFilters((prev) => ({ ...prev, resourceType: e.target.value }))}
            options={[
              { value: "", label: "All" },
              ...(summary?.byResourceType.map((r) => ({
                value: r.resourceType,
                label: humanizeResourceType(r.resourceType),
              })) || []),
            ]}
          />

          <AdminSelect
            label="Admin"
            value={filters.actorEmail}
            onChange={(e) => setFilters((prev) => ({ ...prev, actorEmail: e.target.value }))}
            options={[
              { value: "", label: "All" },
              { value: "null", label: "System" },
              ...(summary?.byActor
                .filter((a) => a.actorEmail && a.actorEmail.trim() !== "")
                .map((a) => ({
                  value: a.actorEmail,
                  label: a.actorEmail,
                })) || []),
            ]}
          />

          <AdminSelect
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            options={[
              { value: "", label: "All" },
              { value: "success", label: "Success" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {entries.length} of {formatNumber(total)} total
          </p>
          <Button variant="gradient" size="sm" onClick={handleApplyFilters} disabled={loading} className="!rounded">
            {loading ? "Filtering..." : "Apply"}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <InlineError message={error} onRetry={() => loadEntries()} />
      )}

      {/* Entries Table */}
      <div className="bg-card border border-border rounded-xl p-4">
        {loading && entries.length === 0 ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-secondary/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <DataTable
            columns={columns}
            data={entries}
            keyExtractor={(entry) => entry.id || entry.occurredAt || String(Math.random())}
            expandable
            renderExpanded={(entry) => {
              // Show all additional fields that aren't already in the table
              const visibleKeys = ['id', 'occurredAt', 'actorEmail', 'actorRoles', 'description', 'resourceType', 'resourcePath', 'success', 'responseStatus', 'httpMethod'];
              const additionalFields = Object.entries(entry).filter(
                ([key]) => !visibleKeys.includes(key) && entry[key] != null
              );
              
              if (additionalFields.length === 0) {
                return (
                  <div className="p-4 text-[13px] text-muted-foreground">
                    No additional details available
                  </div>
                );
              }
              
              return (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {additionalFields.map(([key, value]) => (
                      <DetailValue key={key} label={humanizeResourceType(key)} value={value} compact />
                    ))}
                  </div>
                </div>
              );
            }}
            pagination={{
              page,
              size,
              total,
              onPageChange: (newPage) => {
                setPage(newPage);
                // Load entries with the NEW page value
                loadEntriesDirectly(filters, newPage, size);
              },
              onSizeChange: (newSize) => {
                setSize(newSize);
                setPage(1);
                // Load entries with new size and reset to page 1
                loadEntriesDirectly(filters, 1, newSize);
              },
            }}
          />
        ) : !error ? (
          <EmptyState
            title="No activity matches these filters"
            description="Try adjusting your filters to see more results"
            action={
              hasActiveFilters
                ? { label: "Clear filters", onClick: handleResetFilters }
                : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}
