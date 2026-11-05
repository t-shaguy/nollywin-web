"use client";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import type { PlayerDashboard } from "@/lib/api/auth";

export function ActiveSubscriptionCard({
  hasActiveSubscription,
  paymentPending,
  subscription,
}: {
  hasActiveSubscription: boolean;
  paymentPending: boolean;
  subscription: PlayerDashboard["subscription"];
}) {
  // Determine display state
  let statusText = "No active plan";
  let expiryText = "No expiry date";
  
  if (paymentPending) {
    statusText = "Payment Pending";
    expiryText = "Confirming your subscription...";
  } else if (hasActiveSubscription && subscription) {
    statusText = subscription.packageName;
    const expiryDate = new Date(subscription.expiresAt).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
    expiryText = `Valid until ${expiryDate}`;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 h-full flex flex-col">
      <h2 className="font-bold text-sm md:text-base mb-4">Active Subscription</h2>
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-primary/10 border border-primary/20 rounded-xl py-6 md:py-8 px-4">
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/20 flex items-center justify-center mb-3 md:mb-4 flex-shrink-0">
          {paymentPending ? <Clock size={22} className="md:w-6 md:h-6 text-primary" /> : <Star size={22} className="md:w-6 md:h-6 text-primary" />}
        </div>
        <p className="font-bold text-base md:text-lg break-words w-full">{statusText}</p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words w-full">{expiryText}</p>
        <Link href="/store" className="text-primary text-xs md:text-sm font-medium hover:underline mt-3 min-h-[36px] flex items-center">
          {hasActiveSubscription ? "Manage Plan" : "Choose a Plan"}
        </Link>
      </div>
    </div>
  );
}
