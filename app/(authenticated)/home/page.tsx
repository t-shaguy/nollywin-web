"use client";
import { useEffect, useState } from "react";
import { PLACEHOLDER_PERFORMANCE } from "@/lib/placeholder-performance";
import { DashboardHeader } from "../../features/home/presentation/dashboard-header";
import { DashboardStats } from "../../features/home/presentation/dashboard-stats";
import { PerformanceChart } from "../../features/home/presentation/performance-chart";
import { ActiveSubscriptionCard } from "../../features/home/presentation/active-subscription-card";
import { getPlayerDashboard, type PlayerDashboard } from "@/lib/api/auth";

export default function HomePage() {
  const [dashboard, setDashboard] = useState<PlayerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerDashboard()
      .then(setDashboard)
      .catch((err) => console.error("Failed to load dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const attemptsLeft = dashboard?.freeAttemptsLeft ?? 0;
  const tokenCost = dashboard?.tokenCostPerPlay ?? 0;
  const rank = dashboard?.monthlyRank?.rank ?? null;
  const totalPoints = dashboard?.totalPoints ?? 0;
  const tokensLeft = dashboard?.tokensLeft ?? 0;

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader attemptsLeft={attemptsLeft} tokenCost={tokenCost} />

      <DashboardStats
        monthlyRank={rank}
        totalPoints={totalPoints}
        tokensLeft={tokensLeft}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart data={PLACEHOLDER_PERFORMANCE} />
        </div>
        <ActiveSubscriptionCard />
      </div>
    </div>
  );
}
