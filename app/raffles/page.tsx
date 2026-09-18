"use client";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { ActiveDrawCard } from "../features/raffles/presentation/active-draw-card";
import { useRaffleStore } from "@/store/raffle-store";
import { useWalletStore } from "@/store/wallet-store";

export default function RafflesPage() {
  const { raffles } = useRaffleStore();
  const tokens = useWalletStore((s) => s.tokens);

  const activeRaffles = raffles.filter((r) => r.status === "ACTIVE");

  return (
    <AuthenticatedShell tokenBalance={tokens} unreadCount={0}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Raffles & Rewards</h1>
          <p className="text-muted-foreground text-sm mt-1">Exchange your points for raffle tickets to win big.</p>
        </div>

        {activeRaffles.length > 0 ? (
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
            No active raffle draws right now — check back soon.
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
