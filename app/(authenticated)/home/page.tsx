"use client";
import { PLACEHOLDER_PERFORMANCE } from "@/lib/placeholder-performance";
import { DashboardHeader } from "../../features/home/presentation/dashboard-header";
import { DashboardStats } from "../../features/home/presentation/dashboard-stats";
import { PerformanceChart } from "../../features/home/presentation/performance-chart";
import { ActiveSubscriptionCard } from "../../features/home/presentation/active-subscription-card";
import { useWalletStore } from "@/store/wallet-store";
import { useAuthStore } from "@/store/auth-store";

// TODO: placeholder data standing in for:
//   GET /users/profile       -> points, tokensLeft, monthlyRank, attemptsLeft, tokenCost, tokenBalance
//   GET /notifications/unread-count -> bell badge
const PLACEHOLDER = {
  monthlyRank: 42,
  attemptsLeft: 3,
  tokenCost: 5,
};

export default function HomePage() {
  const { tokens } = useWalletStore();
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <DashboardHeader attemptsLeft={PLACEHOLDER.attemptsLeft} tokenCost={PLACEHOLDER.tokenCost} />

      <DashboardStats
        monthlyRank={PLACEHOLDER.monthlyRank}
        totalPoints={user?.totalPoints || 0}
        tokensLeft={tokens}
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
