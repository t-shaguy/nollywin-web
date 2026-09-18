"use client";
import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { useWalletSync } from "@/hooks/use-wallet-sync";
import { useSubscriptionSync } from "@/hooks/use-subscription-sync";

export function AuthenticatedShell({
  children,
  tokenBalance,
  unreadCount,
}: {
  children: ReactNode;
  tokenBalance: number;
  unreadCount?: number;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Sync wallet balance and subscription status with backend on mount/token change
  useWalletSync();
  useSubscriptionSync();

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-screen overflow-hidden">
        <TopBar tokenBalance={tokenBalance} unreadCount={unreadCount} onMenuClick={() => setMobileNavOpen(true)} />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
