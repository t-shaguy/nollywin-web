"use client";
import { useQuery } from "@tanstack/react-query";
import { Countdown } from "../../features/leaderboard/presentation/countdown";
import { LeaderboardTable } from "../../features/leaderboard/presentation/leaderboard-table";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { useAuthStore } from "@/store/auth-store";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";

export default function LeaderboardPage() {
  const currentUserId = useAuthStore((s) => s.user?.authUserId) || null;
  const { data: dashboard } = usePlayerDashboard();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", "monthly"],
    queryFn: () => getLeaderboard("monthly"),
  });

  // Get user's rank from dashboard for fallback
  const userRank = dashboard?.monthlyRank?.rank ?? null;

  // Map API entries to include isCurrentUser flag
  // Use authUserId match if available, otherwise fallback to rank match
  const entries = data?.entries?.map((entry) => {
    let isCurrentUser = false;
    
    if (currentUserId) {
      // Primary: Match by authUserId
      isCurrentUser = entry.authUserId === currentUserId;
    } else if (userRank) {
      // Fallback: Match by rank when authUserId is unavailable
      isCurrentUser = entry.rank === userRank;
    }
    
    return {
      rank: entry.rank,
      playerId: entry.authUserId,
      player: entry.displayName,
      points: entry.points,
      isCurrentUser,
    };
  }) || [];

  const periodEndsAt = data?.periodEndsAt ? new Date(data.periodEndsAt) : null;

  // DIAGNOSTIC: Log leaderboard data
  if (data) {
    console.log("[LEADERBOARD DEBUG] Raw response:", data);
    console.log("[LEADERBOARD DEBUG] currentUserId from auth store:", currentUserId);
    console.log("[LEADERBOARD DEBUG] userRank from dashboard:", userRank);
    
    const currentUserEntry = entries.find(e => e.isCurrentUser);
    if (currentUserEntry) {
      console.log("[LEADERBOARD DEBUG] Current user entry found:", currentUserEntry);
    } else {
      console.log("[LEADERBOARD DEBUG] Current user NOT found in leaderboard");
    }
  }

  return (
    <div className="space-y-5 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Monthly Leaderboard</h1>
          </div>
          {periodEndsAt && (
            <div className="text-left sm:text-right">
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
            <p className="text-destructive text-xs sm:text-sm">Failed to load leaderboard data</p>
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <LeaderboardTable entries={entries} currentUserId={currentUserId} isLoading={false} />
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center text-xs sm:text-sm text-muted-foreground">
            No ranked players yet this month — be the first to score points.
          </div>
        )}
      </div>
  );
}
