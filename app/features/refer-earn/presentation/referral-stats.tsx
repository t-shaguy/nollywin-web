import { StatPill } from "@/components/ui/stat-pill";

export function ReferralStats({
  stats,
}: {
  stats: { totalInvited: number; totalJoined: number; totalEarned: number };
}) {
  return (
    <div className="flex gap-3">
      <StatPill label="Invited" value={stats.totalInvited} />
      <StatPill label="Joined" value={stats.totalJoined} />
      <StatPill label="Earned" value={`₦${stats.totalEarned.toLocaleString()}`} />
    </div>
  );
}
