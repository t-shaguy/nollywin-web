"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X, Monitor } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { NAV_ITEMS, resolveNavHref } from "./nav-items";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const hasActivePlan = useSubscriptionStore((s) => s.hasActivePlan);

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/login");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-background border-r border-border flex flex-col px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/home" onClick={onClose} className="flex items-center gap-2 px-2">
            <div className="bg-brand-gradient h-9 w-9 rounded-lg flex items-center justify-center">
              <Monitor size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-brand-gradient font-bold text-xl">NollyWin</span>
          </Link>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-3.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const href = resolveNavHref(item, hasActivePlan);
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-medium transition-colors ${
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
          className="flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
