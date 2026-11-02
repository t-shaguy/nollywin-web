"use client";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { SubscriptionRequiredBanner } from "@/components/ui/subscription-banner";
import { TriviaFlow } from "../../features/game/presentation/trivia-flow";

export default function GamePage() {
  const { data: dashboard } = usePlayerDashboard();

  const hasActiveSubscription = dashboard?.hasActiveSubscription ?? false;
  const paymentPending = dashboard?.subscriptionPaymentPending ?? false;
  
  // Show banner if no active subscription or payment is pending
  if (!hasActiveSubscription || paymentPending) {
    return <SubscriptionRequiredBanner showCta paymentPending={paymentPending} />;
  }

  return <TriviaFlow />;
}
