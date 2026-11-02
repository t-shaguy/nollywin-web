"use client";
import { useReferralLink } from "@/hooks/use-referral-link";
import { useReferralStats } from "@/hooks/use-referral-stats";
import { InviteLinkCard } from "../../features/refer-earn/presentation/invite-link-card";
import { ShareRow } from "../../features/refer-earn/presentation/share-row";
import { ReferralStats } from "../../features/refer-earn/presentation/referral-stats";

export default function ReferEarnPage() {
  // Fetch referral data using React Query hooks
  const { data: linkData, isLoading: linkLoading, error: linkError } = useReferralLink();
  const { data: statsData, isLoading: statsLoading, error: statsError } = useReferralStats();
  
  const isLoading = linkLoading || statsLoading;
  const error = linkError || statsError;
  
  // Extract data with fallbacks
  const referralCode = linkData?.referralCode ?? null;
  const referralLink = linkData?.referralLink ?? null;
  const totalReferred = statsData?.totalReferred ?? 0;
  const verifiedReferred = statsData?.verifiedReferred ?? 0;
  const rewardedReferrals = statsData?.rewardedReferrals ?? 0;
  const tokensEarned = statsData?.tokensEarned ?? 0;
  const rewardTokensPerReferral = statsData?.rewardTokensPerReferral ?? 0;
  const maxRewardsPerReferrer = statsData?.maxRewardsPerReferrer ?? 0;
  const rewardsActive = statsData?.rewardsActive ?? false;

  return (
    <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Refer & Earn</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Invite friends to NollyWin and earn rewards when they join.
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading referral data...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">Failed to load referral data. Please try again.</p>
          </div>
        )}

        {!isLoading && referralCode && (
          <>
            <InviteLinkCard code={referralCode} link={referralLink} />
            <ShareRow code={referralCode} link={referralLink} />
            <ReferralStats 
              totalReferred={totalReferred} 
              verifiedReferred={verifiedReferred}
              rewardedReferrals={rewardedReferrals}
              tokensEarned={tokensEarned}
              rewardTokensPerReferral={rewardTokensPerReferral}
              maxRewardsPerReferrer={maxRewardsPerReferrer}
              rewardsActive={rewardsActive}
            />
          </>
        )}
      </div>
  );
}
