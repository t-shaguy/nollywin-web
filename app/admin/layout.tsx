"use client";
import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "@/components/layout/admin-auth-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't wrap login page in auth guard or shell
  if (pathname === "/admin/login") {
    return <div className="theme-admin">{children}</div>;
  }

  return (
    <div className="theme-admin">
      <AdminAuthGuard>
        <AdminShell>{children}</AdminShell>
      </AdminAuthGuard>
    </div>
  );
}
