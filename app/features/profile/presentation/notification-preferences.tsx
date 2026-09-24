"use client";
import { useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferencesStore } from "@/store/notification-preferences-store";

const PREFS = [
  { key: "raffleDrawResults" as const, label: "Raffle draw results" },
  { key: "gameSessionResults" as const, label: "Game session results" },
  { key: "leaderboardChanges" as const, label: "Leaderboard changes" },
  { key: "subscriptionReminders" as const, label: "Subscription reminders" },
  { key: "newFeatures" as const, label: "New features" },
  { key: "weeklyDigest" as const, label: "Weekly digest" },
  { key: "pushEnabled" as const, label: "Push notifications" },
] as const;

export function NotificationPreferences() {
  const { preferences, loading, loadPreferences, updatePreference } = useNotificationPreferencesStore();
  
  // Load real preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return (
    <div className="divide-y divide-border">
      {loading ? (
        <div className="py-3.5 text-sm text-muted-foreground">Loading preferences...</div>
      ) : (
        PREFS.map((p) => (
          <div key={p.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
            <span className="text-sm font-medium text-foreground">{p.label}</span>
            <Switch checked={preferences[p.key]} onChange={() => updatePreference(p.key, !preferences[p.key])} />
          </div>
        ))
      )}
    </div>
  );
}
