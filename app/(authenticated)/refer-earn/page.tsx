"use client";
import { useState } from "react";
import { useReferralLink } from "@/hooks/use-referral-link";
import { useReferralStats } from "@/hooks/use-referral-stats";
import { Mail, Copy, Check, Users, Gift, TrendingUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ReferEarnPage() {
  const { showSuccessToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
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

  const handleCopyLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showSuccessToast("Referral link copied to clipboard!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showSuccessToast("Referral code copied to clipboard!");
    
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async (platform: "whatsapp" | "x" | "other") => {
    if (!referralLink || !referralCode) return;

    const message = `Join me on NollyWin and start earning! Use my code ${referralCode}: ${referralLink}`;
    
    if (platform === "other") {
      // Use native share API if available, otherwise copy to clipboard
      if (navigator.share) {
        try {
          await navigator.share({ 
            title: "Join NollyWin", 
            text: message, 
            url: referralLink 
          });
        } catch {
          // User cancelled the native share sheet — nothing to do
        }
      } else {
        // Web Share API unsupported (most desktop browsers) — fall back to clipboard
        try {
          await navigator.clipboard.writeText(message);
          showSuccessToast("Message copied to clipboard!");
        } catch {
          // Clipboard also unavailable — silently ignore
        }
      }
      return;
    }

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      x: `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-secondary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive">Failed to load referral data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero Card with Mail Icon */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6">
        {/* Mail Icon */}
        <div className="relative inline-block">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#F40289]/20 to-[#FC0D28]/20 flex items-center justify-center mx-auto relative">
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#F40289] to-[#FC0D28] flex items-center justify-center">
              <Mail size={40} className="text-white" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Gift size={14} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Invite Friends to NollyWin</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {rewardsActive && rewardTokensPerReferral > 0
              ? `Share NollyWin and earn ${rewardTokensPerReferral} play${rewardTokensPerReferral === 1 ? '' : 's'} for every friend who signs up!`
              : "Share NollyWin with your friends and grow the community together!"
            }
          </p>
        </div>

        {/* Referral Link */}
        {referralLink && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block text-left">
              Your Referral Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-left truncate">
                {referralLink}
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {/* Referral Code Badge */}
        {referralCode && (
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 hover:bg-primary/20 transition-colors"
          >
            <span className="text-xs text-muted-foreground">Your Code:</span>
            <span className="text-sm font-bold text-primary">{referralCode}</span>
            {copiedCode ? (
              <Check size={14} className="text-primary" />
            ) : (
              <Copy size={14} className="text-primary" />
            )}
          </button>
        )}
      </div>

      {/* Share Options */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-muted-foreground" />
          <h2 className="font-bold">Share via</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
                <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.48-8.45zm-8.475 18.297c-1.777 0-3.52-.475-5.042-1.371l-.362-.214-3.754.982.997-3.648-.236-.375a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.89-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.993c-.003 5.45-4.437 9.885-9.891 9.885z" fill="#25D366"/>
              </svg>
            </div>
            <span className="text-xs font-medium">WhatsApp</span>
          </button>

          <button
            onClick={() => handleShare("x")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="text-xs font-medium">X</span>
          </button>

          <button
            onClick={() => handleShare("other")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-gray-600/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-gray-600">
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                <circle cx="19" cy="12" r="1" fill="currentColor"/>
                <circle cx="5" cy="12" r="1" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Referral Progress */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2 text-lg">
          <TrendingUp size={20} className="text-primary" />
          Referral Progress
        </h2>

        <div className="space-y-3">
          {/* Total Invited */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invited</p>
                <p className="text-2xl font-bold">{totalReferred}</p>
              </div>
            </div>
          </div>

          {/* Verified */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedReferred}</p>
              </div>
            </div>
          </div>

          {/* Rewarded */}
          {rewardsActive && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rewarded Referrals</p>
                  <p className="text-2xl font-bold">{rewardedReferrals}</p>
                </div>
              </div>
            </div>
          )}

          {/* Total Earned */}
          {rewardsActive && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Plays Earned</p>
                  <p className="text-2xl font-bold text-amber-600">{tokensEarned}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      {rewardsActive && (
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2 text-lg">
              <Gift size={20} className="text-primary" />
              How It Works
            </h2>
            {maxRewardsPerReferrer > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {rewardedReferrals}/{maxRewardsPerReferrer} rewards
              </span>
            )}
          </div>

          <div className="bg-card/50 rounded-xl p-4 border border-border/50">
            <p className="text-sm leading-relaxed">
              Earn <span className="font-bold text-primary">{rewardTokensPerReferral} play{rewardTokensPerReferral === 1 ? '' : 's'}</span> for every friend who signs up and verifies their account using your referral link.
              {maxRewardsPerReferrer > 0 && (
                <span className="block mt-2 text-muted-foreground text-xs">
                  Maximum {maxRewardsPerReferrer} reward{maxRewardsPerReferrer === 1 ? '' : 's'} per referrer.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
