"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameDetails } from "./game-details";
import { QuestionView } from "./question-view";
import { StageCleared } from "./stage-cleared";
import { useWalletStore } from "@/store/wallet-store";
import * as gameApi from "@/lib/api/game";
import { getPlayerDashboard } from "@/lib/api/auth";
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
  const { tokenBalance } = useWalletStore();
  
  // Token cost from dashboard API
  const [tokenCostPerPlay, setTokenCostPerPlay] = useState<number>(1); // fallback
  
  // Load token cost from dashboard on mount
  useEffect(() => {
    getPlayerDashboard()
      .then((dashboard) => setTokenCostPerPlay(dashboard.tokenCostPerPlay))
      .catch((err) => console.error("Failed to load dashboard:", err));
  }, []);
  
  // API-driven state
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [currentSequence, setCurrentSequence] = useState<number>(0);
  const [stageName, setStageName] = useState<string>("");
  
  // Score tracking
  const [totalScore, setTotalScore] = useState<number>(0);
  const [answersHistory, setAnswersHistory] = useState<boolean[]>([]); // true = correct, false = wrong
  
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
      // Start a new attempt - this debits 1 token on the backend
      // Returns first question directly (not wrapped)
      const question = await gameApi.startAttempt();
      
      setAttemptId(question.gameAttemptId);
      setCurrentQuestion(question);
      setTotalQuestions(question.totalQuestions);
      setCurrentSequence(question.sequenceNumber);
      setStageName(question.stageName);
      setSelectedIndex(null);
      setTimeLeft(question.secondsAllowed);
      setTotalScore(0);
      setAnswersHistory([]);
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
      setLastCorrectOption(response.correctOption);
      setShowFeedback(true);
      setTotalScore((prev) => prev + response.pointsEarned);
      setAnswersHistory((prev) => [...prev, response.isCorrect]);
      
      // If game is over or no next question, show results
      if (response.gameOver || !response.nextQuestion) {
        // Refresh wallet balance (points were added)
        const { fetchWalletBalance } = await import("@/store/wallet-store");
        fetchWalletBalance().catch(console.error);
        
        // Log summary if present
        if (response.summary) {
          console.log("Game summary:", response.summary);
        }
        
        setTimeout(() => {
          setStep("cleared");
        }, 1500);
      } else {
        // Prepare next question
        setCurrentQuestion(response.nextQuestion);
        setCurrentSequence(response.nextQuestion.sequenceNumber);
        setTimeLeft(response.nextQuestion.secondsAllowed);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextAfterAnswer = () => {
    // Reset for next question
    setSelectedIndex(null);
    setShowFeedback(false);
    setLastCorrectOption(null);
  };

  // Countdown timer per question
  useEffect(() => {
    if (step !== "playing" || selectedIndex !== null || !currentQuestion) return;
    
    if (timeLeft <= 0) {
      // Timeout - auto-submit first option (will be marked wrong by backend)
      handleAnswer(0);
      return;
    }
    
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, timeLeft, selectedIndex, currentQuestion]);

  const backToDashboard = () => router.push("/home");

  const restartGame = () => {
    setStep("details");
    setAttemptId(null);
    setCurrentQuestion(null);
    setCurrentSequence(0);
    setTotalQuestions(0);
    setStageName("");
    setSelectedIndex(null);
    setTimeLeft(10);
    setShowFeedback(false);
    setTotalScore(0);
    setAnswersHistory([]);
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
        currentTokens={tokenBalance}
        tokenCostPerPlay={tokenCostPerPlay}
        onStartGame={startGame}
        onBack={backToDashboard}
      />
    );
  }

  if (step === "cleared") {
    const correctCount = answersHistory.filter((correct) => correct).length;
    
    return (
      <StageCleared
        correctCount={correctCount}
        total={totalQuestions}
        pointsEarned={totalScore}
        bonusTokens={0}
        onBackToStages={backToDashboard}
        onNextStage={restartGame}
        questionResults={answersHistory}
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
    <QuestionView
      question={adaptedQuestion}
      currentStage={currentSequence}
      totalStages={totalQuestions}
      stageDifficulty={adaptedQuestion.difficulty}
      score={totalScore}
      timeLeft={Math.max(timeLeft, 0)}
      selectedIndex={selectedIndex}
      onAnswer={handleAnswer}
      onNext={handleNextAfterAnswer}
      isTimeout={timeLeft <= 0 && selectedIndex === null}
      isLastQuestionInStage={true} // Each question is treated as a stage
      answeredQuestionsPerStage={answersHistory.map(() => 1)}
      currentQuestionInStage={0}
    />
  );
}
