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

// Helper to build rich description from notification metadata
function buildRichDescription(notification: Notification): string {
  // If backend provides metadata, use it to build richer descriptions
  const { description, amount, tokens, packageName, points, rank, metadata } = notification;
  
  // Start with the base description
  let richDesc = description;
  
  // Add specific details based on notification type and available data
  const lowerType = notification.type.toLowerCase();
  
  if (lowerType.includes('wallet') || lowerType.includes('topup')) {
    if (tokens && amount) {
      richDesc = `${tokens} tokens added (₦${amount.toLocaleString()})`;
    } else if (tokens) {
      richDesc = `${tokens} tokens added to your wallet`;
    }
  } else if (lowerType.includes('subscription')) {
    if (packageName) {
      richDesc = `${packageName} subscription activated`;
    }
  } else if (lowerType.includes('game') || lowerType.includes('trivia')) {
    if (points) {
      richDesc = `You scored ${points} points in the trivia session`;
    }
  } else if (lowerType.includes('leaderboard')) {
    if (rank) {
      richDesc = `You've moved to #${rank} on the leaderboard`;
    }
  } else if (lowerType.includes('raffle')) {
    if (tokens) {
      richDesc = `Your ${tokens} ${tokens === 1 ? 'ticket' : 'tickets'} for the draw ${tokens === 1 ? 'is' : 'are'} active`;
    }
  }
  
  // If metadata has additional info, try to incorporate it
  if (metadata && Object.keys(metadata).length > 0) {
    // Log metadata for debugging/future enhancement
    console.log('Notification metadata available:', metadata);
  }
  
  return richDesc;
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
  
  // CRITICAL: Always fetch fresh data on mount and page visibility
  useEffect(() => {
    loadNotifications();
    
    // Re-fetch when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      // Fetch with pagination params to match expected backend structure
      const data = await getNotifications({ unread: false, page: 0, size: 20 });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
      // CRITICAL: Re-fetch fresh data from backend after mark-read
      await loadNotifications();
      // Also trigger unread count refresh in the navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      // CRITICAL: Re-fetch fresh data from backend after mark-all-read
      await loadNotifications();
      // Also trigger unread count refresh in the navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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
              const richDescription = buildRichDescription(notification);

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
                    <p className="text-xs text-muted-foreground leading-relaxed">{richDescription}</p>
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
