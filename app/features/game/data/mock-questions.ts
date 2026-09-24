export interface TriviaQuestion {
  id: string;
  question: string;
  options: [string, string, string, string]; // 4 options (A-D)
  correctIndex: number;
  stage: 1 | 2 | 3;
  difficulty: "Easy" | "Medium" | "Hard";
}

// TODO: replace with GET /trivia/stages/:id/questions once the backend is live.
// 3 questions total - 1 per stage
export const MOCK_QUESTIONS: TriviaQuestion[] = [
  // Stage 1 - Easy
  {
    id: "q1",
    question: "Which Nollywood movie is currently the highest-grossing film of all time?",
    options: ["The Wedding Party", "Omo Ghetto: The Saga", "Battle on Buka Street", "A Tribe Called Judah"],
    correctIndex: 3,
    stage: 1,
    difficulty: "Easy",
  },
  // Stage 2 - Medium
  {
    id: "q2",
    question: "Who directed the critically acclaimed Nollywood film 'King of Boys' released in 2018?",
    options: ["Jade Osiberu", "Kunle Afolayan", "Kemi Adetiba", "EbonyLife Films"],
    correctIndex: 2,
    stage: 2,
    difficulty: "Medium",
  },
  // Stage 3 - Hard
  {
    id: "q3",
    question: "What year did Nollywood become formally recognized as the world's second-largest film producer?",
    options: ["1987", "1992", "2001", "2009"],
    correctIndex: 3,
    stage: 3,
    difficulty: "Hard",
  },
];

export interface StageInfo {
  stage: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  color: string; // For the dot indicator
  secondsPerQuestion: number;
  pointsPerCorrect: number;
}

export const STAGES: StageInfo[] = [
  { stage: 1, title: "Stage 1", difficulty: "Easy", color: "bg-green-500", secondsPerQuestion: 10, pointsPerCorrect: 50 },
  { stage: 2, title: "Stage 2", difficulty: "Medium", color: "bg-yellow-500", secondsPerQuestion: 10, pointsPerCorrect: 50 },
  { stage: 3, title: "Stage 3", difficulty: "Hard", color: "bg-red-500", secondsPerQuestion: 10, pointsPerCorrect: 50 },
];

export const GAME_CONFIG = {
  entryFeeTokens: 1,
  totalStages: 3,
  questionsPerStage: 1, // 1 question per stage
};
