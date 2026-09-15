"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function GreetingHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(" ")[0] ?? "Player";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
          {initial}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <p className="font-bold">{firstName}</p>
        </div>
      </div>

      <Link href="/notifications" className="relative h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
