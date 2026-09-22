"use client";
import { SubscriptionRequiredBanner } from "@/components/ui/subscription-banner";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useWalletStore } from "@/store/wallet-store";
import { TriviaFlow } from "../../features/game/presentation/trivia-flow";

export default function GamePage() {
  const hasActivePlan = useSubscriptionStore((s) => s.hasActivePlan);
  const tokens = useWalletStore((s) => s.tokens);

  return (
    <>
      {/* Sidebar already redirects to /store when there's no active plan, but this stays
          as a safety net for anyone who lands on /game directly via URL. */}
      {hasActivePlan ? <TriviaFlow /> : <SubscriptionRequiredBanner showCta />}
    </>
  );
}
