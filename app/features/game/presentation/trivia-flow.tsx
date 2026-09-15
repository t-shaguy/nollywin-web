"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameDetails } from "./game-details";
import { QuestionView } from "./question-view";
import { StageCleared } from "./stage-cleared";
import { GAME_CONFIG, STAGES, MOCK_QUESTIONS } from "../data/mock-questions";
import { useTriviaQuestionsStore } from "@/store/trivia-questions-store";
import { useWalletStore } from "@/store/wallet-store";

type Step = "details" | "playing" | "cleared";

const ANSWER_REVEAL_DELAY_MS = 900;

export function TriviaFlow() {
  const router = useRouter();
  const allQuestions = useTriviaQuestionsStore((s) => s.questions);
  const { tokens, deductTokens, addPoints } = useWalletStore();
  const [step, setStep] = useState<Step>("details");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [questionIndexInStage, setQuestionIndexInStage] = useState(0); // 0-2 for 3 questions per stage
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameEnded, setGameEnded] = useState(false);
  const [answeredQuestionsPerStage, setAnsweredQuestionsPerStage] = useState<number[]>([0, 0, 0]); // Track answered questions per stage
  const [questionResults, setQuestionResults] = useState<boolean[]>([]); // Track correct/wrong for each question

  const currentStage = STAGES[currentStageIndex];
  
  // Get questions for current stage
  const stageQuestions = MOCK_QUESTIONS.filter(q => q.stage === currentStage.stage);
  const currentQuestion = stageQuestions[questionIndexInStage];
  
  const totalScore = totalCorrect * 50; // 50 points per correct answer

  const advanceToNextQuestion = () => {
    // Mark current stage as completed
    const newAnswered = [...answeredQuestionsPerStage];
    newAnswered[currentStageIndex] = 1; // 1 question per stage
    setAnsweredQuestionsPerStage(newAnswered);
    
    // Move to next stage
    if (currentStageIndex + 1 < STAGES.length) {
      setCurrentStageIndex((i) => i + 1);
      setQuestionIndexInStage(0);
      setSelectedIndex(null);
      setTimeLeft(10);
    } else {
      // All stages completed
      endGame();
    }
  };

  const endGame = () => {
    addPoints(totalScore);
    setGameEnded(true);
    setStep("cleared");
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);
    
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      setTotalCorrect((c) => c + 1);
    }
    
    // Track this question's result
    setQuestionResults(prev => [...prev, isCorrect]);
    
    // Don't auto-advance - user clicks button in feedback banner
  };

  const handleNextAfterAnswer = () => {
    const isCorrect = selectedIndex !== null && selectedIndex >= 0 && selectedIndex === currentQuestion.correctIndex;
    
    // ALWAYS advance to next question, whether correct or wrong
    // Game only ends when all questions are completed
    advanceToNextQuestion();
  };

  // Countdown timer per question. Times out as a wrong answer.
  useEffect(() => {
    if (step !== "playing" || selectedIndex !== null) return;
    if (timeLeft <= 0) {
      // Timeout - auto-select as wrong (no answer)
      setSelectedIndex(-1); // -1 means timeout/no answer
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, timeLeft, selectedIndex]);

  // Auto-end game on timeout after reveal delay
  useEffect(() => {
    if (selectedIndex === -1 && !gameEnded) {
      // Timeout - record as wrong answer
      setQuestionResults(prev => [...prev, false]);
      // Don't end game - just wait for user to click Continue
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, gameEnded]);

  const startGame = () => {
    // Deduct tokens to start
    const success = deductTokens(GAME_CONFIG.entryFeeTokens);
    if (!success) {
      // Not enough tokens - redirect to store
      router.push("/store");
      return;
    }

    // TODO: wire to POST /trivia/start once backend exists.
    setCurrentStageIndex(0);
    setQuestionIndexInStage(0);
    setTotalCorrect(0);
    setSelectedIndex(null);
    setTimeLeft(10);
    setGameEnded(false);
    setStep("playing");
  };

  const backToDashboard = () => router.push("/home");

  const restartGame = () => {
    setStep("details");
    setCurrentStageIndex(0);
    setQuestionIndexInStage(0);
    setTotalCorrect(0);
    setSelectedIndex(null);
    setTimeLeft(10);
    setGameEnded(false);
    setAnsweredQuestionsPerStage([0, 0, 0]);
    setQuestionResults([]);
  };

  if (step === "details") {
    return (
      <GameDetails
        currentTokens={tokens}
        onStartGame={startGame}
        onBack={backToDashboard}
      />
    );
  }

  if (step === "cleared") {
    return (
      <StageCleared
        correctCount={totalCorrect}
        total={STAGES.length}
        pointsEarned={totalScore}
        bonusTokens={0}
        onBackToStages={backToDashboard}
        onNextStage={restartGame}
        questionResults={questionResults}
      />
    );
  }

  return (
    <QuestionView
      question={currentQuestion}
      currentStage={currentStageIndex + 1}
      totalStages={STAGES.length}
      stageDifficulty={currentStage.difficulty}
      score={totalScore}
      timeLeft={Math.max(timeLeft, 0)}
      selectedIndex={selectedIndex}
      onAnswer={handleAnswer}
      onNext={handleNextAfterAnswer}
      isTimeout={selectedIndex === -1}
      isLastQuestionInStage={questionIndexInStage === GAME_CONFIG.questionsPerStage - 1}
      answeredQuestionsPerStage={answeredQuestionsPerStage}
      currentQuestionInStage={questionIndexInStage}
    />
  );
}
