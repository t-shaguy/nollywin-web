"use client";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStatusLabel } from "@/hooks/use-subscription-status-label";

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
  
  // Get unified status label
  const statusLabel = useSubscriptionStatusLabel({
    hasActiveSubscription,
    tokensLeft,
    subscriptionPaymentPending: paymentPending,
  });
  
  const noTokensLeft = hasActiveSubscription && tokensLeft === 0;
  const noPlan = !hasActiveSubscription && !paymentPending;

  // Status line text - use unified label first
  let statusText = "";
  let planLineText = "";
  let expiryLineText = "";
  
  if (isLoading) {
    // Don't show anything while loading
  } else if (paymentPending) {
    statusText = statusLabel.text; // "Payment pending"
  } else if (noPlan) {
    statusText = "No active plan";
  } else if (hasActiveSubscription) {
    // Show tokens
    statusText = statusLabel.text; // Uses unified label (e.g., "5 tokens left" or "Unlimited")
    
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
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Welcome text section */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back, {firstName}!</h1>
        <p className="text-sm md:text-base text-muted-foreground">Here is your progress this week.</p>
      </div>
      
      {/* Button and status section - stacked on mobile, side-by-side on md+ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
        {/* Placeholder div to push button right on desktop */}
        <div className="hidden sm:block sm:flex-1" />
        
        {/* Button + status text container */}
        <div className="flex flex-col items-stretch sm:items-end gap-1.5 min-w-0">
          {paymentPending ? (
            <Button disabled className="disabled:opacity-50 w-full sm:w-auto min-h-[44px]">
              <Clock size={18} className="flex-shrink-0" />
              Payment Pending
            </Button>
          ) : (
            <Link href={noPlan ? "/store" : "/game"} className="w-full sm:w-auto">
              <Button disabled={!canPlay && !noPlan} className="disabled:opacity-50 w-full min-h-[44px]">
                <Play size={18} className="flex-shrink-0" />
                {noPlan ? "Get a Plan" : noTokensLeft ? "No tokens left" : "Start Playing"}
              </Button>
            </Link>
          )}
          
          {/* Status lines - left-aligned on mobile, right-aligned on sm+ */}
          {!isLoading && statusText && (
            <div className="flex flex-col items-start sm:items-end gap-0.5 min-w-0">
              <p className="text-xs text-muted-foreground break-words">
                {statusText}
              </p>
              {planLineText && (
                <p className="text-xs text-muted-foreground break-words">
                  {planLineText}
                </p>
              )}
              {expiryLineText && (
                <p className="text-xs text-muted-foreground break-words">
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
    </div>
  );
}
