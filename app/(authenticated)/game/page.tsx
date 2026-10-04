"use client";
import { useQuery } from "@tanstack/react-query";
import { getPlayerDashboard } from "@/lib/api/auth";
import { SubscriptionRequiredBanner } from "@/components/ui/subscription-banner";
import { TriviaFlow } from "../../features/game/presentation/trivia-flow";

export default function GamePage() {
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getPlayerDashboard,
  });

  const hasActiveSubscription = dashboard?.hasActiveSubscription ?? false;
  const paymentPending = dashboard?.subscriptionPaymentPending ?? false;
  
  // Show banner if no active subscription or payment is pending
  if (!hasActiveSubscription || paymentPending) {
    return <SubscriptionRequiredBanner showCta paymentPending={paymentPending} />;
  }

  return <TriviaFlow />;
}
