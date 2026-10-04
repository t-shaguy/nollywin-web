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
    <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col">
      <h2 className="font-bold mb-4">Active Subscription</h2>
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-primary/10 border border-primary/20 rounded-xl py-8 px-4">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          {paymentPending ? <Clock size={24} className="text-primary" /> : <Star size={24} className="text-primary" />}
        </div>
        <p className="font-bold text-lg">{statusText}</p>
        <p className="text-sm text-muted-foreground mt-1">{expiryText}</p>
        <Link href="/store" className="text-primary text-sm font-medium hover:underline mt-3">
          {hasActiveSubscription ? "Manage Plan" : "Choose a Plan"}
        </Link>
      </div>
    </div>
  );
}
