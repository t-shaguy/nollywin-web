"use client";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSubscriptionStatusLabel } from "@/hooks/use-subscription-status-label";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";

interface TopBarProps {
  onMenuClick: () => void;
  unreadCount: number;
}

export function TopBar({ 
  onMenuClick, 
  unreadCount,
}: TopBarProps) {
  const router = useRouter();
  const { data: dashboard } = usePlayerDashboard();
  
  // Get unified status label
  const statusLabel = useSubscriptionStatusLabel({
    hasActiveSubscription: dashboard?.hasActiveSubscription ?? false,
    tokensLeft: dashboard?.tokensLeft ?? null,
    subscriptionPaymentPending: dashboard?.subscriptionPaymentPending ?? false,
  });

  const handleTokensClick = () => {
    if (statusLabel.disabled) return; // Don't navigate if disabled
    router.push("/store");
  };

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Menu button (mobile) - 44px touch target */}
      <button
        onClick={onMenuClick}
        className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Middle: Empty spacer */}
      <div className="flex-1 min-w-0" />

      {/* Right: Tokens + Notifications - responsive spacing and sizing */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tokens Display - responsive text sizing and padding */}
        <button
          onClick={handleTokensClick}
          disabled={statusLabel.disabled}
          className={`
            text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors
            min-h-[44px] whitespace-nowrap flex-shrink-0
            ${statusLabel.variant === "subscribe" 
              ? "bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90" 
              : statusLabel.variant === "pending"
              ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
              : statusLabel.variant === "enabled"
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {statusLabel.text}
        </button>

        {/* Notifications - 44px touch target */}
        <Link
          href="/notifications"
          className="relative min-h-[44px] min-w-[44px] h-11 w-11 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F40289] text-white text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
