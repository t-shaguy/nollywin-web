"use client";
import { useEffect } from "react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useReferralStore } from "@/store/referral-store";
import { InviteLinkCard } from "../features/refer-earn/presentation/invite-link-card";
import { ShareRow } from "../features/refer-earn/presentation/share-row";
import { ReferralStats } from "../features/refer-earn/presentation/referral-stats";

export default function ReferEarnPage() {
  const { code, stats, setReferral } = useReferralStore();

  useEffect(() => {
    // TODO: replace with GET /api/v1/referrals/me once the backend is live.
    // Placeholder code + zeroed stats so the page renders meaningfully until then.
    if (!code) {
      setReferral("NW-DEMO123", { totalInvited: 0, totalJoined: 0, totalEarned: 0 });
    }
  }, [code, setReferral]);

  return (
    <AuthenticatedShell tokenBalance={0} unreadCount={0}>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Refer & Earn</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Invite friends to NollyWin and earn rewards when they join.
          </p>
        </div>

        {code && (
          <>
            <InviteLinkCard code={code} />
            <ShareRow code={code} />
            <ReferralStats stats={stats} />
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
}
