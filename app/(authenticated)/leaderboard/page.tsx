"use client";
import { useQuery } from "@tanstack/react-query";
import { Countdown } from "../../features/leaderboard/presentation/countdown";
import { LeaderboardTable } from "../../features/leaderboard/presentation/leaderboard-table";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { useAuthStore } from "@/store/auth-store";

export default function LeaderboardPage() {
  const currentUserId = useAuthStore((s) => s.user?.email) || null;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", "monthly"],
    queryFn: () => getLeaderboard("monthly"),
  });

  // Map API entries to include isCurrentUser flag
  const entries = data?.entries?.map((entry) => ({
    rank: entry.rank,
    playerId: entry.authUserId,
    player: entry.displayName,
    points: entry.points,
    prizeAmount: entry.prizeAmount,
    isCurrentUser: currentUserId ? entry.authUserId === currentUserId : false,
  })) || [];

  const periodEndsAt = data?.periodEndsAt ? new Date(data.periodEndsAt) : null;

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
          <LeaderboardTable entries={[]} currentUserId={null} isLoading={true} />
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">Failed to load leaderboard data</p>
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <LeaderboardTable entries={entries} currentUserId={currentUserId} isLoading={false} />
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No ranked players yet this month — be the first to score points.
          </div>
        )}
      </div>
  );
}
