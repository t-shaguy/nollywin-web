"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { GameDetails } from "./game-details";
import { QuestionView } from "./question-view";
import { StageCleared } from "./stage-cleared";
import * as gameApi from "@/lib/api/game";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import type { ApiError } from "@/lib/api/client";
import type { GameQuestion } from "@/lib/api/game";
import type { TriviaQuestion } from "../data/mock-questions";

type Step = "details" | "playing" | "cleared" | "error";

// Adapter to convert GameQuestion to TriviaQuestion format expected by UI
// Note: correctIndex is NOT known at question display time - only after answer submission
function adaptQuestion(apiQuestion: GameQuestion, correctOption?: "A" | "B" | "C" | "D"): TriviaQuestion {
  const options: [string, string, string, string] = [
    apiQuestion.optionA,
    apiQuestion.optionB,
    apiQuestion.optionC,
    apiQuestion.optionD,
  ];
  
  // Map correctOption to index (only available after submission)
  const correctIndexMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  const correctIndex = correctOption ? (correctIndexMap[correctOption] ?? 0) : 0;
  
  // Map difficultyLabel to UI difficulty (default to "Easy" if null)
  const difficultyMap: Record<string, "Easy" | "Medium" | "Hard"> = {
    "Beginner": "Easy",
    "Easy": "Easy",
    "Medium": "Medium",
    "Hard": "Hard",
  };
  const difficulty = apiQuestion.difficultyLabel ? (difficultyMap[apiQuestion.difficultyLabel] || "Easy") : "Easy";
  
  return {
    id: apiQuestion.gameAttemptId, // Use gameAttemptId as unique identifier
    question: apiQuestion.questionText,
    options,
    correctIndex,
    stage: 1 as 1 | 2 | 3, // Backend doesn't provide stage number, default to 1
    difficulty,
  };
}

export function TriviaFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Get token cost from unified dashboard hook
  const { data: dashboard } = usePlayerDashboard();
  const tokenCostPerPlay = dashboard?.tokenCostPerPlay ?? 1;
  
  // API-driven state
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<GameQuestion | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [currentSequence, setCurrentSequence] = useState<number>(0);
  const [stageName, setStageName] = useState<string>("");
  
  // Score tracking - track points per question, not just correct/wrong
  const [questionScores, setQuestionScores] = useState<number[]>([]); // Points earned per question
  
  // UI state
  const [step, setStep] = useState<Step>("details");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [lastCorrectOption, setLastCorrectOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startGame = async () => {
    setError(null);
    
    try {
      // V37: Start a new attempt - debits 1 token on backend (subscription-only)
      // Returns first question directly (not wrapped)
      const question = await gameApi.startAttempt();
      
      setAttemptId(question.gameAttemptId);
      setCurrentQuestion(question);
      setTotalQuestions(question.totalQuestions);
      setCurrentSequence(question.sequenceNumber);
      setStageName(question.stageName);
      setSelectedIndex(null);
      setTimeLeft(question.secondsAllowed);
      setQuestionScores([]);
      setStep("playing");
      
      // V37: Refresh dashboard to update tokensLeft and draw points
      try {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch (err) {
        console.error("Failed to refresh dashboard after game start:", err);
      }
    } catch (err) {
      const apiError = err as ApiError;
      
      // V37: Handle 402 Payment Required (no subscription or no tokens)
      if (apiError.status === 402) {
        setError("You need an active subscription with tokens to play. Get a plan to continue.");
        setTimeout(() => router.push("/store"), 2500);
        return;
      }
      
      // Generic error
      setError(apiError.message || "Failed to start game");
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
      setLastCorrectOption(response.correctOption);
      setShowFeedback(true);
      
      // Record points for THIS question (the one currently displayed)
      setQuestionScores((prev) => [...prev, response.pointsEarned]);
      
      // If game is over or no next question, show results
      if (response.gameOver || !response.nextQuestion) {
        // Log summary if present
        if (response.summary) {
          console.log("Game summary:", response.summary);
        }
        
        // V37: Refresh dashboard to update tokensLeft and draw points after game end
        try {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        } catch (err) {
          console.error("[TRIVIA] Failed to refresh dashboard after game end:", err);
        }
        
        // DO NOT auto-redirect on last question - let user click "Tap to see result" button
        // The button will call handleNextAfterAnswer which will navigate to results
        setPendingQuestion(null); // Mark as no next question
      } else {
        // Do NOT swap currentQuestion yet — just stash it.
        // The user is still looking at feedback for the question they 
        // just answered. currentQuestion must not change until they 
        // click Continue.
        setPendingQuestion(response.nextQuestion);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeout = async () => {
    if (selectedIndex !== null || !attemptId || !currentQuestion) return;
    
    // Mark as timeout by setting selectedIndex to -1 (sentinel value)
    setSelectedIndex(-1);
    setIsSubmitting(true);
    
    try {
      // Submit timeout to server - use option A as placeholder (backend will mark as wrong/timeout)
      const response = await gameApi.submitAnswer(attemptId, { selectedOption: "A" });
      
      // Timeout is always wrong
      setLastAnswerCorrect(false);
      setLastCorrectOption(response.correctOption);
      setShowFeedback(true);
      
      // Record points for THIS question (should be 0 on timeout)
      setQuestionScores((prev) => [...prev, response.pointsEarned]);
      
      // If game is over or no next question, show results
      if (response.gameOver || !response.nextQuestion) {
        // Log summary if present
        if (response.summary) {
          console.log("Game summary:", response.summary);
        }
        
        // V37: Refresh dashboard to update tokensLeft and draw points after timeout
        try {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        } catch (err) {
          console.error("[TRIVIA] Failed to refresh dashboard after timeout:", err);
        }
        
        // DO NOT auto-redirect on last question - let user click button
        setPendingQuestion(null); // Mark as no next question
      } else {
        setPendingQuestion(response.nextQuestion);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextAfterAnswer = () => {
    // If no pending question, game is over - navigate to results
    if (!pendingQuestion) {
      setStep("cleared");
      return;
    }
    
    // Promote pending question to current
    setCurrentQuestion(pendingQuestion);
    setCurrentSequence(pendingQuestion.sequenceNumber);
    setTimeLeft(pendingQuestion.secondsAllowed);
    setPendingQuestion(null);
    
    // Reset feedback state for the question that's now showing
    setSelectedIndex(null);
    setShowFeedback(false);
    setLastCorrectOption(null);
  };

  // Countdown timer per question
  useEffect(() => {
    if (step !== "playing" || selectedIndex !== null || !currentQuestion) return;
    
    if (timeLeft <= 0) {
      // Timeout - handle as timeout (no answer selected)
      handleTimeout();
      return;
    }
    
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, timeLeft, selectedIndex, currentQuestion]);

  const backToDashboard = () => {
    // V37: Refresh dashboard to update tokensLeft and draw points after game
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    router.push("/home");
  };

  const restartGame = () => {
    setStep("details");
    setAttemptId(null);
    setCurrentQuestion(null);
    setPendingQuestion(null);
    setCurrentSequence(0);
    setTotalQuestions(0);
    setStageName("");
    setSelectedIndex(null);
    setTimeLeft(10);
    setShowFeedback(false);
    setQuestionScores([]);
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
        tokenCostPerPlay={tokenCostPerPlay}
        onStartGame={startGame}
        onBack={backToDashboard}
      />
    );
  }

  if (step === "cleared") {
    const correctCount = questionScores.filter((score) => score > 0).length;
    const totalScore = questionScores.reduce((sum, score) => sum + score, 0);
    
    return (
      <StageCleared
        correctCount={correctCount}
        total={totalQuestions}
        pointsEarned={totalScore}
        bonusTokens={0}
        onBackToStages={backToDashboard}
        onNextStage={restartGame}
        questionScores={questionScores}
      />
    );
  }

  // Playing view
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading question...</p>
      </div>
    );
  }
  
  // Adapt API question to UI format (with correctOption only after answer submission)
  const adaptedQuestion = adaptQuestion(currentQuestion, showFeedback ? lastCorrectOption || undefined : undefined);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestion.gameAttemptId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <QuestionView
          question={adaptedQuestion}
          currentStage={currentSequence}
          totalStages={totalQuestions}
          stageDifficulty={adaptedQuestion.difficulty}
          score={questionScores.reduce((sum, score) => sum + score, 0)}
          timeLeft={Math.max(timeLeft, 0)}
          selectedIndex={selectedIndex}
          onAnswer={handleAnswer}
          onNext={handleNextAfterAnswer}
          isTimeout={selectedIndex === -1}
          isLastQuestionInStage={!pendingQuestion} // True if no next question (game over)
          answeredQuestionsPerStage={questionScores.map((score) => score > 0 ? 1 : 0)}
          currentQuestionInStage={0}
        />
      </motion.div>
    </AnimatePresence>
  );
}
