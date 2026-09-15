import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TriviaPrize {
  stage: string;
  category: string;
  description: string;
}

interface TriviaPrizesState {
  prizes: TriviaPrize[];
  savePrize: (prize: TriviaPrize) => void;
}

export const useTriviaPrizesStore = create<TriviaPrizesState>()(
  persist(
    (set) => ({
      prizes: [],
      savePrize: (prize) =>
        set((state) => {
          // Replace existing prize for same stage/category combination
          const filtered = state.prizes.filter(
            (p) => !(p.stage === prize.stage && p.category === prize.category)
          );
          return { prizes: [...filtered, prize] };
        }),
    }),
    { name: "trivia-prizes-storage" }
  )
);
