"use client";
import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { useSubscriptionSync } from "@/hooks/use-subscription-sync";
import { useNotificationsSync } from "@/hooks/use-notifications-sync";
import { getPlayerDashboard } from "@/lib/api/auth";

export function AuthenticatedShell({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Sync subscription status with backend on mount
  useSubscriptionSync();
  
  // Sync notifications unread count
  const { unreadCount: notificationCount } = useNotificationsSync();

  // Fetch dashboard for tokens
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard-shell"],
    queryFn: getPlayerDashboard,
    refetchInterval: false, // Disable auto-refresh to prevent hammering
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    retry: 1, // Only retry once on failure
  });

  const tokensLeft = dashboard?.tokensLeft ?? 0;
  const hasActiveSubscription = dashboard?.hasActiveSubscription ?? false;

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-screen overflow-hidden">
        <TopBar 
          tokensLeft={tokensLeft} 
          hasActiveSubscription={hasActiveSubscription}
          unreadCount={notificationCount}
          onMenuClick={() => setMobileNavOpen(true)}
          attemptsResetAt={dashboard?.subscription?.attemptsResetAt}
        />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6 max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
