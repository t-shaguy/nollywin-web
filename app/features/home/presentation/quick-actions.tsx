import Link from "next/link";
import { Wallet, BarChart3, Users, Settings, LucideIcon } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  href: string;
}

// NOTE: /tokens and /stats aren't built yet (Payments Day 16-17, My Stats Day 20-21 on the
// tracker) — routing there now for when they exist. /refer-earn and /profile already work.
const ACTIONS: QuickAction[] = [
  { icon: Wallet, label: "Recharge", href: "/tokens" },
  { icon: BarChart3, label: "My Stats", href: "/stats" },
  { icon: Users, label: "Refer", href: "/refer-earn" },
  { icon: Settings, label: "Settings", href: "/profile" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="flex flex-col items-center gap-2 bg-card border border-border rounded-xl py-4 hover:bg-secondary transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <action.icon size={18} className="text-primary" />
          </div>
          <span className="text-xs text-foreground text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
