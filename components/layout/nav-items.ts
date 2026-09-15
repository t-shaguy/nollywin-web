import { BarChart3, Play, CreditCard, Trophy, Ticket, Settings, LucideIcon } from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

// Figma nav: Dashboard, Play Trivia, Store, Leaderboard, Raffles, Profile
// My Stats and Refer & Earn removed from sidebar per revamp spec
export const NAV_ITEMS: NavItem[] = [
  { icon: BarChart3, label: "Dashboard", href: "/home" },
  { icon: Play, label: "Play Trivia", href: "/game" },
  { icon: CreditCard, label: "Store", href: "/store" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Ticket, label: "Raffles", href: "/raffles" },
  { icon: Settings, label: "Profile", href: "/profile" },
];

// Play Trivia should send an unsubscribed user to /store first, per the Figma flow,
// rather than letting them land on /game with nothing to do there.
export function resolveNavHref(item: NavItem, hasActivePlan: boolean): string {
  if (item.href === "/game" && !hasActivePlan) return "/store";
  return item.href;
}
