"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuthStore } from "@/store/admin-auth-store";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminAuthStore((s) => s.session);
  
  const isChecker = session?.role === 'AUTH';

  useEffect(() => {
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    
    // Role-based routing for checkers
    if (isChecker) {
      const allowedPaths = ['/admin/change-requests', '/admin/login'];
      const isAllowedPath = allowedPaths.some(path => pathname === path || pathname?.startsWith(path + '/'));
      
      if (!isAllowedPath) {
        // Redirect checker to verifications if accessing unauthorized page
        router.replace("/admin/change-requests");
      }
    }
    
    // Redirect checker from /admin or /admin/overview to /admin/change-requests
    if (isChecker && (pathname === '/admin' || pathname === '/admin/overview')) {
      router.replace("/admin/change-requests");
    }
  }, [session, isChecker, pathname, router]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
