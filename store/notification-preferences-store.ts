import { create } from "zustand";
import { apiClient } from "@/lib/api/client";

export interface NotificationPreferences {
  // Games & Raffles
  raffleDrawResults: boolean;
  gameSessionResults: boolean;
  leaderboardChanges: boolean;
  
  // Account & Updates
  subscriptionReminders: boolean;
  newFeatures: boolean;
  weeklyDigest: boolean;
  
  // Push notifications - field name is "pushEnabled" not "pushNotificationsEnabled"
  pushEnabled: boolean;
}

interface NotificationPreferencesState {
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
  loadPreferences: () => Promise<void>;
  updatePreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()((set, get) => ({
  preferences: {
    raffleDrawResults: true,
    gameSessionResults: true,
    leaderboardChanges: true,
    subscriptionReminders: true,
    newFeatures: true,
    weeklyDigest: false,
    pushEnabled: false,
  },
  loading: false,
  error: null,
  
  loadPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const prefs = await apiClient<NotificationPreferences>("/api/v1/notifications/preferences", {
        method: "GET",
      });
      set({ preferences: prefs, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load preferences", loading: false });
    }
  },
  
  updatePreference: async (key, value) => {
    const oldPreferences = get().preferences;
    const newPreferences = { ...oldPreferences, [key]: value };
    
    // Optimistic update
    set({ preferences: newPreferences });
    
    try {
      const updated = await apiClient<NotificationPreferences>("/api/v1/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(newPreferences),
      });
      set({ preferences: updated });
    } catch (err) {
      // Revert on error
      set({ preferences: oldPreferences, error: err instanceof Error ? err.message : "Failed to update preferences" });
    }
  },
}));

