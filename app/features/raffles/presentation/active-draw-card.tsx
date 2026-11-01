"use client";
import { Trophy, Calendar, Users, Clock } from "lucide-react";
import { type RaffleDraw } from "@/lib/api/leaderboard";
import { formatDateRange, formatDrawDate, getCalendarDaysUntil, getCountdownMessage } from "@/lib/utils/draw-countdown";

interface ActiveDrawCardProps {
  draw: RaffleDraw;
  myPoints?: number; // Optional since it's in draw.myPoints
  hasActiveSubscription?: boolean; // Optional
  onShowCountdown?: () => void; // Optional
}

export function ActiveDrawCard({ draw, onShowCountdown }: ActiveDrawCardProps) {
  // Helper: Check if draw is legacy (null dates, ticket-based)
  const isLegacy = !draw.startsOn || !draw.endsOn || !draw.drawDate;

  // Helper: Determine if draw has multiple tiers (show tier list)
  // REAL BACKEND: All draws have tiers. Only show tier list if multiple tiers OR single tier with tierName !== "Winner"
  const shouldShowTiers = () => {
    if (!draw.prizeTiers || draw.prizeTiers.length === 0) return false; // Legacy draw
    if (draw.prizeTiers.length > 1) return true; // Multiple tiers
    return draw.prizeTiers[0].tierName !== "Winner"; // Single tier with custom name
  };

  const showTiers = shouldShowTiers();
  const dateRange = isLegacy ? null : formatDateRange(draw.startsOn, draw.endsOn);
  const drawDateFormatted = isLegacy ? null : formatDrawDate(draw.drawDate);
  
  // Calculate countdown for draw-date chip
  const daysUntilDraw = !isLegacy ? getCalendarDaysUntil(draw.drawDate) : null;
  const countdownText = daysUntilDraw !== null ? getCountdownMessage(daysUntilDraw) : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#F40289] to-[#FC0D28] flex items-center justify-center shrink-0">
          <Trophy size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg">{draw.prizeName}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {draw.raffleCode} • {draw.scheduleLabel}
          </p>
        </div>
      </div>

      {/* Date info (v37 only) */}
      {!isLegacy && dateRange && (
        <div className="flex items-center gap-2 text-sm bg-secondary/30 rounded-lg p-3">
          <Calendar size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">Qualifying Period</p>
            <p className="font-medium">{dateRange}</p>
          </div>
        </div>
      )}

      {!isLegacy && drawDateFormatted && (
        <button
          onClick={onShowCountdown}
          className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg p-3 w-full hover:bg-primary/10 transition-colors"
        >
          <Trophy size={16} className="text-primary shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-muted-foreground text-xs">Draw Date</p>
            <p className="font-medium">{drawDateFormatted}</p>
          </div>
          {countdownText && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <Clock size={12} className="text-primary" />
              <span className="text-xs font-semibold text-primary">{countdownText}</span>
            </div>
          )}
        </button>
      )}

      {/* Prize Tiers (only show if multiple tiers or single non-Winner tier) */}
      {showTiers && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prize Tiers</p>
          <div className="space-y-2">
            {draw.prizeTiers
              .sort((a, b) => a.position - b.position)
              .map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{tier.tierName}</p>
                    <p className="text-xs text-muted-foreground">{tier.prizeName}</p>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    {tier.winnersCount} {tier.winnersCount === 1 ? 'winner' : 'winners'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        {/* Legacy: Show ticket entries, V37: Show points */}
        {isLegacy ? (
          <>
            {draw.myTickets !== undefined && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Your Entries</p>
                <p className="text-xl font-bold">{draw.myTickets}</p>
              </div>
            )}
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
              <p className="text-xl font-bold">{draw.entryCount.toLocaleString()}</p>
            </div>
          </>
        ) : (
          <>
            {/* V37 New Draws: Show points (always) */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Your Points</p>
              <p className="text-xl font-bold text-primary">{draw.myPoints ?? 0}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
              <p className="text-xl font-bold">{draw.entryCount.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      {/* Entry Status (V37 new draws only) */}
      {!isLegacy && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Entry Status</span>
          {draw.entered ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
              Entered
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
              Play a game to enter
            </span>
          )}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Status</span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            draw.status === "ACTIVE"
              ? "bg-green-500/10 text-green-600"
              : draw.status === "UPCOMING"
              ? "bg-blue-500/10 text-blue-600"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {draw.status}
        </span>
      </div>
    </div>
  );
}
