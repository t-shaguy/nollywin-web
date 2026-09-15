"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Coins, Award } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { MOCK_ADMIN_USERS } from "@/lib/mock/admin-users";

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const user = MOCK_ADMIN_USERS.find((u) => u.id === userId);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Link href="/admin/users" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Users
        </Link>
      </div>
    );
  }

  const avatarLetter = user.username[0].toUpperCase();

  return (
    <div className="space-y-8">
      <Link 
        href="/admin/users"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Users
      </Link>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
          {avatarLetter}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{user.username}</h1>
          <p className="text-muted-foreground text-sm">
            User ID: {user.id} • Joined {user.joined}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Trophy} label="Total Points" value={user.totalPoints.toLocaleString()} />
        <StatCard icon={Coins} label="Tokens Left" value={user.tokens.toString()} />
        <StatCard icon={Award} label="Monthly Rank" value={`#${user.monthlyRank}`} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Account Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm font-medium">Current Plan</span>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{user.plan}</span>
              <Button variant="outline" className="text-sm px-3 py-2">
                Manage Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
