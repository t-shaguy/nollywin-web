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
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-[#F40289] to-[#FC0D28] flex items-center justify-center shrink-0">
          <Trophy size={20} className="sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg break-words">{draw.prizeName}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {draw.raffleCode} • {draw.scheduleLabel}
          </p>
        </div>
      </div>

      {/* Date info (v37 only) */}
      {!isLegacy && dateRange && (
        <div className="flex items-start gap-2 text-sm bg-secondary/30 rounded-lg p-3">
          <Calendar size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs">Qualifying Period</p>
            <p className="font-medium text-xs sm:text-sm break-words">{dateRange}</p>
          </div>
        </div>
      )}

      {!isLegacy && drawDateFormatted && (
        <button
          onClick={onShowCountdown}
          className="flex items-start gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg p-3 w-full hover:bg-primary/10 transition-colors min-h-[60px]"
        >
          <Trophy size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1 text-left min-w-0">
            <p className="text-muted-foreground text-xs">Draw Date</p>
            <p className="font-medium text-xs sm:text-sm break-words">{drawDateFormatted}</p>
          </div>
          {countdownText && (
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-primary/10 flex-shrink-0">
              <Clock size={12} className="text-primary" />
              <span className="text-[10px] sm:text-xs font-semibold text-primary whitespace-nowrap">{countdownText}</span>
            </div>
          )}
        </button>
      )}

      {/* Prize Tiers (only show if multiple tiers or single non-Winner tier) */}
      {showTiers && (
        <div className="space-y-2">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Prize Tiers</p>
          <div className="space-y-2">
            {draw.prizeTiers
              .sort((a, b) => a.position - b.position)
              .map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 sm:p-2.5 bg-secondary/30 rounded-lg gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate">{tier.tierName}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{tier.prizeName}</p>
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-primary whitespace-nowrap">
                    {tier.winnersCount} {tier.winnersCount === 1 ? 'winner' : 'winners'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2 border-t border-border">
        {/* Legacy: Show ticket entries, V37: Show points */}
        {isLegacy ? (
          <>
            {draw.myTickets !== undefined && (
              <div className="bg-secondary/30 rounded-lg p-3 sm:p-4 border border-border">
                <p className="text-[11px] sm:text-[13px] font-medium text-foreground/80 mb-1 sm:mb-1.5 truncate">Your Entries</p>
                <p className="text-2xl sm:text-[28px] font-bold leading-none">{draw.myTickets}</p>
              </div>
            )}
            <div className="bg-secondary/30 rounded-lg p-3 sm:p-4 border border-border">
              <p className="text-[11px] sm:text-[13px] font-medium text-foreground/80 mb-1 sm:mb-1.5 truncate">Total Entries</p>
              <p className="text-2xl sm:text-[28px] font-bold leading-none">{draw.entryCount.toLocaleString()}</p>
            </div>
          </>
        ) : (
          <>
            {/* V37 New Draws: Show points (always, but show "-" if data not loaded) */}
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-3 sm:p-4">
              <p className="text-[11px] sm:text-[13px] font-medium text-foreground/80 mb-1 sm:mb-1.5 truncate">Your points</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 truncate">earned in this period</p>
              <p className="text-2xl sm:text-[30px] font-bold leading-none text-primary">
                {draw.myPoints !== null && draw.myPoints !== undefined ? draw.myPoints : "-"}
              </p>
            </div>
            <div className="bg-secondary/50 border-2 border-border rounded-lg p-3 sm:p-4">
              <p className="text-[11px] sm:text-[13px] font-medium text-foreground/80 mb-1 sm:mb-1.5 truncate">Total entries</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 truncate">players in this draw</p>
              <p className="text-2xl sm:text-[30px] font-bold leading-none">{draw.entryCount.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      {/* Entry Status (V37 new draws only) */}
      {!isLegacy && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Entry Status</span>
          {draw.entered ? (
            <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
              Entered
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
              Play to enter
            </span>
          )}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[10px] sm:text-xs text-muted-foreground">Status</span>
        <span
          className={`text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full ${
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
