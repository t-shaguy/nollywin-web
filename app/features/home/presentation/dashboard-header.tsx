"use client";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import type { PlayerDashboard } from "@/lib/api/auth";

export function DashboardHeader({
  hasActiveSubscription,
  paymentPending,
  attemptsRemaining,
  tokenCost,
  subscription,
}: {
  hasActiveSubscription: boolean;
  paymentPending: boolean;
  attemptsRemaining: number | null;
  tokenCost: number;
  subscription: PlayerDashboard["subscription"];
}) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName ?? "Player";
  
  // Determine play availability
  const canPlay = hasActiveSubscription && (attemptsRemaining === null || attemptsRemaining > 0);
  const noAttemptsLeft = hasActiveSubscription && attemptsRemaining !== null && attemptsRemaining <= 0;

  // Generate attempt status text
  let attemptStatusText = "";
  
  if (paymentPending) {
    attemptStatusText = "Payment pending";
  } else if (!hasActiveSubscription) {
    attemptStatusText = "No active plan";
  } else if (attemptsRemaining === null) {
    // Pure time-based subscription with no attempt limit
    attemptStatusText = `Unlimited plays • ${tokenCost} token${tokenCost === 1 ? "" : "s"}/play`;
  } else if (subscription) {
    // Has attempt-based subscription
    const { attemptsPeriod, attemptsResetAt, expiresAt } = subscription;
    
    if (attemptsPeriod === "DAY" && attemptsResetAt) {
      // Daily resets - show reset time
      const resetTime = new Date(attemptsResetAt).toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      });
      attemptStatusText = `${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left today, resets at ${resetTime}`;
    } else if (attemptsPeriod === "MONTH") {
      // Monthly pool - show valid until date
      const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
      attemptStatusText = `${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left this period, valid until ${expiryDate}`;
    }
    
    // Append token cost
    attemptStatusText += ` • ${tokenCost} token${tokenCost === 1 ? "" : "s"}/play`;
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
              {noAttemptsLeft ? "No attempts left" : "Start Playing"}
            </Button>
          </Link>
        )}
        <p className="text-xs text-muted-foreground">
          {attemptStatusText}
        </p>
      </div>
    </div>
  );
}
