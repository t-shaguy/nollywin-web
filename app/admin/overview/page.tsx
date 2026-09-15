"use client";
import { Users, Play, CreditCard, Upload } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/ui/stat-card";

const REVENUE_DATA = [
  { day: "Mon", revenue: 4500 },
  { day: "Tue", revenue: 6200 },
  { day: "Wed", revenue: 5800 },
  { day: "Thu", revenue: 7400 },
  { day: "Fri", revenue: 8100 },
  { day: "Sat", revenue: 9200 },
  { day: "Sun", revenue: 6800 },
];

const RECENT_ACTIVITY = [
  { title: "New Subscription", subtitle: "Tola_Stars • 2 mins ago" },
  { title: "Question Added", subtitle: "Admin • 15 mins ago" },
  { title: "User Registered", subtitle: "ChidiB • 32 mins ago" },
  { title: "Prize Claimed", subtitle: "NgoziK • 1 hour ago" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Platform Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <Users size={24} className="text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-3xl font-extrabold mt-1">12,405</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <Play size={24} className="text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground">Active Today</p>
          <p className="text-3xl font-extrabold mt-1">3,210</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
            <CreditCard size={24} className="text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground">Revenue (MTD)</p>
          <p className="text-3xl font-extrabold mt-1">₦1.2M</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <Upload size={24} className="text-purple-500" />
          </div>
          <p className="text-sm text-muted-foreground">Questions</p>
          <p className="text-3xl font-extrabold mt-1">4,500+</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Revenue Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `₦${value / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {RECENT_ACTIVITY.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
