"use client";
import { ArrowLeft, Play, Ticket, CreditCard, Trophy, Sparkles, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/store/wallet-store";
import { useEffect, useState } from "react";
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "@/lib/api/notifications";

const NOTIFICATION_ICONS: Record<string, any> = {
  game: Play,
  raffle: Ticket,
  subscription: CreditCard,
  leaderboard: Trophy,
  feature: Sparkles,
  // Add common backend variants (uppercase enum-style)
  GAME: Play,
  RAFFLE: Ticket,
  SUBSCRIPTION: CreditCard,
  LEADERBOARD: Trophy,
  FEATURE: Sparkles,
  GAME_SESSION_RESULT: Play,
  RAFFLE_DRAW_RESULT: Ticket,
  SUBSCRIPTION_REMINDER: CreditCard,
  LEADERBOARD_UPDATE: Trophy,
};

const NOTIFICATION_ICON_COLORS: Record<string, string> = {
  game: "bg-primary/20",
  raffle: "bg-red-500/20",
  subscription: "bg-yellow-500/20",
  leaderboard: "bg-green-500/20",
  feature: "bg-primary/20",
};

const NOTIFICATION_ICON_TEXT_COLORS: Record<string, string> = {
  game: "text-primary",
  raffle: "text-red-500",
  subscription: "text-yellow-500",
  leaderboard: "text-green-500",
  feature: "text-primary",
};

// Helper to get icon with fallback
function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS[type.toLowerCase()] || Bell;
}

// Helper to get colors with fallback
function getNotificationColors(type: string) {
  const lowerType = type.toLowerCase();
  return {
    bgClass: NOTIFICATION_ICON_COLORS[lowerType] || "bg-secondary",
    textClass: NOTIFICATION_ICON_TEXT_COLORS[lowerType] || "text-muted-foreground",
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const { tokens } = useWalletStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update
      loadNotifications();
    }
  }

  async function handleMarkAllAsRead() {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Revert optimistic update
      loadNotifications();
    }
  }
  
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Badge className="bg-primary text-white px-3 py-1 text-xs">
                  {unreadCount} new
                </Badge>
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg p-3 bg-card border border-border animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-1/3" />
                    <div className="h-3 bg-secondary rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const { bgClass, textClass } = getNotificationColors(notification.type);

              return (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  className={`rounded-lg p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    !notification.isRead 
                      ? "bg-card/50 border border-primary/20 hover:bg-card/70" 
                      : "bg-card border border-border hover:bg-secondary/30"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}>
                    <Icon size={18} className={textClass} />
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
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
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
