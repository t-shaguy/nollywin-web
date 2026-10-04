import { StatPill } from "@/components/ui/stat-pill";
import { Gift, AlertCircle } from "lucide-react";

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
  // Generate reward program messaging
  let rewardMessage = "";
  if (!rewardsActive) {
    rewardMessage = "Referral rewards launching soon";
  } else {
    const rewardAmount = `${rewardTokensPerReferral} token${rewardTokensPerReferral === 1 ? "" : "s"}`;
    if (maxRewardsPerReferrer === 0) {
      // Uncapped
      rewardMessage = `Earn ${rewardAmount} per verified referral`;
    } else {
      // Capped
      rewardMessage = `Earn ${rewardAmount} per verified referral (up to ${maxRewardsPerReferrer} rewards)`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Reward Program Status Banner */}
      <div className={`border rounded-xl p-4 flex items-start gap-3 ${
        rewardsActive 
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-yellow-500/10 border-yellow-500/30"
      }`}>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          rewardsActive 
            ? "bg-green-500/20" 
            : "bg-yellow-500/20"
        }`}>
          {rewardsActive ? (
            <Gift size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${
            rewardsActive ? "text-green-700" : "text-yellow-700"
          }`}>
            {rewardsActive ? "Reward Program Active" : "Reward Program Coming Soon"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {rewardMessage}
          </p>
        </div>
      </div>

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
