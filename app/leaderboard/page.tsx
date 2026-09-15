"use client";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { Countdown } from "../features/leaderboard/presentation/countdown";
import { LeaderboardTable } from "../features/leaderboard/presentation/leaderboard-table";
import { useLeaderboardStore } from "@/store/leaderboard-store";
import { useWalletStore } from "@/store/wallet-store";

export default function LeaderboardPage() {
  const { entries, currentUserId, monthEndDate } = useLeaderboardStore();
  const tokens = useWalletStore((s) => s.tokens);

  return (
    <AuthenticatedShell tokenBalance={tokens} unreadCount={0}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Monthly Leaderboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Top 3 players win cash prizes at the end of the month.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Ends in</p>
            <Countdown targetDate={monthEndDate} />
          </div>
        </div>

        {entries.length > 0 ? (
          <LeaderboardTable entries={entries} currentUserId={currentUserId} />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No ranked players yet this month — be the first to score points.
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
