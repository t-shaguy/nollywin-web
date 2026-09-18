import { StatPill } from "@/components/ui/stat-pill";

// VERIFIED: Backend returns totalReferred and verifiedReferred
export function ReferralStats({
  totalReferred,
  verifiedReferred,
}: {
  totalReferred: number;
  verifiedReferred: number;
}) {
  return (
    <div className="flex gap-3">
      <StatPill label="Total Referred" value={totalReferred} />
      <StatPill label="Verified" value={verifiedReferred} />
    </div>
  );
}
