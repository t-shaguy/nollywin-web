"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User2, Mail, Phone, Hash, Coins } from "lucide-react";
import { getUserById, type AdminUserDetail } from "@/lib/api/admin";

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError(null);
        const userData = await getUserById(userId);
        setUser(userData);
      } catch (err) {
        console.error("Error loading user:", err);
        setError(err instanceof Error ? err.message : "Failed to load user details");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  // Format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get display name
  const getDisplayName = (user: AdminUserDetail) => {
    if (user.alias) return user.alias;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    return user.email || user.phoneNumber || "Unknown User";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Link 
          href="/admin/users"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Users
        </Link>
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-8">
        <Link 
          href="/admin/users"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Users
        </Link>
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error || "User not found"}
        </div>
      </div>
    );
  }

  const avatarLetter = getDisplayName(user)[0]?.toUpperCase() || "?";

  return (
    <div className="space-y-8">
      <Link 
        href="/admin/users"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
          {avatarLetter}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{getDisplayName(user)}</h1>
          <p className="text-muted-foreground text-sm">
            Joined {formatDate(user.joinedAt)}
          </p>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phoneNumber || "—"}</p>
              </div>
            </div>
            {user.alias && (
              <div className="flex items-start gap-3">
                <User2 size={18} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Alias</p>
                  <p className="font-medium">{user.alias}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Account Details</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Hash size={18} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{user.authUserId}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash size={18} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Referral Code</p>
                <p className="font-mono text-sm font-medium">{user.referralCode}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Coins size={18} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Token Balance</p>
                <p className="font-semibold text-lg">{user.tokenBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Recent Subscriptions</h2>
        {user.recentSubscriptions && user.recentSubscriptions.length > 0 ? (
          <div className="space-y-2">
            {user.recentSubscriptions.slice(0, 5).map((sub, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 rounded-xl text-sm">
                <pre className="text-xs overflow-auto">{JSON.stringify(sub, null, 2)}</pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No recent subscriptions</p>
        )}
      </div>
    </div>
  );
}
