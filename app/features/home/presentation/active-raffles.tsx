"use client";
import { useEffect, useState } from "react";
import { Gift, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getActiveDraws, type RaffleDraw } from "@/lib/api/leaderboard";
import { formatDateRange } from "@/lib/utils/draw-countdown";

export function ActiveRaffles() {
  const router = useRouter();
  const [draws, setDraws] = useState<RaffleDraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveDraws()
      .then((data) => setDraws(data.slice(0, 3))) // Show max 3
      .catch((err) => console.error("Failed to load active draws:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-[16px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Active Raffles</h2>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (draws.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[16px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Active Raffles</h2>
        </div>
        <p className="text-sm text-muted-foreground">No active draws at the moment</p>
      </div>
    );
  }

  // Helper: Determine if a draw has multiple tiers (show tier list)
  // REAL BACKEND: All draws have tiers. Only show tier list if multiple tiers OR single tier with tierName !== "Winner"
  const shouldShowTiers = (draw: RaffleDraw) => {
    if (!draw.prizeTiers || draw.prizeTiers.length === 0) return false; // Legacy draw
    if (draw.prizeTiers.length > 1) return true; // Multiple tiers
    return draw.prizeTiers[0].tierName !== "Winner"; // Single tier with custom name
  };

  // Helper: Check if draw is legacy (null dates, ticket-based)
  const isLegacyDraw = (draw: RaffleDraw) => {
    return !draw.startsOn || !draw.endsOn || !draw.drawDate;
  };

  return (
    <div className="bg-card border border-border rounded-[16px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Active Raffles</h2>
        <button
          onClick={() => router.push("/raffles")}
          className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
        >
          View All
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {draws.map((draw) => {
          const legacy = isLegacyDraw(draw);
          const dateRange = legacy ? null : formatDateRange(draw.startsOn, draw.endsOn);
          const showTiers = shouldShowTiers(draw);

          return (
            <div
              key={draw.id}
              onClick={() => router.push("/raffles")}
              className="bg-secondary/30 rounded-[12px] p-4 space-y-2 cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold line-clamp-1">{draw.prizeName}</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {legacy ? draw.scheduleLabel : `${draw.scheduleLabel} • ${dateRange || draw.scheduleLabel}`}
                  </p>
                </div>
              </div>

              {/* Prize Tiers (only show if multiple tiers or single non-Winner tier) */}
              {showTiers && (
                <div className="space-y-1.5 pt-1">
                  {draw.prizeTiers
                    .sort((a, b) => a.position - b.position)
                    .map((tier, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">{tier.tierName}</span>
                        <span className="font-medium">{tier.prizeName} ({tier.winnersCount})</span>
                      </div>
                    ))}
                </div>
              )}

              {/* User stats: V37 shows points + entered status, legacy shows tickets */}
              <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border/50">
                {legacy ? (
                  <>
                    {draw.myTickets !== undefined && (
                      <span className="text-muted-foreground">You have {draw.myTickets} {draw.myTickets === 1 ? 'entry' : 'entries'}</span>
                    )}
                    {draw.myTickets === undefined && (
                      <span className="text-muted-foreground">{draw.entryCount} total entries</span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Your points</span>
                      <span className="font-bold text-primary">{draw.myPoints ?? 0} pts</span>
                    </div>
                    {draw.entered ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                        Entered
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                        Play to enter
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
