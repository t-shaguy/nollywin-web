"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User2, Mail, Phone, Calendar, Coins, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById, type AdminUserDetail } from "@/lib/api/admin";
import { AvatarInitials } from "@/components/admin/avatar-initials";
import { Icon } from "@/components/admin/icon";
import { formatDate } from "@/lib/utils/format";

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

  // Get display name
  const getDisplayName = (user: AdminUserDetail) => {
    if (user.alias) return user.alias;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    return user.email || user.phoneNumber || "Unknown User";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} className="mr-1" />
            Back to Users
          </Button>
        </Link>
        <div className="bg-card border border-border rounded-xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-[13px]">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} className="mr-1" />
            Back to Users
          </Button>
        </Link>
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-[13px]">
          {error || "User not found"}
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  
  // Get subscription status from user data
  const subscriptionStatus = (user as any).subscriptionStatus || (user as any).status || "INACTIVE";
  
  // Type for subscription data based on API response
  interface Subscription {
    id?: string;
    packageId?: string;
    packageName?: string;
    status?: string;
    paymentReference?: string;
    startsAt?: string;
    expiresAt?: string;
    createdAt?: string;
    [key: string]: unknown;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/users">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={14} className="mr-1" />
          Back to Users
        </Button>
      </Link>

      {/* Header with Avatar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AvatarInitials email={user.email} size="lg" />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold text-foreground mb-1">{displayName}</h1>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Calendar size={14} />
              <span>Joined {formatDate(user.joinedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon icon={Coins} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Token Balance</p>
          </div>
          <p className="text-[24px] font-semibold text-foreground tabular-nums">{user.tokenBalance.toLocaleString()}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon icon={Code} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Referral Code</p>
          </div>
          <p className="text-[16px] font-semibold text-foreground font-mono">{user.referralCode}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon icon={User2} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Status</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${
              subscriptionStatus === "ACTIVE" 
                ? "bg-green-500" 
                : subscriptionStatus === "EXPIRED" 
                ? "bg-yellow-500"
                : "bg-gray-400"
            }`} />
            <p className="text-[16px] font-semibold text-foreground">{subscriptionStatus}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon icon={Mail} />
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Email</p>
              </div>
              <p className="text-[13px] text-foreground pl-6">{user.email}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon icon={Phone} />
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
              </div>
              <p className="text-[13px] text-foreground pl-6">{user.phoneNumber || "—"}</p>
            </div>

            {user.alias && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon={User2} />
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Alias</p>
                </div>
                <p className="text-[13px] text-foreground pl-6">{user.alias}</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Account Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">User ID</p>
              <code className="text-[11px] text-foreground bg-secondary px-2 py-1 rounded font-mono break-all">
                {user.authUserId}
              </code>
            </div>

            {user.firstName && (
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">First Name</p>
                <p className="text-[13px] text-foreground">{user.firstName}</p>
              </div>
            )}

            {user.lastName && (
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Last Name</p>
                <p className="text-[13px] text-foreground">{user.lastName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-[14px] font-semibold text-foreground mb-4">Recent Subscriptions</h2>
        {user.recentSubscriptions && user.recentSubscriptions.length > 0 ? (
          <div className="space-y-4">
            {(user.recentSubscriptions as Subscription[]).slice(0, 5).map((sub, idx) => {
              const startsAt = sub.startsAt ? new Date(sub.startsAt) : null;
              const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
              const createdAt = sub.createdAt ? new Date(sub.createdAt) : null;
              
              return (
                <div key={sub.id || idx} className="p-5 bg-secondary/40 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">{sub.packageName || "Unknown Package"}</p>
                    </div>
                    {sub.status && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border">
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          sub.status === "ACTIVE" 
                            ? "bg-green-500" 
                            : sub.status === "EXPIRED" 
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`} />
                        <span className="text-[12px] font-medium text-foreground">{sub.status}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {startsAt && (
                      <div>
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Started</p>
                        <p className="text-[13px] font-medium text-foreground">{formatDate(sub.startsAt!)}</p>
                      </div>
                    )}
                    {expiresAt && (
                      <div>
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Expires</p>
                        <p className="text-[13px] font-medium text-foreground">{formatDate(sub.expiresAt!)}</p>
                      </div>
                    )}
                    {createdAt && !startsAt && (
                      <div>
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Created</p>
                        <p className="text-[13px] font-medium text-foreground">{formatDate(sub.createdAt!)}</p>
                      </div>
                    )}
                    {sub.paymentReference && (
                      <div className="sm:col-span-2">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Payment Reference</p>
                        <code className="text-[12px] text-foreground font-mono bg-background px-2.5 py-1.5 rounded break-all inline-block">
                          {sub.paymentReference}
                        </code>
                      </div>
                    )}
                    {sub.packageId && (
                      <div className="sm:col-span-2">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Package ID</p>
                        <code className="text-[12px] text-foreground font-mono bg-background px-2.5 py-1.5 rounded break-all inline-block">
                          {String(sub.packageId)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-[13px] py-4 text-center">No recent subscriptions</p>
        )}
      </div>
    </div>
  );
}
