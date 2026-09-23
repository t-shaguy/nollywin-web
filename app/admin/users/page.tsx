"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getUsers, type AdminUserListItem } from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableWrapper } from "@/components/admin/admin-table-wrapper";
import { AdminActionButton } from "@/components/admin/admin-action-button";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  
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

  // Client-side filtering (search and plan filter)
  const filteredUsers = users.filter((user) => {
    const displayName = user.alias || user.firstName || user.lastName || user.email || user.phoneNumber || "—";
    const matchesSearch = 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchTerm)) ||
      user.authUserId.includes(searchTerm);
    
    const matchesPlan = planFilter === "all" || user.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  // Format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        <AdminPageHeader 
          title="Users" 
          description="Manage and view user accounts" 
        />
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader 
          title="Users" 
          description="Manage and view user accounts" 
        />
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Users" 
        description={`${totalUsers.toLocaleString()} total user${totalUsers !== 1 ? "s" : ""}`}
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-border bg-input text-foreground text-sm"
        >
          <option value="all">All Plans</option>
          <option value="FREE">Free</option>
          <option value="Pro">Pro</option>
          <option value="Premium">Premium</option>
        </select>
      </div>

      <AdminTableWrapper>
        <table className="w-full min-w-[640px]">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">User</th>
              <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Plan</th>
              <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Tokens</th>
              <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Joined</th>
              <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Status</th>
              <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.authUserId} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div>
                    <p className="font-semibold text-sm">{getDisplayName(user)}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    user.plan !== "FREE" 
                      ? "bg-primary/10 border border-primary/30 text-primary" 
                      : "bg-secondary border border-border text-muted-foreground"
                  }`}>
                    {user.packageName || user.plan}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm">{user.tokenBalance.toLocaleString()}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{formatDate(user.joinedAt)}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      user.subscriptionStatus === "ACTIVE" 
                        ? "bg-green-500" 
                        : user.subscriptionStatus === "EXPIRED" 
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`} />
                    <span className="text-xs sm:text-sm">{user.subscriptionStatus || "Free"}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <Link href={`/admin/users/${user.authUserId}`}>
                    <AdminActionButton variant="secondary" size="sm">
                      View
                    </AdminActionButton>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {searchTerm || planFilter !== "all" 
              ? "No users found matching your filters" 
              : "No users yet"
            }
          </div>
        )}
      </AdminTableWrapper>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <AdminActionButton
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
            >
              Previous
            </AdminActionButton>
            <AdminActionButton
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              variant="secondary"
              size="sm"
            >
              Next
              <ChevronRight size={14} className="ml-1" />
            </AdminActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
