"use client";
import { useEffect, useState } from "react";
import { DashboardHeader } from "../../features/home/presentation/dashboard-header";
import { DashboardStats } from "../../features/home/presentation/dashboard-stats";
import { PerformanceChart } from "../../features/home/presentation/performance-chart";
import { ActiveSubscriptionCard } from "../../features/home/presentation/active-subscription-card";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { usePerformanceTrend } from "../../features/home/hooks/use-performance-trend";

export default function HomePage() {
  // Unified dashboard query
  const { data: dashboard, isLoading } = usePlayerDashboard();

  // Performance trend (React Query now, no stagger needed)
  const { data: performanceData } = usePerformanceTrend(7);

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
        subscription={dashboard?.subscription}
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
