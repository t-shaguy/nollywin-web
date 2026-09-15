import { Crown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  player: string;
  points: number;
  prize?: string;
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-400 text-black",
    2: "bg-zinc-300 text-black",
    3: "bg-orange-500 text-white",
  };
  const colorClass = colors[rank] ?? "bg-secondary text-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}>
        {rank}
      </span>
      {rank <= 3 && <Crown size={16} className="text-amber-500" />}
    </div>
  );
}

export function LeaderboardTable({ 
  entries, 
  currentUserId 
}: { 
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[80px_1fr_120px_120px] sm:grid-cols-[100px_1fr_150px_150px] gap-4 px-6 py-4 bg-secondary text-sm text-muted-foreground font-medium">
        <span>Rank</span>
        <span>Player</span>
        <span>Points</span>
        <span>Prize</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isCurrentUser = entry.playerId === currentUserId;
          
          return (
            <div
              key={entry.playerId}
              className={`grid grid-cols-[80px_1fr_120px_120px] sm:grid-cols-[100px_1fr_150px_150px] gap-4 px-6 py-4 items-center transition-colors ${
                isCurrentUser ? "bg-primary/5 border-l-4 border-l-primary" : ""
              }`}
            >
              <RankBadge rank={entry.rank} />
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-8 w-8 rounded-full shrink-0 ${
                  isCurrentUser ? "bg-primary/20" : "bg-secondary"
                }`} />
                <span className={`font-medium truncate ${isCurrentUser ? "text-primary" : ""}`}>
                  {entry.player}
                  {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">{entry.points.toLocaleString()}</span>
              <span className={entry.prize ? "text-primary font-medium" : "text-muted-foreground"}>
                {entry.prize ?? "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
