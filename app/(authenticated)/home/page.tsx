"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "../../features/home/presentation/dashboard-header";
import { DashboardStats } from "../../features/home/presentation/dashboard-stats";
import { PerformanceChart } from "../../features/home/presentation/performance-chart";
import { ActiveSubscriptionCard } from "../../features/home/presentation/active-subscription-card";
import { getPlayerDashboard } from "@/lib/api/auth";
import { usePerformanceTrend } from "../../features/home/hooks/use-performance-trend";

export default function HomePage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getPlayerDashboard,
  });

  const { data: performanceData, loading: performanceLoading } = usePerformanceTrend();

  const attemptsLeft = dashboard?.freeAttemptsLeft ?? 0;
  const tokenCost = dashboard?.tokenCostPerPlay ?? 0;
  const rank = dashboard?.monthlyRank?.rank ?? null;
  const totalPoints = dashboard?.totalPoints ?? 0;
  const tokensLeft = dashboard?.tokensLeft ?? 0;

  return (
    <div className="space-y-6">
      <DashboardHeader attemptsLeft={attemptsLeft} tokenCost={tokenCost} />

      <DashboardStats
        monthlyRank={rank}
        totalPoints={totalPoints}
        tokensLeft={tokensLeft}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart data={performanceData} />
        </div>
        <ActiveSubscriptionCard />
      </div>
    </div>
  );
}
