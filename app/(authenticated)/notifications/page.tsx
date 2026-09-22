"use client";
import { ArrowLeft, Play, Ticket, CreditCard, Trophy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/store/wallet-store";

interface Notification {
  id: string;
  type: "game" | "raffle" | "subscription" | "leaderboard" | "feature";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

// Mock notification data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "game",
    title: "Game Result",
    description: "You scored 150 pts in today's trivia session!",
    timestamp: "2 mins ago",
    isRead: false,
  },
  {
    id: "2",
    type: "raffle",
    title: "Raffle Entry Confirmed",
    description: "Your 2 tickets for the iPhone draw are active.",
    timestamp: "1 hr ago",
    isRead: false,
  },
  {
    id: "3",
    type: "subscription",
    title: "Subscription Active",
    description: "Your Weekly plan is now active. Good luck!",
    timestamp: "3 hrs ago",
    isRead: true,
  },
  {
    id: "4",
    type: "leaderboard",
    title: "Leaderboard Update",
    description: "You've moved up to #42 on the monthly leaderboard.",
    timestamp: "Yesterday",
    isRead: true,
  },
  {
    id: "5",
    type: "game",
    title: "New Trivia Available",
    description: "A new Nollywood trivia session is now live!",
    timestamp: "Yesterday",
    isRead: true,
  },
];

const NOTIFICATION_ICONS = {
  game: Play,
  raffle: Ticket,
  subscription: CreditCard,
  leaderboard: Trophy,
  feature: Sparkles,
};

const NOTIFICATION_ICON_COLORS = {
  game: "bg-primary/20",
  raffle: "bg-red-500/20",
  subscription: "bg-yellow-500/20",
  leaderboard: "bg-green-500/20",
  feature: "bg-primary/20",
};

const NOTIFICATION_ICON_TEXT_COLORS = {
  game: "text-primary",
  raffle: "text-red-500",
  subscription: "text-yellow-500",
  leaderboard: "text-green-500",
  feature: "text-primary",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { tokens } = useWalletStore();
  
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-white px-3 py-1 text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {MOCK_NOTIFICATIONS.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            const iconBgClass = NOTIFICATION_ICON_COLORS[notification.type];
            const iconTextClass = NOTIFICATION_ICON_TEXT_COLORS[notification.type];

            return (
              <div
                key={notification.id}
                className={`rounded-lg p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                  !notification.isRead 
                    ? "bg-card/50 border border-primary/20 hover:bg-card/70" 
                    : "bg-card border border-border hover:bg-secondary/30"
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconBgClass}`}>
                  <Icon size={18} className={iconTextClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5">{notification.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{notification.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {notification.timestamp}
                  </span>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {MOCK_NOTIFICATIONS.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">
              We'll notify you when something important happens
            </p>
          </div>
        )}
      </div>
  );
}
