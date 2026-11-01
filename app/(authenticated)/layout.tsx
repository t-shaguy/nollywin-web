"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

/**
 * Shared layout for all authenticated routes (V37)
 * 
 * AuthenticatedShell is mounted ONCE for the entire route group, not per-page.
 * This prevents redundant API calls on every navigation.
 * 
 * The shell now fetches its own dashboard data for tokens and notifications.
 * 
 * NOTE: ToastProvider is now in root layout (app/layout.tsx) so it works on ALL routes,
 * including /payments/callback which is outside the (authenticated) group.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AuthenticatedShell>
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
