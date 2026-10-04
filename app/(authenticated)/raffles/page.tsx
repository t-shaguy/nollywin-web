"use client";
import { useEffect } from "react";
import { ActiveDrawCard } from "../../features/raffles/presentation/active-draw-card";
import { useRaffleStore, fetchActiveDraws } from "@/store/raffle-store";
import { useWalletStore } from "@/store/wallet-store";

export default function RafflesPage() {
  const { raffles, isLoading } = useRaffleStore();
  const tokenBalance = useWalletStore((s) => s.tokenBalance);

  // Fetch active draws on page load
  useEffect(() => {
    fetchActiveDraws().catch((err) => {
      console.error("Failed to fetch active draws:", err);
    });
  }, []);

  const activeRaffles = raffles.filter((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Draws & Rewards</h1>
          <p className="text-muted-foreground text-sm mt-1">Exchange your tokens for draw tickets to win big prizes.</p>
        </div>

        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
            Loading draws...
          </div>
        ) : activeRaffles.length > 0 ? (
          <div className="space-y-6">
            {activeRaffles.map((raffle) => (
              <ActiveDrawCard
                key={raffle.id}
                draw={raffle}
                userTickets={raffle.userTicketCount || 0}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No active draws right now — check back soon.
          </div>
        )}
      </div>
  );
}
