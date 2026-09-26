"use client";
import { useEffect, useState } from "react";
import { useReferralStore, fetchReferralData } from "@/store/referral-store";
import { useWalletStore } from "@/store/wallet-store";
import { InviteLinkCard } from "../../features/refer-earn/presentation/invite-link-card";
import { ShareRow } from "../../features/refer-earn/presentation/share-row";
import { ReferralStats } from "../../features/refer-earn/presentation/referral-stats";

export default function ReferEarnPage() {
  const { referralCode, referralLink, totalReferred, verifiedReferred, isLoading } = useReferralStore();
  const { tokenBalance } = useWalletStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch referral data on mount if not already loaded
    if (!referralCode) {
      fetchReferralData().catch((err) => {
        console.error("Failed to fetch referral data:", err);
        setError("Failed to load referral data. Please try again.");
      });
    }
  }, [referralCode]);

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
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {!isLoading && referralCode && (
          <>
            <InviteLinkCard code={referralCode} link={referralLink} />
            <ShareRow code={referralCode} link={referralLink} />
            <ReferralStats totalReferred={totalReferred} verifiedReferred={verifiedReferred} />
          </>
        )}
      </div>
  );
}
