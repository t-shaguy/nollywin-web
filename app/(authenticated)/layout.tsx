"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useWalletStore } from "@/store/wallet-store";
import { useNotificationsSync } from "@/hooks/use-notifications-sync";

/**
 * Shared layout for all authenticated routes.
 * 
 * AuthenticatedShell is mounted ONCE for the entire route group, not per-page.
 * This prevents redundant wallet/subscription API calls on every navigation.
 * 
 * Before: AuthenticatedShell unmounted/remounted on every page change → redundant fetches
 * After: AuthenticatedShell stays mounted during navigation → fetch once per session
 * 
 * NOTE: ToastProvider is now in root layout (app/layout.tsx) so it works on ALL routes,
 * including /payments/callback which is outside the (authenticated) group.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { tokenBalance } = useWalletStore();
  const { unreadCount } = useNotificationsSync();
  const pathname = usePathname();
  
  return (
    <AuthenticatedShell tokenBalance={tokenBalance} unreadCount={unreadCount}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </AuthenticatedShell>
  );
}
