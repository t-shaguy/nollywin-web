"use client";
import { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  refreshSyncedClients,
  getSyncedClients,
  getSyncedClientByEmail,
  enableSyncedClient,
  disableSyncedClient,
  type SyncedClient,
} from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableWrapper } from "@/components/admin/admin-table-wrapper";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminCard } from "@/components/admin/admin-card";

export default function ClientSyncPage() {
  const [clients, setClients] = useState<SyncedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SyncedClient | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [refreshing, setRefreshing] = useState(false);
  const [actioningEmail, setActioningEmail] = useState<string | null>(null);

  // Load all clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      setError(null);
      const data = await getSyncedClients();
      setClients(data);
    } catch (err) {
      console.error("Error loading synced clients:", err);
      setError(err instanceof Error ? err.message : "Failed to load synced clients");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await refreshSyncedClients();
      
      // Maker-checker: show success with changeRequestId
      setSuccessMessage(response.message || "Client sync refresh submitted for approval");
      
      // Note: Do NOT reload clients yet (maker-checker pattern)
    } catch (err) {
      console.error("Error refreshing clients:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh synced clients");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSearch() {
    if (!searchEmail.trim()) {
      setSearchError("Please enter an email address");
      return;
    }
    
    try {
      setSearching(true);
      setSearchError(null);
      setSearchResult(null);
      
      const client = await getSyncedClientByEmail(searchEmail.trim());
      setSearchResult(client);
    } catch (err) {
      console.error("Error searching client:", err);
      setSearchError(err instanceof Error ? err.message : "Client not found");
    } finally {
      setSearching(false);
    }
  }

  async function handleToggleStatus(email: string, currentlyEnabled: boolean) {
    try {
      setActioningEmail(email);
      setError(null);
      setSuccessMessage(null);
      
      const response = currentlyEnabled 
        ? await disableSyncedClient(email)
        : await enableSyncedClient(email);
      
      // Maker-checker: show success with changeRequestId
      setSuccessMessage(
        response.message || 
        `Client ${currentlyEnabled ? "disable" : "enable"} request submitted for approval`
      );
      
      // Note: Do NOT update local state (maker-checker pattern)
    } catch (err) {
      console.error("Error toggling client status:", err);
      setError(err instanceof Error ? err.message : "Failed to update client status");
    } finally {
      setActioningEmail(null);
    }
  }

  // Format date
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never";
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine if client is effectively enabled (must be ACTIVE and not locallyDisabled)
  const isClientEnabled = (client: SyncedClient) => {
    return client.status === "ACTIVE" && !client.locallyDisabled;
  };

  // Get status badge color
  const getStatusColor = (client: SyncedClient) => {
    if (client.status === "ACTIVE" && !client.locallyDisabled) {
      return "bg-green-500/10 border-green-500/30 text-green-600";
    }
    return "bg-red-500/10 border-red-500/30 text-red-600";
  };

  // Get channel badge color
  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "WEB":
        return "bg-blue-500/10 border-blue-500/30 text-blue-600";
      case "MOBILE":
        return "bg-purple-500/10 border-purple-500/30 text-purple-600";
      case "ADMIN":
        return "bg-orange-500/10 border-orange-500/30 text-orange-600";
      default:
        return "bg-secondary border-border text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader 
          title="Client Sync" 
          description="Manage synced client applications" 
        />
        <div className="bg-card border border-border rounded p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading synced clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Client Sync" 
        description={`${clients.length} synced client${clients.length !== 1 ? "s" : ""}`}
        action={
          <AdminActionButton 
            icon={RefreshCw} 
            onClick={handleRefresh} 
            disabled={refreshing}
            size="md"
          >
            {refreshing ? "Refreshing..." : "Refresh from Auth"}
          </AdminActionButton>
        }
      />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-green-600 flex items-start gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
            <p className="text-xs mt-1 opacity-80">Changes will take effect after approval by a checker.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Search by Email */}
      <AdminCard title="Lookup Client by Email">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter client email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-11"
            />
          </div>
          <AdminActionButton 
            onClick={handleSearch} 
            disabled={searching}
            size="md"
          >
            {searching ? "Searching..." : "Search"}
          </AdminActionButton>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="mt-4 bg-secondary/30 rounded p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{searchResult.displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{searchResult.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium border ${getChannelColor(searchResult.channel)}`}>
                    {searchResult.channel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Partner: {searchResult.partnerCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last sync: {formatDate(searchResult.lastSyncedAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className={`rounded px-3 py-1 text-xs font-medium border ${getStatusColor(searchResult)}`}>
                  {isClientEnabled(searchResult) ? "Enabled" : "Disabled"}
                </div>
                <AdminActionButton
                  onClick={() => handleToggleStatus(searchResult.email, isClientEnabled(searchResult))}
                  disabled={actioningEmail === searchResult.email}
                  variant={isClientEnabled(searchResult) ? "danger" : "primary"}
                  size="sm"
                >
                  {isClientEnabled(searchResult) ? "Disable" : "Enable"}
                </AdminActionButton>
              </div>
            </div>
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded p-3 text-destructive text-sm">
            {searchError}
          </div>
        )}
      </AdminCard>

      {/* All Clients Table */}
      <AdminCard title="All Synced Clients">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No synced clients yet. Click "Refresh from Auth" to sync clients.
          </div>
        ) : (
          <AdminTableWrapper>
            <table className="w-full min-w-[640px]">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Client</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Channel</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Status</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Last Sync</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const enabled = isClientEnabled(client);
                  return (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="font-medium text-sm">{client.displayName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium border ${getChannelColor(client.channel)}`}>
                          {client.channel}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {enabled ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <XCircle size={16} className="text-red-600" />
                            )}
                            <span className={`text-xs sm:text-sm font-medium ${
                              enabled ? "text-green-600" : "text-red-600"
                            }`}>
                              {enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                          {client.status === "ACTIVE" && client.locallyDisabled && (
                            <span className="text-xs text-muted-foreground">
                              (Locally disabled)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                        {formatDate(client.lastSyncedAt)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <AdminActionButton
                          onClick={() => handleToggleStatus(client.email, enabled)}
                          disabled={actioningEmail === client.email}
                          variant={enabled ? "danger" : "secondary"}
                          size="sm"
                        >
                          {actioningEmail === client.email 
                            ? "Submitting..." 
                            : enabled 
                              ? "Disable" 
                              : "Enable"
                          }
                        </AdminActionButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableWrapper>
        )}
      </AdminCard>
    </div>
  );
}
