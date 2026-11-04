"use client";
import { Gift, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { type RaffleDraw } from "@/lib/api/leaderboard";
import { formatDateRange } from "@/lib/utils/draw-countdown";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";

interface ActiveRafflesProps {
  dashboardDraws?: Array<{
    id: string;
    raffleCode: string;
    prizeName: string;
    startsOn: string | null;
    endsOn: string | null;
    drawDate: string | null;
    myPoints: number | null;
    entered: boolean;
    myTickets: number;
  }>;
}

export function ActiveRaffles({ dashboardDraws }: ActiveRafflesProps) {
  const router = useRouter();
  const { data: dashboard } = usePlayerDashboard();

  // Use dashboard draws if provided (from parent), otherwise use dashboard hook
  const draws = dashboardDraws || dashboard?.activeRaffles || [];
  const loading = !dashboard && !dashboardDraws;

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

  // Helper: Check if draw is legacy (null dates, ticket-based)
  const isLegacyDraw = (draw: typeof draws[0]) => {
    return !draw.startsOn || !draw.endsOn || !draw.drawDate;
  };
  
  // Show first 3 draws
  const displayDraws = draws.slice(0, 3);

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
        {displayDraws.map((draw) => {
          const legacy = isLegacyDraw(draw);
          const dateRange = legacy ? null : formatDateRange(draw.startsOn, draw.endsOn);

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
                    {draw.raffleCode}
                    {dateRange && ` • ${dateRange}`}
                  </p>
                </div>
              </div>

              {/* User stats: V37 shows points + entered status, legacy shows tickets */}
              <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border/50">
                {legacy ? (
                  <>
                    {draw.myTickets !== undefined && (
                      <span className="text-muted-foreground">You have {draw.myTickets} {draw.myTickets === 1 ? 'entry' : 'entries'}</span>
                    )}
                    {draw.myTickets === undefined && (
                      <span className="text-muted-foreground">Click to view details</span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Your points</span>
                      <span className="font-bold text-primary">
                        {draw.myPoints !== null && draw.myPoints !== undefined ? `${draw.myPoints} pts` : "-"}
                      </span>
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
