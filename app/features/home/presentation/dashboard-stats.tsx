import { Trophy, Star, Coins, LucideIcon } from "lucide-react";

interface ColoredStat {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}

export function DashboardStats({
  monthlyRank,
  totalPoints,
  tokensLeft,
}: {
  monthlyRank: number;
  totalPoints: number;
  tokensLeft: number;
}) {
  const stats: ColoredStat[] = [
    { icon: Trophy, label: "Monthly Rank", value: `#${monthlyRank}`, iconBg: "bg-amber-500/15", iconColor: "text-amber-500" },
    { icon: Star, label: "Total Points", value: totalPoints.toLocaleString(), iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: Coins, label: "Tokens Left", value: tokensLeft, iconBg: "bg-destructive/15", iconColor: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
            <stat.icon size={22} className={stat.iconColor} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
