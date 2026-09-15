"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Monitor, BarChart3, Upload, CreditCard, Users, FileBarChart2, Trophy } from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth-store";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Overview", href: "/admin/overview" },
  { icon: Upload, label: "Trivia Setup", href: "/admin/trivia-setup" },
  { icon: CreditCard, label: "Packages & Fees", href: "/admin/packages" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: FileBarChart2, label: "Reports", href: "/admin/reports" },
  { icon: Trophy, label: "Rewards", href: "/admin/rewards" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAdminAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <aside className="hidden md:flex md:flex-col w-72 shrink-0 h-screen min-h-0 border-r border-border px-6 py-8">
      <Link href="/admin/overview" className="flex items-center gap-3 px-2 mb-16 shrink-0">
        <div className="bg-brand-gradient h-10 w-10 rounded-lg flex items-center justify-center">
          <Monitor size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-brand-gradient font-bold text-2xl">NollyAdmin</span>
      </Link>

      <nav className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );
}
