"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Star, User, Mail, Phone, ChevronRight, Lock, Bell, UserPlus } from "lucide-react";
import Link from "next/link";
import { useWalletStore } from "@/store/wallet-store";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useReferralStore, fetchReferralData } from "@/store/referral-store";
import { AvatarUpload } from "@/app/features/profile/presentation/avatar-upload";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile } from "@/lib/api/profile";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { tokenBalance } = useWalletStore();
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

  // Edit state for Phone Number
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(user?.phoneNumber ?? "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  // Fetch fresh profile data on mount (rehydrates totalPoints, gamesPlayed, bestScore)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        updateUser(profile);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
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
        console.error("Failed to fetch referral data:", err);
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
      setPhoneInput(user.phoneNumber ?? "");
    }
  }, [user]);

  // TASK 1: Post-Google-signup phone nudge
  // Check if redirected from Google sign-in with missing phone number
  useEffect(() => {
    const promptPhone = searchParams.get("prompt") === "phone";
    if (promptPhone && (!user?.phoneNumber || user.phoneNumber.trim() === "")) {
      setShowPhonePrompt(true);
      setEditingPhone(true);
    }
  }, [searchParams, user]);

  const handleSaveName = async () => {
    if (!firstNameInput.trim() || !lastNameInput.trim()) {
      setNameError("First and last name are required");
      return;
    }
    try {
      setSavingName(true);
      setNameError(null);
      const response = await updateProfile({
        firstName: firstNameInput.trim(),
        lastName: lastNameInput.trim(),
        phoneNumber: user?.phoneNumber ?? "",
        alias: user?.alias ?? "",
      });
      updateUser(response.user);
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

  const handleSavePhone = async () => {
    const trimmedPhone = phoneInput.trim();
    if (!/^\+234\d{10}$/.test(trimmedPhone)) {
      setPhoneError("Enter a valid Nigerian number starting with +234");
      return;
    }
    try {
      setSavingPhone(true);
      setPhoneError(null);
      const response = await updateProfile({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        phoneNumber: trimmedPhone,
        alias: user?.alias ?? "",
      });
      updateUser(response.user);
      setEditingPhone(false);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Failed to update phone number");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleCancelPhone = () => {
    setPhoneInput(user?.phoneNumber ?? "");
    setPhoneError(null);
    setEditingPhone(false);
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
    <div className="max-w-lg mx-auto space-y-6">
        {/* Phone Number Prompt Banner (shown when redirected from Google sign-in) */}
        {showPhonePrompt && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-500 mb-1">Complete Your Profile</h3>
            <p className="text-xs text-muted-foreground">
              Please add your phone number to complete your account setup. This helps us provide better service and support.
            </p>
          </div>
        )}

        {/* Header with Avatar and Subscriber Badge */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <AvatarUpload currentUrl={user?.avatarUrl || undefined} />
            {hasActivePlan && (
              <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-secondary flex items-center justify-center border-2 border-background">
                <Star size={12} className="text-primary fill-primary" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{fullName}</h1>
            <p className="text-sm text-muted-foreground">{hasActivePlan ? `${planName} subscriber` : "Weekly subscriber"}</p>
          </div>
        </div>

        {/* Stat Cards - Colored values */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: "#F40289" }}>{totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">Points</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: "#FC0D28" }}>{gamesPlayed}</p>
            <p className="text-xs text-muted-foreground mt-1">Games</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: "#FFB800" }}>{bestScore}</p>
            <p className="text-xs text-muted-foreground mt-1">Best Score</p>
          </div>
        </div>

        {/* Account Details */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Details</h2>

          {/* Full Name Row */}
          {editingName ? (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <User size={18} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-semibold">EDIT FULL NAME</p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={firstNameInput}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  placeholder="First Name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  disabled={savingName}
                />
                <input
                  type="text"
                  value={lastNameInput}
                  onChange={(e) => setLastNameInput(e.target.value)}
                  placeholder="Last Name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  disabled={savingName}
                />
              </div>

              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  {savingName ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancelName}
                  disabled={savingName}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <User size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">FULL NAME</p>
                <p className="text-sm font-medium">{fullName}</p>
              </div>
              <button 
                onClick={() => setEditingName(true)}
                className="text-sm font-medium" 
                style={{ color: "#F40289" }}
              >
                Edit
              </button>
            </div>
          )}

          {/* Email Address Row */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Mail size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">EMAIL ADDRESS</p>
              <p className="text-sm font-medium">{email}</p>
              <p className="text-xs text-muted-foreground mt-1">Contact support to change your email</p>
            </div>
          </div>

          {/* Phone Number Row */}
          {editingPhone ? (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-semibold">EDIT PHONE NUMBER</p>
              </div>
              
              <div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+2348012345678"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  disabled={savingPhone}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: +234 followed by 10 digits</p>
              </div>

              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  {savingPhone ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancelPhone}
                  disabled={savingPhone}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Phone size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">PHONE NUMBER</p>
                <p className="text-sm font-medium">{phoneNumber}</p>
              </div>
              <button 
                onClick={() => setEditingPhone(true)}
                className="text-sm font-medium" 
                style={{ color: "#F40289" }}
              >
                Edit
              </button>
            </div>
          )}
        </section>

        {/* Invite Friends Section */}
        <section className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#F40289" }}>
              <UserPlus size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">Invite friends to NollyWin</h3>
              <p className="text-xs text-muted-foreground">Earn bonus tokens for every friend who joins using your link</p>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground font-mono truncate flex-1">{displayReferralLink}</p>
            <button 
              onClick={handleCopy}
              disabled={!referralLink}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md shrink-0 disabled:opacity-50"
              style={{ backgroundColor: "#F40289", color: "white" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>

          {/* Share via */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">Share via</p>
            <div className="flex gap-2">
              <button 
                onClick={handleShareWhatsApp}
                disabled={!referralLink}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ backgroundColor: "#25D366" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>
              <button 
                onClick={handleShareTwitter}
                disabled={!referralLink}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ backgroundColor: "#1DA1F2" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X / Twitter
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</h2>
          
          <Link href="/profile/change-password" className="w-full bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Lock size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Change Password</p>
              <p className="text-xs text-muted-foreground">
                Last changed {lastPasswordChanged} {lastPasswordChanged === 1 ? "day" : "days"} ago
              </p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>

          <Link href="/profile/notification-preferences" className="w-full bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Bell size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Notification Preferences</p>
              <p className="text-xs text-muted-foreground">All alerts enabled</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>
        </section>
      </div>
  );
}