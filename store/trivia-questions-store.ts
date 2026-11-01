import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TriviaQuestion } from "@/app/features/game/data/mock-questions";

interface TriviaQuestionsState {
  questions: TriviaQuestion[];
  addQuestion: (q: Omit<TriviaQuestion, "id">) => void;
}

export const useTriviaQuestionsStore = create<TriviaQuestionsState>()(
  persist(
    (set) => ({
      questions: [], // ⚠️ NO MOCK DATA - Questions come from API only
      addQuestion: (q) =>
        set((state) => ({
          questions: [...state.questions, { ...q, id: `q${Date.now()}` }],
        })),
    }),
    { name: "trivia-questions-storage" }
  )
);
