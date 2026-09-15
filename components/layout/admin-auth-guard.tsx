"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/admin-auth-store";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useAdminAuthStore((s) => s.session);

  useEffect(() => {
    if (!session) {
      router.replace("/admin/login");
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
