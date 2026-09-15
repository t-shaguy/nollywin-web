import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  player: string;
  points: number;
  prize?: string;
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  monthEndDate: Date;
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  setCurrentUserId: (id: string) => void;
}

// Mock data matching the Figma spec
const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, playerId: "user1", player: "ChidiB", points: 15420, prize: "₦50,000" },
  { rank: 2, playerId: "user2", player: "NollyQueen", points: 14200, prize: "₦30,000" },
  { rank: 3, playerId: "user3", player: "FilmGeek99", points: 13850, prize: "₦10,000" },
  { rank: 4, playerId: "user4", player: "Tola_Stars", points: 12100 },
  { rank: 5, playerId: "user5", player: "WinnerMan", points: 11900 },
  { rank: 6, playerId: "user6", player: "AyoQuiz", points: 10850 },
  { rank: 7, playerId: "user7", player: "NaijaGenius", points: 9720 },
  { rank: 8, playerId: "current-user", player: "You", points: 1200 },
  { rank: 9, playerId: "user9", player: "LagosGamer", points: 980 },
  { rank: 10, playerId: "user10", player: "MovieBuff", points: 850 },
];

// Calculate month end (last day of current month)
function getMonthEndDate(): Date {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return lastDay;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set) => ({
      // TODO: replace with GET /leaderboard/monthly once the backend is live.
      entries: MOCK_ENTRIES,
      currentUserId: "current-user", // Simulated current user ID
      monthEndDate: getMonthEndDate(),

      updateLeaderboard: (entries) => set({ entries }),
      
      setCurrentUserId: (id) => set({ currentUserId: id }),
    }),
    { name: "leaderboard-storage" }
  )
);
