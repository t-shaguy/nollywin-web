/**
 * Game API Service
 * 
 * Trivia gameplay endpoints - start attempts, get state, submit answers
 * This replaces mock-questions.ts as the question source
 */

import { apiClient } from "./client";

// ============================================================================
// Request/Response Types (VERIFIED against real API responses)
// ============================================================================

export interface GameQuestion {
  gameAttemptId: string;
  sequenceNumber: number;
  totalQuestions: number;
  stageName: string;
  difficultyLabel: string | null;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  secondsAllowed: number;
}

// Start attempt returns a GameQuestion directly — not wrapped in { attempt: {...} }
export type StartAttemptResponse = GameQuestion;

export interface AttemptState {
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | string;
  currentQuestion: GameQuestion | null;
  summary: Record<string, unknown> | null; // shape unconfirmed — only ever seen null so far, log it raw the first time a real value appears
}

export interface SubmitAnswerRequest {
  selectedOption: "A" | "B" | "C" | "D";
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctOption: "A" | "B" | "C" | "D";
  pointsEarned: number;
  gameOver: boolean;
  nextQuestion: GameQuestion | null;
  summary: Record<string, unknown> | null;
}

export interface GameSettings {
  pointsPerCorrectAnswer: number;
  secondsPerQuestion: number;
  leaderboardResetDay: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get game settings (player-facing)
 * GET /api/v1/game/settings
 */
export async function getGameSettings(): Promise<GameSettings> {
  return apiClient<GameSettings>("/api/v1/game/settings", {
    method: "GET",
  });
}

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
