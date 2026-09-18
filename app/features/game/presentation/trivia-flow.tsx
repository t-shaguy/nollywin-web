"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameDetails } from "./game-details";
import { QuestionView } from "./question-view";
import { StageCleared } from "./stage-cleared";
import { useWalletStore } from "@/store/wallet-store";
import * as gameApi from "@/lib/api/game";
import type { ApiError } from "@/lib/api/client";
import type { Question, AttemptState } from "@/lib/api/game";
import type { TriviaQuestion } from "../data/mock-questions";

type Step = "details" | "playing" | "cleared" | "error";

// Adapter to convert API Question to TriviaQuestion format expected by UI
function adaptQuestion(apiQuestion: Question): TriviaQuestion {
  const options: [string, string, string, string, string] = [
    apiQuestion.options.A,
    apiQuestion.options.B,
    apiQuestion.options.C,
    apiQuestion.options.D,
    "", // No E option from API
  ];
  
  // Map A/B/C/D to index 0/1/2/3
  const correctIndexMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  const correctIndex = correctIndexMap[apiQuestion.correctAnswer] || 0;
  
  // Map API difficulty to UI difficulty
  const difficultyMap: Record<string, "Easy" | "Medium" | "Hard"> = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
  };
  const difficulty = difficultyMap[apiQuestion.difficulty] || "Easy";
  
  return {
    id: apiQuestion.id,
    question: apiQuestion.text,
    options,
    correctIndex,
    stage: apiQuestion.stage as 1 | 2 | 3,
    difficulty,
  };
}

export function TriviaFlow() {
  const router = useRouter();
  const { tokens, setBalance } = useWalletStore();
  
  // API-driven state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptState, setAttemptState] = useState<AttemptState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // UI state
  const [step, setStep] = useState<Step>("details");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = attemptState?.questions[currentQuestionIndex];
  const totalQuestions = attemptState?.totalQuestions || 3;
  const currentScore = attemptState?.score || 0;

  // Map question results for stage-cleared view (true = correct, false = wrong)
  const questionResults = attemptState?.answers.map((a) => a.isCorrect) || [];

  const startGame = async () => {
    setError(null);
    try {
      // Start a new attempt - this debits 1 token on the backend
      const response = await gameApi.startAttempt();
      
      setAttemptId(response.attempt.attemptId);
      setAttemptState(response.attempt);
      setCurrentQuestionIndex(0);
      setSelectedIndex(null);
      setTimeLeft(response.attempt.questions[0]?.timeLimit || 10);
      setStep("playing");
      
      // Refresh wallet balance from server (token was debited)
      const { fetchWalletBalance } = await import("@/store/wallet-store");
      fetchWalletBalance().catch(console.error);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to start game");
      
      // If insufficient tokens, redirect to store
      if (apiError.status === 400 || apiError.message?.toLowerCase().includes("insufficient")) {
        setTimeout(() => router.push("/store"), 2000);
      }
    }
  };

  const handleAnswer = async (optionIndex: number) => {
    if (selectedIndex !== null || !attemptId || !currentQuestion) return;
    
    setSelectedIndex(optionIndex);
    setIsSubmitting(true);
    
    try {
      // Map index to A/B/C/D
      const options = ["A", "B", "C", "D"] as const;
      const selectedOption = options[optionIndex];
      
      // Submit answer to server
      const response = await gameApi.submitAnswer(attemptId, { selectedOption });
      
      setLastAnswerCorrect(response.isCorrect);
      setShowFeedback(true);
      
      // Update attempt state with new score and answers
      if (attemptState) {
        const updatedState: AttemptState = {
          ...attemptState,
          score: response.totalScore,
          answers: [
            ...attemptState.answers,
            {
              questionId: currentQuestion.id,
              selectedAnswer: selectedOption,
              isCorrect: response.isCorrect,
              pointsEarned: response.pointsEarned,
            },
          ],
          status: response.attemptCompleted ? "COMPLETED" : attemptState.status,
        };
        setAttemptState(updatedState);
        
        // If game is completed, show results
        if (response.attemptCompleted) {
          // Refresh wallet balance (points were added)
          const { fetchWalletBalance } = await import("@/store/wallet-store");
          fetchWalletBalance().catch(console.error);
          
          setTimeout(() => {
            setStep("cleared");
          }, 1500);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextAfterAnswer = () => {
    if (!attemptState) return;
    
    // Move to next question
    if (currentQuestionIndex + 1 < attemptState.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedIndex(null);
      setShowFeedback(false);
      setTimeLeft(attemptState.questions[currentQuestionIndex + 1]?.timeLimit || 10);
    } else {
      // All questions answered, show results
      setStep("cleared");
    }
  };

  // Countdown timer per question
  useEffect(() => {
    if (step !== "playing" || selectedIndex !== null || !currentQuestion) return;
    
    if (timeLeft <= 0) {
      // Timeout - auto-submit as timeout (will be marked wrong by backend)
      // Submit with a special timeout indicator or just the first option
      handleAnswer(0); // or -1 to indicate timeout
      return;
    }
    
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, timeLeft, selectedIndex, currentQuestion]);

  const backToDashboard = () => router.push("/home");

  const restartGame = () => {
    setStep("details");
    setAttemptId(null);
    setAttemptState(null);
    setCurrentQuestionIndex(0);
    setSelectedIndex(null);
    setTimeLeft(10);
    setShowFeedback(false);
    setError(null);
  };

  // Error view
  if (step === "error" || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Error</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <button
            onClick={restartGame}
            className="w-full bg-primary text-white rounded-lg py-3 font-medium hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <GameDetails
        currentTokens={tokens}
        onStartGame={startGame}
        onBack={backToDashboard}
      />
    );
  }

  if (step === "cleared" && attemptState) {
    const correctCount = attemptState.answers.filter((a) => a.isCorrect).length;
    
    return (
      <StageCleared
        correctCount={correctCount}
        total={attemptState.totalQuestions}
        pointsEarned={attemptState.score}
        bonusTokens={0}
        onBackToStages={backToDashboard}
        onNextStage={restartGame}
        questionResults={questionResults}
      />
    );
  }

  // Playing view
  if (!currentQuestion || !attemptState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading question...</p>
      </div>
    );
  }

  // Calculate current stage from question index (1 question per stage for now)
  const currentStage = currentQuestionIndex + 1;
  const totalStages = attemptState.questions.length;
  
  // Adapt API question to UI format
  const adaptedQuestion = adaptQuestion(currentQuestion);

  return (
    <QuestionView
      question={adaptedQuestion}
      currentStage={currentStage}
      totalStages={totalStages}
      stageDifficulty={adaptedQuestion.difficulty}
      score={currentScore}
      timeLeft={Math.max(timeLeft, 0)}
      selectedIndex={selectedIndex}
      onAnswer={handleAnswer}
      onNext={handleNextAfterAnswer}
      isTimeout={timeLeft <= 0 && selectedIndex === null}
      isLastQuestionInStage={true} // 1 question per stage
      answeredQuestionsPerStage={questionResults.map(() => 1)} // All answered
      currentQuestionInStage={0}
    />
  );
}
