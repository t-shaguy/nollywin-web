"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Monitor } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { NAV_ITEMS, resolveNavHref } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const hasActivePlan = useSubscriptionStore((s) => s.hasActivePlan);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex md:flex-col w-72 shrink-0 h-screen min-h-0 border-r border-border px-6 py-8">
      <Link href="/home" className="flex items-center gap-3 px-2 mb-16 shrink-0">
        <div className="bg-brand-gradient h-10 w-10 rounded-lg flex items-center justify-center">
          <Monitor size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-brand-gradient font-bold text-2xl">NollyWin</span>
      </Link>

      <nav className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {NAV_ITEMS.map((item) => {
          const href = resolveNavHref(item, hasActivePlan);
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
