import { Star, Coins, TrendingUp, LucideIcon } from "lucide-react";

interface HomeStat {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function HomeStatsScroll({
  totalPoints,
  tokensLeft,
  monthlyRank,
}: {
  totalPoints: number;
  tokensLeft: number;
  monthlyRank: number;
}) {
  const stats: HomeStat[] = [
    { icon: Star, label: "Total Points", value: totalPoints.toLocaleString() },
    { icon: Coins, label: "Tokens Left", value: tokensLeft },
    { icon: TrendingUp, label: "Monthly Rank", value: `#${monthlyRank}` },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 snap-x snap-mandatory scrollbar-none">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="shrink-0 w-40 snap-start bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <stat.icon size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
