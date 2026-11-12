"use client";
import { Trophy, Calendar, Clock, Play } from "lucide-react";
import Link from "next/link";
import { type RaffleDraw } from "@/lib/api/leaderboard";
import { formatDateRange, formatDrawDate, getCalendarDaysUntil, getCountdownMessage } from "@/lib/utils/draw-countdown";

interface ActiveDrawCardProps {
  draw: RaffleDraw;
  myPoints?: number; // Optional since it's in draw.myPoints
  hasActiveSubscription?: boolean;
  tokensLeft?: number | null;
  onShowCountdown?: () => void; // Optional
}

export function ActiveDrawCard({ 
  draw, 
  hasActiveSubscription = false,
  tokensLeft = null,
  onShowCountdown 
}: ActiveDrawCardProps) {
  // Helper: Check if draw is legacy (null dates, ticket-based)
  const isLegacy = !draw.startsOn || !draw.endsOn || !draw.drawDate;

  // Helper: Determine card state based on dates (UTC comparison)
  const getDrawState = (): "upcoming" | "running" | "ended" | "legacy" => {
    if (isLegacy) return "legacy";
    
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startsOn = new Date(draw.startsOn!);
    const endsOn = new Date(draw.endsOn!);
    
    if (todayUTC < startsOn) return "upcoming";
    if (todayUTC > endsOn) return "ended";
    return "running";
  };

  const state = getDrawState();
  
  // Check if user can play (has active plan and tokens)
  const canPlay = hasActiveSubscription && (tokensLeft === null || tokensLeft > 0);
  
  // Helper: Determine if draw has multiple tiers (show tier list)
  const shouldShowTiers = () => {
    if (!draw.prizeTiers || draw.prizeTiers.length === 0) return false;
    if (draw.prizeTiers.length > 1) return true;
    return draw.prizeTiers[0].tierName !== "Winner";
  };

  const showTiers = shouldShowTiers();
  const dateRange = isLegacy ? null : formatDateRange(draw.startsOn, draw.endsOn);
  const drawDateFormatted = isLegacy ? null : formatDrawDate(draw.drawDate);
  
  // Calculate countdown
  const daysUntilDraw = !isLegacy ? getCalendarDaysUntil(draw.drawDate) : null;
  const countdownText = daysUntilDraw !== null ? getCountdownMessage(daysUntilDraw) : null;
  
  // Calculate days until start (for upcoming draws)
  const daysUntilStart = state === "upcoming" && draw.startsOn ? 
    getCalendarDaysUntil(draw.startsOn) : null;

  // Compute cumulative ranks for prize tiers
  const tiersWithRanks = draw.prizeTiers
    ?.sort((a, b) => a.position - b.position)
    .map((tier, idx, arr) => {
      const cumulativeBefore = arr.slice(0, idx).reduce((sum, t) => sum + t.winnersCount, 0);
      const rankStart = cumulativeBefore + 1;
      const rankEnd = cumulativeBefore + tier.winnersCount;
      
      let rankLabel: string;
      if (tier.winnersCount === 1) {
        rankLabel = `Rank ${rankStart}`;
      } else {
        rankLabel = `Ranks ${rankStart}-${rankEnd}`;
      }
      
      return { ...tier, rankLabel };
    });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
          <Trophy size={20} className="sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg break-words">{draw.prizeName}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{draw.scheduleLabel}</p>
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

      {/* Prize Tiers with ranks */}
      {showTiers && tiersWithRanks && (
        <div className="space-y-2">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Prize Tiers</p>
          <div className="space-y-2">
            {tiersWithRanks.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 sm:p-2.5 bg-secondary/30 rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{tier.tierName}: {tier.prizeName}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{tier.rankLabel}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Your final rank in points decides your prize. Everyone who plays in the period is entered.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2 border-t border-border">
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

      {/* Entry Status / Action based on state */}
      {!isLegacy && (
        <div className="space-y-2 pt-2 border-t border-border">
          {state === "upcoming" && (
            <>
              <div className="flex items-center justify-center">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
                  Starts in {daysUntilStart} {daysUntilStart === 1 ? "day" : "days"} ({formatDrawDate(draw.startsOn!)})
                </span>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Points earned before the start date don&apos;t count.
              </p>
            </>
          )}
          
          {state === "running" && !draw.entered && (
            <Link href={canPlay ? "/game" : "/store"} className="block">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]">
                <Play size={18} />
                {canPlay ? "Play to enter" : "Get a plan"}
              </button>
            </Link>
          )}
          
          {state === "running" && draw.entered && (
            <>
              <div className="flex items-center justify-center">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 text-green-600">
                  Entered
                </span>
              </div>
              <Link href={canPlay ? "/game" : "/store"} className="block">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-border bg-secondary hover:bg-secondary/80 font-medium text-sm transition-colors min-h-[44px]">
                  <Play size={16} />
                  {canPlay ? "Play more" : "Get a plan"}
                </button>
              </Link>
            </>
          )}
          
          {state === "ended" && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
                Qualifying period ended
              </span>
              <p className="text-[10px] text-muted-foreground">
                Draw on {drawDateFormatted}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legacy entry status */}
      {isLegacy && (
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
