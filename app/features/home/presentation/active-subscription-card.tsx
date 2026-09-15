"use client";
import Link from "next/link";
import { Star } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription-store";

export function ActiveSubscriptionCard() {
  const { hasActivePlan, planName, expiresAt } = useSubscriptionStore();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col">
      <h2 className="font-bold mb-4">Active Subscription</h2>
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-primary/10 border border-primary/20 rounded-xl py-8 px-4">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Star size={24} className="text-primary" />
        </div>
        <p className="font-bold text-lg">{hasActivePlan ? planName : "No active plan"}</p>
        {hasActivePlan ? (
          <p className="text-sm text-muted-foreground mt-1">Valid until {expiresAt}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">No expiry date</p>
        )}
        <Link href="/store" className="text-primary text-sm font-medium hover:underline mt-3">
          {hasActivePlan ? "Manage Plan" : "Choose a Plan"}
        </Link>
      </div>
    </div>
  );
}
