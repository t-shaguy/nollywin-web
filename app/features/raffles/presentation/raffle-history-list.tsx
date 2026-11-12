"use client";
import { Trophy, Ticket } from "lucide-react";
import { getRaffleHistory, type RaffleHistoryEntry } from "@/lib/api/leaderboard";
import { useEffect, useState } from "react";

export function RaffleHistoryList() {
  const [history, setHistory] = useState<RaffleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRaffleHistory()
      .then((data) => setHistory(data))
      .catch((err) => {
        console.error("Failed to load raffle history:", err);
        setError("Failed to load history");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 text-center">
        <p className="text-xs sm:text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">No draw history yet</p>
      </div>
    );
  }

  // REAL BACKEND: History rows have winnerStatus ("SELECTED" or null), wonTier, wonPrize
  // If winnerStatus is "SELECTED" but wonPrize is null, show "Selected as winner" with the draw's prizeName
  const getWinStatus = (entry: RaffleHistoryEntry) => {
    if (entry.winnerStatus === "SELECTED") {
      if (entry.wonPrize) {
        // Multi-tier draw: show tier and prize
        return {
          isWinner: true,
          text: entry.wonTier ? `${entry.wonTier}: ${entry.wonPrize}` : entry.wonPrize,
        };
      } else {
        // Single-prize draw: show "Selected as winner" + prizeName
        return {
          isWinner: true,
          text: `Selected as winner: ${entry.prizeName}`,
        };
      }
    }
    return { isWinner: false, text: "Not selected" };
  };

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const winStatus = getWinStatus(entry);
        const hasTickets = entry.myTickets !== undefined && entry.myTickets > 0;

        return (
          <div
            key={entry.drawId}
            className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 ${
                    winStatus.isWinner
                      ? "bg-primary/10"
                      : "bg-secondary"
                  }`}
                >
                  <Trophy size={16} className={`sm:w-[18px] sm:h-[18px] ${winStatus.isWinner ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{entry.prizeName}</p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                  entry.drawStatus === "ACTIVE"
                    ? "bg-green-500/10 text-green-600"
                    : entry.drawStatus === "UPCOMING"
                    ? "bg-blue-500/10 text-blue-600"
                    : entry.drawStatus === "CLOSED"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {entry.drawStatus}
              </span>
            </div>

            {/* Win Status */}
            <div
              className={`p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${
                winStatus.isWinner
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-secondary/50 border border-border"
              }`}
            >
              <p className={`break-words ${winStatus.isWinner ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {winStatus.text}
              </p>
            </div>

            {/* Legacy: Show ticket count if present */}
            {hasTickets && (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground pt-1 border-t border-border">
                <Ticket size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span>You had {entry.myTickets} {entry.myTickets === 1 ? 'entry' : 'entries'}</span>
              </div>
            )}

            {/* Created date */}
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Entered {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
