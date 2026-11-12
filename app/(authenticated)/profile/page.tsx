"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Star, User, Mail, Phone, ChevronRight, Lock, Bell, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useReferralStore, fetchReferralData } from "@/store/referral-store";
import { AvatarUpload } from "@/app/features/profile/presentation/avatar-upload";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile } from "@/lib/api/profile";

function ProfileContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { hasActivePlan, planName } = useSubscriptionStore();
  const { referralLink } = useReferralStore();

  // Edit state for Full Name
  const [editingName, setEditingName] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState(user?.firstName ?? "");
  const [lastNameInput, setLastNameInput] = useState(user?.lastName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  // Fetch fresh profile data on mount (rehydrates totalPoints, gamesPlayed, bestScore)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        updateUser(profile);
        
        // Backfill authUserId from wallet API if still missing after profile load
        if (!profile.authUserId && !user?.authUserId) {
          try {
            const { getBalance } = await import("@/lib/api/wallet");
            const balance = await getBalance();
            if (balance.authUserId) {
              updateUser({ authUserId: balance.authUserId });
              console.log("[PROFILE] Backfilled authUserId from wallet API:", balance.authUserId);
            }
          } catch (err) {
            // Wallet API might return 410 or fail, that's okay
            console.warn("[PROFILE] Could not backfill authUserId from wallet:", err);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch profile:", err);
        // Silently fail - user data from auth store is still available
      }
    };
    fetchProfile();
  }, [updateUser]);

  // Fetch real referral data from API
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        await fetchReferralData();
      } catch (err) {
        console.warn("Failed to fetch referral data:", err);
        // Silently fail - will show "Loading..." or fallback
      }
    };
    loadReferralData();
  }, []);

  // Sync input fields with user data when user changes
  useEffect(() => {
    if (user) {
      setFirstNameInput(user.firstName ?? "");
      setLastNameInput(user.lastName ?? "");
    }
  }, [user]);

  // TASK 1: Post-Google-signup phone nudge - REMOVED (phone is now read-only)
  // Note: Phone number can no longer be edited by users

  const handleSaveName = async () => {
    if (!firstNameInput.trim() || !lastNameInput.trim()) {
      setNameError("First and last name are required");
      return;
    }
    try {
      setSavingName(true);
      setNameError(null);
      // Send the update
      await updateProfile({
        firstName: firstNameInput.trim(),
        lastName: lastNameInput.trim(),
        phoneNumber: user?.phoneNumber ?? "",
        alias: user?.alias ?? "",
      });
      // Re-fetch fresh profile data to ensure UI matches backend state
      const freshProfile = await getProfile();
      updateUser(freshProfile);
      setEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelName = () => {
    setFirstNameInput(user?.firstName ?? "");
    setLastNameInput(user?.lastName ?? "");
    setNameError(null);
    setEditingName(false);
  };

  const fullName = user 
    ? (user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.alias || user.phoneNumber || "NollyWin Player")
    : "Adaeze Okonkwo";
  const email = user?.email || "adaeze.okonkwo@gmail.com";
  const phoneNumber = user?.phoneNumber || "+234 801 234 5678";
  const alias = user?.alias || "nolly_ace";

  // VERIFIED: totalPoints, gamesPlayed, bestScore come from profile endpoint
  const totalPoints = user?.totalPoints ?? 0;
  const gamesPlayed = user?.gamesPlayed ?? 0;
  const bestScore = user?.bestScore ?? 0;

  // Calculate days since last password change
  const lastPasswordChanged = user?.lastPasswordChangedAt 
    ? Math.floor((Date.now() - new Date(user.lastPasswordChangedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  // Use real referral link from API (no hardcoded domain)
  const displayReferralLink = referralLink || "Loading...";

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      // Optional: Add a toast notification here if you have a toast system
    }
  };

  const handleShareWhatsApp = () => {
    if (!referralLink) return;
    const message = encodeURIComponent(
      `Join me on NollyWin! Use my referral link to get started: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!referralLink) return;
    const text = encodeURIComponent(
      `Join me on NollyWin! 🎮🎉 Use my referral link to get started:`
    );
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 md:space-y-6">
        {/* Phone Number Prompt Banner - REMOVED (phone is now read-only) */}

        {/* Header with Avatar */}
        <div className="flex flex-col items-center text-center gap-2.5 sm:gap-3">
          <div className="relative">
            <AvatarUpload currentUrl={user?.avatarUrl || undefined} />
            {hasActivePlan && (
              <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-secondary flex items-center justify-center border-2 border-background">
                <Star size={12} className="text-primary fill-primary" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold break-words px-4">{fullName}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{hasActivePlan ? `${planName} subscriber` : "Weekly subscriber"}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-brand)]">{totalPoints}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Points</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-brand-hover)]">{gamesPlayed}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Games</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
              <Star size={16} className="sm:w-5 sm:h-5 text-amber-500 fill-amber-500" />
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: "#FFB800" }}>{bestScore}</p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Best</p>
          </div>
        </div>

        {/* Account Details */}
        <section className="space-y-2.5 sm:space-y-3">
          <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Details</h2>

          {/* Full Name Row */}
          {editingName ? (
            <div className="bg-card border border-border rounded-lg p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <User size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">EDIT FULL NAME</p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={firstNameInput}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  placeholder="First Name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm min-h-[44px]"
                  disabled={savingName}
                />
                <input
                  type="text"
                  value={lastNameInput}
                  onChange={(e) => setLastNameInput(e.target.value)}
                  placeholder="Last Name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm min-h-[44px]"
                  disabled={savingName}
                />
              </div>

              {nameError && (
                <p className="text-[10px] sm:text-xs text-destructive">{nameError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm min-h-[44px]"
                >
                  {savingName ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancelName}
                  disabled={savingName}
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <User size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">FULL NAME</p>
                <p className="text-xs sm:text-sm font-medium truncate">{fullName}</p>
              </div>
              <button 
                onClick={() => setEditingName(true)}
                className="text-xs sm:text-sm font-medium flex-shrink-0 min-h-[36px] px-2 text-[var(--color-brand)]" 
              >
                Edit
              </button>
            </div>
          )}

          {/* Email Address Row */}
          <div className="bg-card border border-border rounded-lg p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Mail size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">EMAIL ADDRESS</p>
              <p className="text-xs sm:text-sm font-medium truncate">{email}</p>
            </div>
          </div>

          {/* Phone Number Row - Read-only */}
          <div className="bg-card border border-border rounded-lg p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Phone size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10px] sm:text-xs text-muted-foreground">PHONE NUMBER</p>
                <Lock size={10} className="sm:w-3 sm:h-3 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-xs sm:text-sm font-medium truncate">{phoneNumber}</p>
            </div>
          </div>
        </section>

        {/* Invite Friends Section */}
        <section className="bg-card border border-border rounded-lg p-4 md:p-5 space-y-3.5 md:space-y-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-brand)]">
              <UserPlus size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Invite friends to NollyWin</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Earn bonus tokens for every friend who joins</p>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-black/40 rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate flex-1">{displayReferralLink}</p>
            <button 
              onClick={handleCopy}
              disabled={!referralLink}
              className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md shrink-0 disabled:opacity-50 min-h-[36px] bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[14px] sm:h-[14px]">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>

          {/* Share via */}
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2.5 sm:mb-3">Share via</p>
            <div className="flex gap-2">
              <button 
                onClick={handleShareWhatsApp}
                disabled={!referralLink}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium text-white disabled:opacity-50 min-h-[44px]" 
                style={{ backgroundColor: "#25D366" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="sm:w-[18px] sm:h-[18px] flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="truncate">WhatsApp</span>
              </button>
              <button 
                onClick={handleShareTwitter}
                disabled={!referralLink}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium text-white disabled:opacity-50 min-h-[44px]" 
                style={{ backgroundColor: "#1DA1F2" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="sm:w-[18px] sm:h-[18px] flex-shrink-0">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="truncate">X / Twitter</span>
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-2.5 sm:space-y-3">
          <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</h2>
          
          <Link href="/profile/change-password" className="w-full bg-card border border-border rounded-lg p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3 hover:bg-secondary/30 transition-colors min-h-[64px]">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs sm:text-sm font-medium">Change Password</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Last changed {lastPasswordChanged} {lastPasswordChanged === 1 ? "day" : "days"} ago
              </p>
            </div>
            <ChevronRight size={18} className="sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
          </Link>

          <Link href="/profile/notification-preferences" className="w-full bg-card border border-border rounded-lg p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3 hover:bg-secondary/30 transition-colors min-h-[64px]">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs sm:text-sm font-medium">Notification Preferences</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">All alerts enabled</p>
            </div>
            <ChevronRight size={18} className="sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
          </Link>
        </section>
      </div>
  );
}


export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-4" />}>
      <ProfileContent />
    </Suspense>
  );
}
