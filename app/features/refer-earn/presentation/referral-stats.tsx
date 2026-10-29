import { StatPill } from "@/components/ui/stat-pill";

// Shows all four distinct referral metrics + reward program status
export function ReferralStats({
  totalReferred,
  verifiedReferred,
  rewardedReferrals,
  tokensEarned,
  rewardTokensPerReferral,
  maxRewardsPerReferrer,
  rewardsActive,
}: {
  totalReferred: number;
  verifiedReferred: number;
  rewardedReferrals: number;
  tokensEarned: number;
  rewardTokensPerReferral: number;
  maxRewardsPerReferrer: number;
  rewardsActive: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Referral Statistics */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Your Referral Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatPill 
            label="Total Referred" 
            value={totalReferred}
          />
          <StatPill 
            label="Verified" 
            value={verifiedReferred}
          />
          <StatPill 
            label="Rewarded Referrals" 
            value={rewardedReferrals}
          />
          <StatPill 
            label="Tokens Earned" 
            value={tokensEarned}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Rewarded referrals are those that triggered a token payout
        </p>
      </div>
    </div>
  );
}
