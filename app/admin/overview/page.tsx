"use client";
import { useEffect, useState } from "react";
import { Users, Play, CreditCard, Upload } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getDashboardOverview,
  getRevenueTrend,
  getRecentActivity,
  type DashboardOverview,
  type RevenueTrendEntry,
  type RecentActivity,
} from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminCard } from "@/components/admin/admin-card";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [overviewData, trendData, activityData] = await Promise.all([
          getDashboardOverview(),
          getRevenueTrend(),
          getRecentActivity(),
        ]);
        setOverview(overviewData);
        setRevenueTrend(trendData);
        setRecentActivity(activityData);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // Format kobo to naira (divide by 100)
  const formatNaira = (kobo: number) => {
    const naira = kobo / 100;
    if (naira >= 1_000_000) {
      return `₦${(naira / 1_000_000).toFixed(1)}M`;
    }
    if (naira >= 1_000) {
      return `₦${(naira / 1_000).toFixed(1)}K`;
    }
    return `₦${naira.toLocaleString()}`;
  };

  // Format date for chart (YYYY-MM-DD -> short day name)
  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Format relative time
  const formatRelativeTime = (isoTimestamp: string) => {
    const now = new Date();
    const then = new Date(isoTimestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminPageHeader title="Platform Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 sm:p-6 animate-pulse">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted mb-3 sm:mb-4" />
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminPageHeader title="Platform Overview" />
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <AdminPageHeader title="Platform Overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard
          icon={Users}
          label="Total Users"
          value={overview?.totalUsers.toLocaleString() ?? "—"}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <AdminStatCard
          icon={Play}
          label="Active Today"
          value={overview?.activeToday.toLocaleString() ?? "—"}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
        />
        <AdminStatCard
          icon={CreditCard}
          label="Revenue (MTD)"
          value={overview ? formatNaira(overview.revenueMtd) : "—"}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
        />
        <AdminStatCard
          icon={Upload}
          label="Questions"
          value={overview ? `${overview.totalQuestions.toLocaleString()}+` : "—"}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminCard title="Revenue Trend (Last 7 Days)" className="lg:col-span-2">
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={revenueTrend.map((entry) => ({
                  day: formatChartDate(entry.date),
                  revenue: entry.revenue / 100,
                  fullDate: entry.date,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={11}
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={11}
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  tickFormatter={(value) => `₦${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "0.5rem",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Bar dataKey="revenue" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-xs">
              No revenue data available
            </div>
          )}
        </AdminCard>

        <AdminCard title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs">{activity.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.actorEmail} • {formatRelativeTime(activity.occurredAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No recent activity</div>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
