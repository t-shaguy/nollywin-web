"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MOCK_ADMIN_USERS } from "@/lib/mock/admin-users";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const filteredUsers = MOCK_ADMIN_USERS.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === "all" || user.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Users</h1>
        <p className="text-muted-foreground mt-1">Manage and view user accounts</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-border bg-input text-foreground"
        >
          <option value="all">All Plans</option>
          <option value="Pro">Pro</option>
          <option value="Free">Free</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold">User</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">Plan</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">Tokens</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">Joined</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    user.plan === "Pro" 
                      ? "bg-primary/10 border border-primary/30 text-primary" 
                      : "bg-secondary border border-border text-muted-foreground"
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{user.tokens}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{user.joined}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-gray-500"}`} />
                    <span className="text-sm">{user.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/admin/users/${user.id}`}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No users found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}
