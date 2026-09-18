import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// VERIFIED: Profile shape from backend (returned in login/verify-otp response and GET /api/v1/users/profile)
export interface User {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  alias: string | null;
  role: "PLAYER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  lastPasswordChangedAt: string; // ISO 8601 timestamp
  avatarUrl: string | null;
  totalPoints: number;
  gamesPlayed: number;
  bestScore: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  rememberMe: boolean; // Track whether to use localStorage or sessionStorage
  setSession: (token: string, user: User, rememberMe?: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

// Custom storage that switches between localStorage and sessionStorage
const getStorage = (): StateStorage => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Check which storage has the auth data and use that
  const sessionData = sessionStorage.getItem("nollywin-auth");
  const localData = localStorage.getItem("nollywin-auth");

  // Prefer sessionStorage if it has data (means rememberMe was false)
  if (sessionData) {
    return sessionStorage;
  }

  // Default to localStorage
  return localStorage;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      rememberMe: true, // Default to localStorage
      setSession: (token, user, rememberMe = true) => {
        set({ token, user, rememberMe });
        
        // Switch storage based on rememberMe preference
        if (typeof window !== "undefined") {
          const key = "nollywin-auth";
          const data = JSON.stringify({
            state: { token, user, rememberMe },
            version: 0,
          });

          if (rememberMe) {
            // Save to localStorage, remove from sessionStorage
            localStorage.setItem(key, data);
            sessionStorage.removeItem(key);
          } else {
            // Save to sessionStorage, remove from localStorage
            sessionStorage.setItem(key, data);
            localStorage.removeItem(key);
          }
        }
      },
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null 
      })),
      logout: () => {
        set({ token: null, user: null, rememberMe: true });
        // Clear from both storages to ensure clean logout
        if (typeof window !== "undefined") {
          localStorage.removeItem("nollywin-auth");
          sessionStorage.removeItem("nollywin-auth");
        }
      },
    }),
    {
      name: "nollywin-auth",
      storage: createJSONStorage(() => getStorage()),
    }
  )
);