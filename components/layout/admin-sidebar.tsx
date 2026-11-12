"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, BarChart3, Upload, CreditCard, Users, FileBarChart2, Trophy, ShieldCheck, Settings, Bell, FileText, X, RefreshCw, Award } from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth-store";

const NAV_ITEMS: Array<{ icon: any; label: string; href: string; makerOnly?: boolean }> = [
  { icon: BarChart3, label: "Overview", href: "/admin/overview" },
  { icon: Upload, label: "Trivia Setup", href: "/admin/trivia-setup" },
  { icon: Settings, label: "Game Settings", href: "/admin/game-settings" },
  { icon: CreditCard, label: "Packages", href: "/admin/packages" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: FileBarChart2, label: "Reports", href: "/admin/reports" },
  { icon: Trophy, label: "Rewards", href: "/admin/rewards" },
  { icon: Award, label: "Winners", href: "/admin/winners", makerOnly: true },
  { icon: RefreshCw, label: "Client Sync", href: "/admin/client-sync" },
  { icon: ShieldCheck, label: "Approvals", href: "/admin/change-requests" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: CreditCard, label: "Payments", href: "/admin/payment-settings" },
  { icon: FileText, label: "Audit Log", href: "/admin/audit-log" },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAdminAuthStore((s) => s.session);
  const logout = useAdminAuthStore((s) => s.logout);
  
  const isChecker = session?.role === 'AUTH';
  
  // TEMP: Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.debug('[AdminSidebar] Session role:', session?.role, 'isChecker:', isChecker);
  }

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };
  
  // For checkers, show only Approvals
  // For makers/admins, show all items except makerOnly items for non-makers
  // Note: AdminRole has "ADMIN" (maker) and "AUTH" (checker), no "MAKER" type
  const visibleNavItems = isChecker 
    ? NAV_ITEMS.filter(item => item.href === '/admin/change-requests')
    : NAV_ITEMS.filter(item => !item.makerOnly || (session?.role && session.role === 'ADMIN'));
  
  // Logo link depends on role
  const logoHref = isChecker ? '/admin/change-requests' : '/admin/overview';

  return (
    <aside className="flex flex-col w-72 shrink-0 h-screen min-h-0 border-r border-border bg-background px-4 sm:px-6 py-4 sm:py-6">
      {/* Header with close button on mobile */}
      <div className="flex items-center justify-between mb-8 sm:mb-12 shrink-0">
        <Link href={logoHref} className="flex items-center gap-2 sm:gap-3 px-2" onClick={handleNavClick}>
          <Image src="/logo.png" alt="NollyWin" width={200} height={200} className="h-16 sm:h-[100px] w-auto object-contain" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-secondary rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 sm:space-y-2">
        {visibleNavItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mt-4"
      >
        <LogOut size={18} className="shrink-0" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
