import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_QUESTIONS, TriviaQuestion } from "@/app/features/game/data/mock-questions";

interface TriviaQuestionsState {
  questions: TriviaQuestion[];
  addQuestion: (q: Omit<TriviaQuestion, "id">) => void;
}

export const useTriviaQuestionsStore = create<TriviaQuestionsState>()(
  persist(
    (set) => ({
      questions: MOCK_QUESTIONS, // seed with the existing placeholder set
      addQuestion: (q) =>
        set((state) => ({
          questions: [...state.questions, { ...q, id: `q${Date.now()}` }],
        })),
    }),
    { name: "trivia-questions-storage" }
  )
);
