"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Monitor, BarChart3, Upload, CreditCard, Users, FileBarChart2, Trophy, ShieldCheck, Settings, Coins, Bell, FileText, X } from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth-store";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Overview", href: "/admin/overview" },
  { icon: Upload, label: "Trivia Setup", href: "/admin/trivia-setup" },
  { icon: Settings, label: "Game Settings", href: "/admin/game-settings" },
  { icon: CreditCard, label: "Packages", href: "/admin/packages" },
  { icon: Coins, label: "Token Rate", href: "/admin/token-rate" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: FileBarChart2, label: "Reports", href: "/admin/reports" },
  { icon: Trophy, label: "Rewards", href: "/admin/rewards" },
  { icon: ShieldCheck, label: "Verifications", href: "/admin/change-requests" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: CreditCard, label: "Payments", href: "/admin/payment-settings" },
  { icon: FileText, label: "Audit Log", href: "/admin/audit-log" },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAdminAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="flex flex-col w-72 shrink-0 h-screen min-h-0 border-r border-border bg-background px-4 sm:px-6 py-4 sm:py-6">
      {/* Header with close button on mobile */}
      <div className="flex items-center justify-between mb-8 sm:mb-12 shrink-0">
        <Link href="/admin/overview" className="flex items-center gap-2 sm:gap-3 px-2" onClick={handleNavClick}>
          <div className="bg-brand-gradient h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center">
            <Monitor size={18} className="text-white sm:w-5 sm:h-5" strokeWidth={2.5} />
          </div>
          <span className="text-brand-gradient font-bold text-lg sm:text-xl">NollyAdmin</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-secondary rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 sm:space-y-2">
        {NAV_ITEMS.map((item) => {
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
