"use client";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";
import type { PlayerDashboard } from "@/lib/api/auth";

export function DashboardHeader({
  hasActiveSubscription,
  paymentPending,
  tokenBalance,
  tokenCost,
  subscription,
}: {
  hasActiveSubscription: boolean;
  paymentPending: boolean;
  tokenBalance: number;
  tokenCost: number;
  subscription: PlayerDashboard["subscription"];
}) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName ?? "Player";
  const isWalletLoading = useWalletStore((s) => s.isLoading);
  
  // Determine play availability
  const canPlay = hasActiveSubscription && tokenBalance >= tokenCost;
  const noTokensLeft = hasActiveSubscription && tokenBalance < tokenCost;

  // Generate token status text
  let tokenStatusText = "";
  let activeTillText = "";
  
  if (paymentPending) {
    tokenStatusText = "Payment pending";
  } else if (!hasActiveSubscription) {
    tokenStatusText = "No active plan";
  } else if (!isWalletLoading) {
    // Show token balance and cost
    tokenStatusText = `${tokenBalance} token${tokenBalance === 1 ? "" : "s"} left • ${tokenCost} token${tokenCost === 1 ? "" : "s"}/play`;
    
    // Show subscription expiry date
    if (subscription?.expiresAt) {
      const expiryDate = new Date(subscription.expiresAt).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
      activeTillText = `Active till ${expiryDate}`;
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">Here is your progress this week.</p>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-1.5">
        {paymentPending ? (
          <Button disabled className="disabled:opacity-50">
            <Clock size={18} />
            Payment Pending
          </Button>
        ) : (
          <Link href="/game">
            <Button disabled={!canPlay} className="disabled:opacity-50">
              <Play size={18} />
              {noTokensLeft ? "No tokens left" : "Start Playing"}
            </Button>
          </Link>
        )}
        {tokenStatusText && (
          <div className="flex flex-col items-start sm:items-end gap-0.5">
            <p className="text-xs text-muted-foreground">
              {tokenStatusText}
            </p>
            {activeTillText && (
              <p className="text-xs text-muted-foreground">
                {activeTillText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
