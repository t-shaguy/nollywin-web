"use client";
import { ReactNode } from "react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useWalletStore } from "@/store/wallet-store";

/**
 * Shared layout for all authenticated routes.
 * 
 * AuthenticatedShell is mounted ONCE for the entire route group, not per-page.
 * This prevents redundant wallet/subscription API calls on every navigation.
 * 
 * Before: AuthenticatedShell unmounted/remounted on every page change → redundant fetches
 * After: AuthenticatedShell stays mounted during navigation → fetch once per session
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { tokens } = useWalletStore();
  
  return (
    <AuthenticatedShell tokenBalance={tokens} unreadCount={0}>
      {children}
    </AuthenticatedShell>
  );
}
