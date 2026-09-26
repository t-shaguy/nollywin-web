"use client";
import { ArrowLeft, Play, Ticket, CreditCard, Trophy, Sparkles, Bell, Coins } from "lucide-react";
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
  // Real confirmed types from backend
  WALLET_TOPUP: Coins,
  SUBSCRIPTION_ACTIVATED: CreditCard,
};

const NOTIFICATION_ICON_COLORS: Record<string, string> = {
  game: "bg-primary/20",
  raffle: "bg-red-500/20",
  subscription: "bg-yellow-500/20",
  leaderboard: "bg-green-500/20",
  feature: "bg-primary/20",
  wallet_topup: "bg-yellow-500/20",
  subscription_activated: "bg-yellow-500/20",
};

const NOTIFICATION_ICON_TEXT_COLORS: Record<string, string> = {
  game: "text-primary",
  raffle: "text-red-500",
  subscription: "text-yellow-500",
  leaderboard: "text-green-500",
  feature: "text-primary",
  wallet_topup: "text-yellow-500",
  subscription_activated: "text-yellow-500",
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

// Format ISO 8601 timestamp to relative time
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const { tokenBalance } = useWalletStore();
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
      
      // DEBUG: Log actual backend response to see what fields are available
      console.log('=== NOTIFICATIONS DEBUG ===');
      console.log('Total notifications:', data.length);
      if (data.length > 0) {
        console.log('Sample notification (first one):', JSON.stringify(data[0], null, 2));
        console.log('All notification fields available:', Object.keys(data[0]));
      }
      console.log('=========================');
      
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      console.log('Marking notification as read:', notificationId);
      await markAsRead(notificationId);
      console.log('Mark as read API call completed successfully');
      
      // CRITICAL: Re-fetch fresh data from backend after mark-read
      await loadNotifications();
      
      // Also trigger unread count refresh in the navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      console.error('Error details:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      console.log('Marking all notifications as read...');
      await markAllAsRead();
      console.log('Mark all as read API call completed successfully');
      
      // CRITICAL: Re-fetch fresh data from backend after mark-all-read
      await loadNotifications();
      
      // Also trigger unread count refresh in the navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      console.error('Error details:', error);
    }
  }
  
  const unreadCount = notifications.filter((n) => !n.read).length;

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
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  className={`rounded-lg p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    !notification.read 
                      ? "bg-card/50 border border-primary/20 hover:bg-card/70" 
                      : "bg-card border border-border hover:bg-secondary/30"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}>
                    <Icon size={18} className={textClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">{notification.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{notification.body}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(notification.createdAt)}
                    </span>
                    {!notification.read && (
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
