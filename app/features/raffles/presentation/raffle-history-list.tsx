"use client";
import { useEffect, useState } from "react";
import { Trophy, Clock, Frown, Sparkles, XCircle } from "lucide-react";
import { getRaffleHistory, type RaffleHistoryEntry } from "@/lib/api/leaderboard";

export function RaffleHistoryList() {
  const [history, setHistory] = useState<RaffleHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getRaffleHistory(0, 20);
      
      // DEBUG: Log actual response to see exact field names/values
      console.log('=== RAFFLE HISTORY DEBUG ===');
      console.log('Total entries:', response.length);
      if (response.length > 0) {
        console.log('Sample entry (first one):', JSON.stringify(response[0], null, 2));
        console.log('All entry fields:', Object.keys(response[0]));
        console.log('');
        console.log('⚠️ WINNER STATUS CHECK:');
        response.forEach((entry, idx) => {
          console.log(`  Entry ${idx + 1}: drawStatus="${entry.drawStatus}", winnerStatus=${entry.winnerStatus === null ? 'null' : `"${entry.winnerStatus}"`}`);
        });
        console.log('');
        console.log('NOTE: winnerStatus="SELECTED" is CONFIRMED for wins.');
        console.log('      winnerStatus=null is PRESUMED for losses (not yet confirmed with real data).');
      }
      console.log('============================');
      
      setHistory(response);
    } catch (err) {
      console.warn("Failed to load raffle history:", err);
      setError("Failed to load your raffle history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function getEntryStatus(entry: RaffleHistoryEntry) {
    // Draw cancelled
    if (entry.drawStatus === "CANCELLED") {
      return {
        label: "Cancelled",
        icon: XCircle,
        color: "text-muted-foreground",
        bgColor: "bg-secondary",
      };
    }

    // Draw still open (not decided yet)
    if (entry.drawStatus === "ACTIVE" || entry.drawStatus === "UPCOMING") {
      return {
        label: "Draw pending",
        icon: Clock,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      };
    }

    // Draw closed - check winner status
    if (entry.drawStatus === "CLOSED") {
      // CONFIRMED: winnerStatus === "SELECTED" means user won
      if (entry.winnerStatus === "SELECTED") {
        return {
          label: "You Won! 🎉",
          icon: Trophy,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        };
      } else {
        // NOTE: Assuming null/falsy means didn't win - not yet confirmed with real losing entry
        // TODO: Verify this against actual losing entry data
        return {
          label: "Not Selected",
          icon: Frown,
          color: "text-muted-foreground",
          bgColor: "bg-secondary",
        };
      }
    }

    // Fallback for any unexpected status (should not happen with real data)
    console.warn('Unexpected drawStatus:', entry.drawStatus, 'for entry:', entry.drawId);
    return {
      label: "Status unknown",
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-secondary",
    };
  }

  function formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl p-5 bg-card border border-border animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-secondary rounded w-1/2" />
                <div className="h-4 bg-secondary rounded w-1/3" />
              </div>
              <div className="h-9 w-32 bg-secondary rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={loadHistory}
          className="mt-4 text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Sparkles size={28} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold mb-2">No entries yet</h3>
        <p className="text-sm text-muted-foreground">
          Your raffle entries will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const status = getEntryStatus(entry);
        const StatusIcon = status.icon;

        return (
          <div
            key={entry.drawId}
            className="rounded-xl p-5 bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base mb-1 break-words">{entry.prizeName}</h3>
                <p className="text-xs text-muted-foreground">
                  Entered {formatDate(entry.createdAt)}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 ${status.bgColor}`}>
                <StatusIcon size={14} className={status.color} />
                <span className={`text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span>
                Your {entry.myTickets === 1 ? "ticket" : "tickets"}: <span className="font-semibold text-foreground">{entry.myTickets}</span>
              </span>
              <span>
                Draw status: <span className="font-semibold text-foreground capitalize">{entry.drawStatus.toLowerCase()}</span>
              </span>
            </div>

            {/* Show winner status value if won (for debugging/display) */}
            {entry.winnerStatus && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Winner status: {entry.winnerStatus}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
