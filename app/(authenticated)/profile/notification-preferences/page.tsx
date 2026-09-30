"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferencesStore } from "@/store/notification-preferences-store";

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { preferences, updatePreference } = useNotificationPreferencesStore();

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreference(key, !preferences[key]);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Notification Preferences</h1>
            <p className="text-sm text-muted-foreground">Choose what you want to hear about</p>
          </div>
        </div>

        {/* Games & Raffles Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            GAMES & RAFFLES
          </h2>
          
          {/* Raffle Draw Results */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                preferences.raffleDrawResults ? 'bg-[#F40289]' : 'bg-secondary'
              }`}>
                <Bell size={18} className={preferences.raffleDrawResults ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-medium">Raffle Draw Results</p>
                <p className="text-xs text-muted-foreground">Get notified when draws happen</p>
              </div>
            </div>
            <Switch
              checked={preferences.raffleDrawResults}
              onChange={() => handleToggle("raffleDrawResults")}
            />
          </div>

          {/* Game Session Results */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                preferences.gameSessionResults ? 'bg-[#F40289]' : 'bg-secondary'
              }`}>
                <Bell size={18} className={preferences.gameSessionResults ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-medium">Game Session Results</p>
                <p className="text-xs text-muted-foreground">Score updates after each game</p>
              </div>
            </div>
            <Switch
              checked={preferences.gameSessionResults}
              onChange={() => handleToggle("gameSessionResults")}
            />
          </div>

          {/* Leaderboard Changes */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                preferences.leaderboardChanges ? 'bg-[#F40289]' : 'bg-secondary'
              }`}>
                <Bell size={18} className={preferences.leaderboardChanges ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-medium">Leaderboard Changes</p>
                <p className="text-xs text-muted-foreground">When your rank changes</p>
              </div>
            </div>
            <Switch
              checked={preferences.leaderboardChanges}
              onChange={() => handleToggle("leaderboardChanges")}
            />
          </div>
        </div>

        {/* Account & Updates Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            ACCOUNT & UPDATES
          </h2>
          
          {/* Subscription Reminders */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                preferences.subscriptionReminders ? 'bg-[#F40289]' : 'bg-secondary'
              }`}>
                <Bell size={18} className={preferences.subscriptionReminders ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-medium">Subscription Reminders</p>
                <p className="text-xs text-muted-foreground">Renewal and expiry alerts</p>
              </div>
            </div>
            <Switch
              checked={preferences.subscriptionReminders}
              onChange={() => handleToggle("subscriptionReminders")}
            />
          </div>

          {/* New Features */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                preferences.newFeatures ? 'bg-[#F40289]' : 'bg-secondary'
              }`}>
                <Bell size={18} className={preferences.newFeatures ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-medium">New Features</p>
                <p className="text-xs text-muted-foreground">Product updates and announcements</p>
              </div>
            </div>
            <Switch
              checked={preferences.newFeatures}
              onChange={() => handleToggle("newFeatures")}
            />
          </div>

          {/* Weekly Digest */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                preferences.weeklyDigest ? 'bg-[#F40289]' : 'bg-secondary'
              }`}>
                <Bell size={18} className={preferences.weeklyDigest ? 'text-white' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-medium">Weekly Digest</p>
                <p className="text-xs text-muted-foreground">Weekly summary of your activity</p>
              </div>
            </div>
            <Switch
              checked={preferences.weeklyDigest}
              onChange={() => handleToggle("weeklyDigest")}
            />
          </div>
        </div>
      </div>
  );
}
