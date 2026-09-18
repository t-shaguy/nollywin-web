"use client";
import Link from "next/link";
import { Coins, Bell, Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function TopBar({
  tokenBalance,
  unreadCount = 0,
  onMenuClick,
}: {
  tokenBalance: number;
  unreadCount?: number;
  onMenuClick: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  
  // Get two-letter initials (first + last name)
  const getInitials = () => {
    if (!user) return "P";
    const first = user.firstName?.charAt(0).toUpperCase() || "";
    const last = user.lastName?.charAt(0).toUpperCase() || "";
    return first + last || "P";
  };
  
  const initials = getInitials();

  return (
    <div className="flex items-center justify-between md:justify-end gap-3 px-6 py-4 border-b border-border">
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3.5 py-1.5 text-sm font-medium">
          <Coins size={16} className="text-primary" />
          {tokenBalance.toLocaleString()} {tokenBalance === 1 ? "token" : "tokens"}
        </div>

        <Link href="/notifications" className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Link>

        <Link href="/profile" className="h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </Link>
      </div>
    </div>
  );
}
