"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DashboardHeader } from "../../features/home/presentation/dashboard-header";
import { DashboardStats } from "../../features/home/presentation/dashboard-stats";
import { PerformanceChart } from "../../features/home/presentation/performance-chart";
import { ActiveSubscriptionCard } from "../../features/home/presentation/active-subscription-card";
import { getPlayerDashboard } from "@/lib/api/auth";
import { usePerformanceTrend } from "../../features/home/hooks/use-performance-trend";
import { delay } from "@/lib/utils/request-stagger";

export default function HomePage() {
  // Add a small stagger flag to prevent all hooks from firing simultaneously
  const [staggerComplete, setStaggerComplete] = useState(false);
  
  useEffect(() => {
    // Brief delay before allowing performance trend hook to fire
    // This staggers it slightly after the useQuery dashboard call
    const timer = setTimeout(() => setStaggerComplete(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getPlayerDashboard,
  });

  // Only trigger performance trend after stagger delay
  const { data: performanceData, loading: performanceLoading } = usePerformanceTrend(staggerComplete);

  const rank = dashboard?.monthlyRank?.rank ?? null;
  const totalPoints = dashboard?.totalPoints ?? 0;
  const tokensLeft = dashboard?.tokensLeft ?? 0;
  const canPlay = dashboard?.canPlay ?? false;
  const hasActiveSubscription = dashboard?.hasActiveSubscription ?? false;
  const paymentPending = dashboard?.subscriptionPaymentPending ?? false;

  return (
    <div className="space-y-6">
      <DashboardHeader 
        canPlay={canPlay}
        tokensLeft={tokensLeft}
        hasActiveSubscription={hasActiveSubscription}
        paymentPending={paymentPending}
        expiresAt={dashboard?.subscription?.expiresAt}
        isLoading={isLoading}
      />

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
        <ActiveSubscriptionCard 
          hasActiveSubscription={hasActiveSubscription}
          paymentPending={paymentPending}
          subscription={dashboard?.subscription ?? null}
        />
      </div>
    </div>
  );
}
