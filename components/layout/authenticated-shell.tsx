"use client";
import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { useNotificationsSync } from "@/hooks/use-notifications-sync";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";

export function AuthenticatedShell({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Sync notifications unread count
  const { unreadCount: notificationCount } = useNotificationsSync();

  // Unified dashboard query - shared with all pages
  const { data: dashboard } = usePlayerDashboard();

  const tokensLeft = dashboard?.tokensLeft ?? 0;
  const hasActiveSubscription = dashboard?.hasActiveSubscription ?? false;

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-screen overflow-hidden">
        <TopBar 
          onMenuClick={() => setMobileNavOpen(true)}
          unreadCount={notificationCount}
        />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-6 md:pb-8">
          {/* Content wrapper with max width for large screens */}
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
