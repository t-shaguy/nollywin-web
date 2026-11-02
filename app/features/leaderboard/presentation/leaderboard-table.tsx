import { Crown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  player: string;
  points: number;
  prizeAmount: number;
  isCurrentUser: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-400 text-black",
    2: "bg-zinc-300 text-black",
    3: "bg-orange-500 text-white",
  };
  const colorClass = colors[rank] ?? "bg-secondary text-muted-foreground";

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${colorClass}`}>
        {rank}
      </span>
      {rank <= 3 && <Crown size={14} className="text-amber-500 hidden sm:inline" />}
    </div>
  );
}

/**
 * Get initials from display name for avatar placeholder
 * Since API doesn't return avatarUrl, we generate initials client-side
 */
function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

/**
 * Format prize amount for narrow screens
 * Full format (≥640px): ₦20,000
 * Compact format (<640px): ₦20k
 */
function formatPrize(amount: number, compact: boolean = false): string {
  if (amount === 0) return "—";
  
  if (compact && amount >= 1000) {
    const k = Math.floor(amount / 1000);
    return `₦${k}k`;
  }
  
  return `₦${amount.toLocaleString()}`;
}

function LeaderboardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
      {/* Header - responsive grid */}
      <div className="grid grid-cols-[44px_minmax(0,1fr)_64px_80px] sm:grid-cols-[100px_1fr_150px_150px] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 bg-secondary">
        <div className="h-3 sm:h-4 bg-muted/50 rounded" />
        <div className="h-3 sm:h-4 bg-muted/50 rounded" />
        <div className="h-3 sm:h-4 bg-muted/50 rounded" />
        <div className="h-3 sm:h-4 bg-muted/50 rounded" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid grid-cols-[44px_minmax(0,1fr)_64px_80px] sm:grid-cols-[100px_1fr_150px_150px] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4">
            <div className="h-8 w-8 rounded-full bg-muted/50" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-muted/50 shrink-0" />
              <div className="h-3 sm:h-4 w-20 sm:w-32 bg-muted/50 rounded" />
            </div>
            <div className="h-3 sm:h-4 w-12 sm:w-16 bg-muted/50 rounded ml-auto" />
            <div className="h-3 sm:h-4 w-12 sm:w-16 bg-muted/50 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardTable({ 
  entries, 
  currentUserId,
  isLoading,
}: { 
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header - responsive grid */}
      <div className="grid grid-cols-[44px_minmax(0,1fr)_64px_80px] sm:grid-cols-[100px_1fr_150px_150px] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 bg-secondary text-xs sm:text-sm text-muted-foreground font-medium">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Points</span>
        <span className="text-right">Prize</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isCurrentUser = entry.isCurrentUser;
          const initials = getInitials(entry.player);
          
          return (
            <div
              key={entry.playerId}
              className={`grid grid-cols-[44px_minmax(0,1fr)_64px_80px] sm:grid-cols-[100px_1fr_150px_150px] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 items-center transition-colors ${
                isCurrentUser ? "bg-primary/5 border-l-2 sm:border-l-4 border-l-primary" : ""
              }`}
            >
              <RankBadge rank={entry.rank} />
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Avatar with initials */}
                <div 
                  className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                    isCurrentUser ? "bg-primary/20 text-primary" : "bg-secondary/50"
                  }`}
                >
                  {isCurrentUser && initials}
                </div>
                <span className={`text-xs sm:text-sm font-medium truncate ${
                  isCurrentUser ? "text-primary" : "text-muted-foreground/40"
                }`}>
                  {isCurrentUser ? (
                    <>
                      <span className="hidden sm:inline">{entry.player}</span>
                      <span className="sm:hidden">{entry.player.length > 12 ? entry.player.substring(0, 12) + '...' : entry.player}</span>
                      <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-muted-foreground">(You)</span>
                    </>
                  ) : (
                    "•••"
                  )}
                </span>
              </div>
              <span className={`text-xs sm:text-sm font-mono text-right ${
                isCurrentUser ? "text-muted-foreground" : "text-muted-foreground/40"
              }`}>
                {isCurrentUser ? entry.points.toLocaleString() : "•••"}
              </span>
              <span className={`text-xs sm:text-sm text-right ${
                isCurrentUser 
                  ? entry.prizeAmount > 0 ? "text-primary font-medium" : "text-muted-foreground"
                  : "text-muted-foreground/40"
              }`}>
                {isCurrentUser ? (
                  <>
                    <span className="hidden sm:inline">{formatPrize(entry.prizeAmount, false)}</span>
                    <span className="sm:hidden">{formatPrize(entry.prizeAmount, true)}</span>
                  </>
                ) : (
                  "•••"
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
