"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Star, User, Mail, Phone, ChevronRight, Lock, Bell } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";

import { AvatarUpload } from "@/app/features/profile/presentation/avatar-upload";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile } from "@/lib/api/profile";

function ProfileContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { hasActivePlan, planName } = useSubscriptionStore();

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
