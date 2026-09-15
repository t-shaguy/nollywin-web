import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationPreferences {
  // Games & Raffles
  raffleDrawResults: boolean;
  gameSessionResults: boolean;
  leaderboardChanges: boolean;
  
  // Account & Updates
  subscriptionReminders: boolean;
  newFeatures: boolean;
  weeklyDigest: boolean;
  
  // Push notifications (not a toggle, just tracks if enabled)
  pushNotificationsEnabled: boolean;
}

interface NotificationPreferencesState {
  preferences: NotificationPreferences;
  updatePreference: (key: keyof NotificationPreferences, value: boolean) => void;
  savePreferences: () => Promise<void>;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set) => ({
      preferences: {
        raffleDrawResults: true,
        gameSessionResults: true,
        leaderboardChanges: true,
        subscriptionReminders: true,
        newFeatures: true,
        weeklyDigest: false,
        pushNotificationsEnabled: false,
      },
      
      updatePreference: (key, value) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        })),
      
      savePreferences: async () => {
        // TODO: replace with real API call once the backend exists
        // This is just a simulated save for now
        return Promise.resolve();
      },
    }),
    { name: "notification-preferences" }
  )
);
