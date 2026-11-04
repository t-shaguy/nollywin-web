"use client";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function DashboardHeader({
  canPlay,
  tokensLeft,
  hasActiveSubscription,
  paymentPending,
  expiresAt,
  isLoading,
  subscription,
}: {
  canPlay: boolean;
  tokensLeft: number | null; // 0 = no plan, null = unlimited, N = tokens remaining
  hasActiveSubscription: boolean;
  paymentPending: boolean;
  expiresAt?: string | null;
  isLoading?: boolean;
  subscription?: { packageName: string; expiresAt: string } | null;
}) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName ?? "Player";
  
  // REAL BACKEND: Button states
  // 1. No plan: hasActiveSubscription = false → "Get a Plan"
  // 2. Active plan, 0 tokens: hasActiveSubscription = true, tokensLeft = 0 → "No tokens left" (disabled)
  // 3. Active plan with tokens: hasActiveSubscription = true, tokensLeft = N → "Start Playing" (enabled)
  // 4. Unlimited: hasActiveSubscription = true, tokensLeft = null → "Start Playing" (enabled)
  
  const noTokensLeft = hasActiveSubscription && tokensLeft === 0;
  const noPlan = !hasActiveSubscription && !paymentPending;

  // Status line text
  let statusText = "";
  let planLineText = "";
  let expiryLineText = "";
  
  if (isLoading) {
    // Don't show anything while loading
  } else if (paymentPending) {
    statusText = "Payment pending";
  } else if (noPlan) {
    statusText = "No active plan";
  } else if (hasActiveSubscription) {
    // Show tokens
    if (tokensLeft === null) {
      statusText = "Unlimited plays";
    } else {
      statusText = `${tokensLeft} token${tokensLeft === 1 ? '' : 's'} left`;
    }
    
    // Show plan name
    if (subscription?.packageName) {
      const packageName = subscription.packageName;
      // Don't duplicate "plan" if it's already in the name
      if (packageName.toLowerCase().includes('plan')) {
        planLineText = `${packageName} active`;
      } else {
        planLineText = `${packageName} plan active`;
      }
    }
    
    // Show expiry date (DD MMM YYYY, Africa/Lagos)
    if (expiresAt) {
      const expiryDate = new Date(expiresAt).toLocaleDateString("en-GB", { 
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Lagos"
      });
      expiryLineText = `Active till ${expiryDate}`;
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
          <Link href={noPlan ? "/store" : "/game"}>
            <Button disabled={!canPlay && !noPlan} className="disabled:opacity-50">
              <Play size={18} />
              {noPlan ? "Get a Plan" : noTokensLeft ? "No tokens left" : "Start Playing"}
            </Button>
          </Link>
        )}
        {!isLoading && statusText && (
          <div className="flex flex-col items-start sm:items-end gap-0.5">
            <p className="text-xs text-muted-foreground">
              {statusText}
            </p>
            {planLineText && (
              <p className="text-xs text-muted-foreground">
                {planLineText}
              </p>
            )}
            {expiryLineText && (
              <p className="text-xs text-muted-foreground">
                {expiryLineText}
              </p>
            )}
            {noPlan && (
              <Link href="/store" className="text-xs text-primary hover:underline mt-0.5">
                Browse plans
              </Link>
            )}
            {noTokensLeft && (
              <Link href="/store" className="text-xs text-primary hover:underline mt-0.5">
                Buy a new plan
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
