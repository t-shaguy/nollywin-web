import { Trophy, Star, Coins, LucideIcon } from "lucide-react";

interface ColoredStat {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}

function StatSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 animate-pulse">
      <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-muted/50 flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 md:h-4 w-20 md:w-24 bg-muted/50 rounded" />
        <div className="h-5 md:h-6 w-12 md:w-16 bg-muted/50 rounded" />
      </div>
    </div>
  );
}

export function DashboardStats({
  monthlyRank,
  totalPoints,
  tokensLeft,
  isLoading,
}: {
  monthlyRank: number | null;
  totalPoints: number;
  tokensLeft: number | null; // V37: 0 = no plan, null = unlimited, N = tokens remaining
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  // Display value for tokens
  const tokensDisplay = tokensLeft === null ? "Unlimited" : tokensLeft;

  const stats: ColoredStat[] = [
    {
      icon: Trophy,
      label: "Monthly Rank",
      value: monthlyRank !== null ? `#${monthlyRank}` : "Unranked",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
    },
    { icon: Star, label: "Total Points", value: totalPoints.toLocaleString(), iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: Coins, label: "Tokens Left", value: tokensDisplay, iconBg: "bg-destructive/15", iconColor: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 min-w-0">
          <div className={`h-11 w-11 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
            <stat.icon size={20} className={`md:w-[22px] md:h-[22px] ${stat.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
            <p className="text-xl md:text-2xl font-bold truncate">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
