"use client";
import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TopBarProps {
  onMenuClick: () => void;
  hasActiveSubscription: boolean;
  tokensLeft: number | null; // V37: 0 = no tokens, null = unlimited, N = remaining
  unreadCount: number;
  attemptsResetAt?: string | null; // UTC timestamp - format in Africa/Lagos
}

export function TopBar({ 
  onMenuClick, 
  hasActiveSubscription, 
  tokensLeft, 
  unreadCount,
  attemptsResetAt,
}: TopBarProps) {
  const router = useRouter();

  // Format reset time in Africa/Lagos timezone
  const formatResetTime = (utcTime: string | null | undefined): string | null => {
    if (!utcTime) return null;
    
    try {
      const date = new Date(utcTime);
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleString('en-GB', {
        timeZone: 'Africa/Lagos',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  // Header states (REAL BACKEND):
  // 1. No plan: hasActiveSubscription = false → "Subscribe"
  // 2. Active plan, 0 tokens: hasActiveSubscription = true, tokensLeft = 0 → "No tokens left" (disabled)
  // 3. Active plan with tokens: hasActiveSubscription = true, tokensLeft = N → "N tokens left" (enabled)
  // 4. Unlimited: hasActiveSubscription = true, tokensLeft = null → "Unlimited" (enabled)
  
  const getTokenDisplay = () => {
    if (!hasActiveSubscription) {
      // State 1: No active plan
      return {
        text: "Subscribe",
        variant: "subscribe" as const,
        disabled: false,
      };
    }
    
    if (tokensLeft === null) {
      // State 4: Unlimited tokens
      return {
        text: "Unlimited",
        variant: "enabled" as const,
        disabled: false,
      };
    }
    
    if (tokensLeft === 0) {
      // State 2: Active plan but no tokens left
      const resetTime = formatResetTime(attemptsResetAt);
      return {
        text: resetTime ? `Resets ${resetTime}` : "No tokens left",
        variant: "disabled" as const,
        disabled: true,
      };
    }
    
    // State 3: Active plan with N tokens
    return {
      text: `${tokensLeft} ${tokensLeft === 1 ? 'token' : 'tokens'} left`,
      variant: "enabled" as const,
      disabled: false,
    };
  };

  const tokenDisplay = getTokenDisplay();

  const handleTokensClick = () => {
    if (tokenDisplay.disabled) return; // Don't navigate if disabled
    
    if (tokenDisplay.variant === "subscribe") {
      router.push("/store");
    } else {
      router.push("/store"); // Also navigate to store for active plans (to see plan details or upgrade)
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between gap-4">
      {/* Left: Menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden h-10 w-10 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Middle: Empty spacer */}
      <div className="flex-1" />

      {/* Right: Tokens + Notifications */}
      <div className="flex items-center gap-3">
        {/* Tokens Display */}
        <button
          onClick={handleTokensClick}
          disabled={tokenDisplay.disabled}
          className={`
            text-sm font-medium px-4 py-2 rounded-lg transition-colors
            ${tokenDisplay.variant === "subscribe" 
              ? "bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90" 
              : tokenDisplay.variant === "enabled"
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {tokenDisplay.text}
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative h-10 w-10 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
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
