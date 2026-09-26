"use client";
import { useEffect, useState } from "react";
import { Countdown } from "../../features/leaderboard/presentation/countdown";
import { LeaderboardTable } from "../../features/leaderboard/presentation/leaderboard-table";
import { useLeaderboardStore, fetchLeaderboard } from "@/store/leaderboard-store";
import { useWalletStore } from "@/store/wallet-store";

export default function LeaderboardPage() {
  const { entries, periodEndsAt, isLoading } = useLeaderboardStore();
  const tokenBalance = useWalletStore((s) => s.tokenBalance);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch leaderboard data on mount
    fetchLeaderboard("monthly").catch((err) => {
      console.error("Failed to fetch leaderboard:", err);
      setError("Failed to load leaderboard data");
    });
  }, []);

  // Find current user entry (marked with isCurrentUser from store)
  const currentUserEntry = entries.find((e) => e.isCurrentUser);
  const currentUserId = currentUserEntry?.playerId || null;

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Monthly Leaderboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Top players win cash prizes at the end of the month.
            </p>
          </div>
          {periodEndsAt && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ends in</p>
              <Countdown targetDate={periodEndsAt} />
            </div>
          )}
        </div>

        {isLoading && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <LeaderboardTable entries={entries} currentUserId={currentUserId} />
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No ranked players yet this month — be the first to score points.
          </div>
        )}
      </div>
  );
}
