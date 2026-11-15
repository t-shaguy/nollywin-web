"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Users as UsersIcon, CreditCard, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUsers, type AdminUserListItem } from "@/lib/api/admin";
import { Icon } from "@/components/admin/icon";
import { DownloadMenu } from "@/components/admin/download-menu";
import { PrintView } from "@/components/admin/print-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/date-format";
import { getReportConfig } from "@/lib/export/report-config";
import {
  DataTableContainer,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableCellStack,
} from "@/components/ui/data-table";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination state (0-indexed backend)
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers(currentPage, pageSize);
        setUsers(response.entries);
        setTotalUsers(response.total);
        setTotalPages(Math.ceil(response.total / pageSize));
      } catch (err) {
        console.error("Error loading users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [currentPage]);

  // Calculate stats
  const activeSubscriptions = users.filter(u => u.subscriptionStatus === "ACTIVE").length;
  const totalTokens = users.reduce((sum, u) => sum + u.tokenBalance, 0);

  // Client-side filtering
  const filteredUsers = users.filter((user) => {
    const displayName = user.alias || user.firstName || user.lastName || user.email || user.phoneNumber || "—";
    const matchesSearch = 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchTerm)) ||
      user.authUserId.includes(searchTerm);
    
    const displayPlan = user.packageName || user.plan;
    const matchesPlan = planFilter === "all" || displayPlan === planFilter;
    
    const matchesStatus = statusFilter === "all" || user.subscriptionStatus === statusFilter;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Get user display name (alias > firstName lastName > email > phone)
  const getDisplayName = (user: AdminUserListItem) => {
    if (user.alias) return user.alias;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    return user.email || user.phoneNumber || "Unknown User";
  };

  if (loading && currentPage === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground mb-1">Users</h1>
          <p className="text-[13px] text-muted-foreground">Manage user accounts</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-[13px]">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground mb-1">Users</h1>
          <p className="text-[13px] text-muted-foreground">Manage user accounts</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-[13px]">
          {error}
        </div>
      </div>
    );
  }

  // Print view
  if (showPrintView) {
    const config = getReportConfig("users");
    if (!config) return null;

    return (
      <PrintView
        title="Users"
        filters={{
          "Plan": planFilter === "all" ? "All" : planFilter,
          "Status": statusFilter === "all" ? "All" : statusFilter,
          "Search": searchTerm || "None",
        }}
        columns={config.columns}
        data={filteredUsers}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground mb-1">Users</h1>
          <p className="text-[13px] text-muted-foreground">Manage user accounts and subscriptions</p>
        </div>
        <DownloadMenu
          reportKey="users"
          filters={{}}
          onPrintClick={() => setShowPrintView(true)}
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon icon={UsersIcon} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Total Users</p>
          </div>
          <p className="text-[24px] font-semibold text-foreground">{totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon icon={CreditCard} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Active Subscriptions</p>
          </div>
          <p className="text-[24px] font-semibold text-foreground">{activeSubscriptions.toLocaleString()}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon icon={Coins} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Total Tokens</p>
          </div>
          <p className="text-[24px] font-semibold text-foreground">{totalTokens.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-[13px]"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-input bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Plans</option>
            <option value="FREE">None</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-input bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {filteredUsers.length === users.length 
            ? `Showing ${users.length} of ${totalUsers.toLocaleString()} users`
            : `Found ${filteredUsers.length} of ${users.length} users on this page`
          }
        </p>
      </div>

      {/* Table */}
      <DataTableContainer>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>User</DataTableHead>
            <DataTableHead>Plan</DataTableHead>
            <DataTableHead>Tokens</DataTableHead>
            <DataTableHead>Joined</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Actions</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {filteredUsers.map((user) => (
            <DataTableRow key={user.authUserId}>
              <DataTableCell>
                <DataTableCellStack
                  primary={getDisplayName(user)}
                  secondary={user.email}
                />
              </DataTableCell>
              <DataTableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium ${
                  user.packageName
                    ? "bg-primary/10 border border-primary/30 text-primary" 
                    : "bg-secondary border border-border text-muted-foreground"
                }`}>
                  {user.packageName || "None"}
                </span>
              </DataTableCell>
              <DataTableCell>{user.tokenBalance.toLocaleString()}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(user.joinedAt)}</DataTableCell>
              <DataTableCell>
                {user.subscriptionStatus ? (
                  <StatusBadge status={user.subscriptionStatus as "ACTIVE" | "EXPIRED"} />
                ) : (
                  <span className="text-[13px] text-muted-foreground">Inactive</span>
                )}
              </DataTableCell>
              <DataTableCell>
                <Link href={`/admin/users/${user.authUserId}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableContainer>
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground text-[13px]">
              {searchTerm || planFilter !== "all" || statusFilter !== "all"
                ? "No users found matching your filters" 
                : "No users yet"
              }
            </div>
          )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              variant="outline"
              size="sm"
            >
              <ChevronLeft size={14} className="mr-1" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
