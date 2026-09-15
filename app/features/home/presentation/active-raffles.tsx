"use client";
import { Trophy } from "lucide-react";
import { useRaffleStore } from "@/store/raffle-store";

// Scoped to what Home Dashboard needs (qualified / not yet qualified). The full raffle
// status badge set (Won, Not Won, Pending Draw, Not Yet Drawn, Qualified, Entered) belongs
// to the Raffles Module task and will likely replace/extend this when that's built.
function QualificationBadge({ hasTickets }: { hasTickets: boolean }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        hasTickets ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      {hasTickets ? "Entered" : "Not Entered"}
    </span>
  );
}

export function ActiveRaffles() {
  const { raffles, getUserTicketsForRaffle } = useRaffleStore();
  const activeRaffles = raffles.filter((r) => r.status === "active");

  if (activeRaffles.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
        No active raffles right now — check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeRaffles.map((raffle) => {
        const userTickets = getUserTicketsForRaffle(raffle.id);
        
        return (
          <div key={raffle.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{raffle.prizeName}</p>
              <p className="text-sm text-muted-foreground">
                {raffle.costPerTicket.toLocaleString()} pts/ticket • Draws {raffle.drawDate}
              </p>
              {userTickets > 0 && (
                <p className="text-xs text-primary mt-1">{userTickets} {userTickets === 1 ? "ticket" : "tickets"} owned</p>
              )}
            </div>
            <QualificationBadge hasTickets={userTickets > 0} />
          </div>
        );
      })}
    </div>
  );
}
