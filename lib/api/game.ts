/**
 * Game API Service
 * 
 * Trivia gameplay endpoints - start attempts, get state, submit answers
 * This replaces mock-questions.ts as the question source
 */

import { apiClient } from "./client";

// ============================================================================
// Request/Response Types
// ============================================================================

export interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  stage: number;
  timeLimit?: number; // seconds
  points?: number;
  [key: string]: any;
}

export interface AttemptState {
  attemptId: string;
  userId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: Question[];
  answers: Array<{
    questionId: string;
    selectedAnswer: "A" | "B" | "C" | "D" | null;
    isCorrect: boolean;
    pointsEarned: number;
    answeredAt?: string;
  }>;
  score: number;
  tokensDeducted: number;
  startedAt: string;
  completedAt?: string;
  [key: string]: any;
}

export interface StartAttemptResponse {
  attempt: AttemptState;
  message?: string;
  [key: string]: any;
}

export interface SubmitAnswerRequest {
  selectedOption: "A" | "B" | "C" | "D";
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: "A" | "B" | "C" | "D";
  pointsEarned: number;
  totalScore: number;
  nextQuestion?: Question;
  attemptCompleted: boolean;
  message?: string;
  [key: string]: any;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Start a new game attempt (debits 1 token)
 * POST /api/v1/game/attempts
 */
export async function startAttempt(): Promise<StartAttemptResponse> {
  return apiClient<StartAttemptResponse>("/api/v1/game/attempts", {
    method: "POST",
  });
}

/**
 * Get attempt state (resume-safe)
 * GET /api/v1/game/attempts/{attemptId}
 */
export async function getAttemptState(attemptId: string): Promise<AttemptState> {
  return apiClient<AttemptState>(`/api/v1/game/attempts/${attemptId}`, {
    method: "GET",
  });
}

/**
 * Submit an answer for the current question
 * POST /api/v1/game/attempts/{attemptId}/answer
 */
export async function submitAnswer(
  attemptId: string,
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  return apiClient<SubmitAnswerResponse>(
    `/api/v1/game/attempts/${attemptId}/answer`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
