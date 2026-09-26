import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TriviaQuestion } from "../data/mock-questions";

export function QuestionView({
  question,
  currentStage,
  totalStages,
  stageDifficulty,
  score,
  timeLeft,
  selectedIndex,
  onAnswer,
  onNext,
  isTimeout = false,
  isLastQuestionInStage = false,
  answeredQuestionsPerStage = [0, 0, 0],
  currentQuestionInStage = 0,
}: {
  question: TriviaQuestion;
  currentStage: number;
  totalStages: number;
  stageDifficulty: "Easy" | "Medium" | "Hard";
  score: number;
  timeLeft: number;
  selectedIndex: number | null;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  isTimeout?: boolean;
  isLastQuestionInStage?: boolean;
  answeredQuestionsPerStage?: number[];
  currentQuestionInStage?: number;
}) {
  const isCorrect = selectedIndex !== null && selectedIndex >= 0 && selectedIndex === question.correctIndex;
  const isWrong = selectedIndex !== null && (selectedIndex < 0 || selectedIndex !== question.correctIndex);
  const showResult = selectedIndex !== null;
  
  const nextButtonText = isCorrect 
    ? "Next stage →" // Always next stage since 1 question per stage
    : "Continue";

  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-500 border-green-500",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
    Hard: "bg-red-500/10 text-red-500 border-red-500",
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Stage Progress Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {Array.from({ length: totalStages }).map((_, i) => {
            const stageNum = i + 1;
            const stageAnswered = answeredQuestionsPerStage[i];
            const isCompleted = stageAnswered >= 1; // 1 question per stage
            const isCurrent = stageNum === currentStage;

            return (
              <div key={stageNum} className="flex items-center">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle size={16} /> : stageNum}
                </div>
                {i < totalStages - 1 && (
                  <div
                    className={`h-0.5 w-6 ${
                      isCompleted ? "bg-green-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Badge
          className={`${difficultyColors[stageDifficulty]} text-xs px-3 py-1 border`}
        >
          {stageDifficulty}
        </Badge>
      </div>

      {/* Timer and Score Row */}
      <div className="flex items-center gap-4">
        {/* Circular Countdown */}
        <div className="relative">
          <svg className="transform -rotate-90" width="64" height="64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-border"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / 10)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{timeLeft}</span>
          </div>
        </div>

        {/* Points Display */}
        <div className="flex-1 bg-secondary/30 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground">Points this attempt</p>
          <p className="text-2xl font-bold text-primary">{score} pts</p>
        </div>
      </div>

      {/* Question Text */}
      <div className="bg-card border border-border rounded-lg p-5">
        <p className="text-base font-semibold leading-relaxed">{question.question}</p>
      </div>

      {/* Options (A-E) */}
      <div className="space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = i === question.correctIndex;
          const isRelevant = showResult && (isCorrectOption || isSelected);
          const shouldDim = showResult && !isRelevant;

          let stateClass = "border-border hover:border-primary/50 hover:bg-primary/5";
          let badgeClass = "bg-secondary transition-all duration-300";
          let textClass = "text-sm font-medium transition-all duration-300";
          let containerClass = "transition-all duration-300";

          if (showResult) {
            if (isCorrectOption) {
              stateClass = "border-green-500 bg-green-500/10";
              badgeClass = "bg-green-500 text-white transition-all duration-300";
              textClass = "text-sm font-bold text-white transition-all duration-300";
            } else if (isSelected) {
              stateClass = "border-red-500 bg-red-500/10";
              badgeClass = "bg-red-500 text-white transition-all duration-300";
            }
          }

          if (shouldDim) {
            containerClass += " opacity-50 blur-[0.5px] grayscale";
            stateClass = "border-border/50 bg-card";
            badgeClass = "bg-secondary/50 text-muted-foreground/50 transition-all duration-300";
            textClass = "text-sm font-medium text-muted-foreground/50 transition-all duration-300";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={selectedIndex !== null}
              onClick={() => onAnswer(i)}
              className={`w-full text-left px-4 py-3 rounded-lg border bg-card flex items-center gap-3 ${stateClass} ${containerClass}`}
            >
              <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center font-semibold text-xs ${badgeClass}`}>
                {optionLabels[i]}
              </div>
              <span className={`flex-1 ${textClass}`}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Answer Feedback Banner - Clickable */}
      {showResult && (
        <button
          onClick={onNext}
          className={`w-full rounded-lg p-4 text-center transition-all ${
            isCorrect
              ? "bg-green-500/10 border border-green-500 hover:bg-green-500/20"
              : "bg-red-900/30 border border-red-900 hover:bg-red-900/40"
          }`}
        >
          <p className={`font-semibold text-base ${isCorrect ? "text-green-500" : "text-red-500"}`}>
            {isCorrect ? "Correct! +50 pts" : isTimeout ? "Time's up." : "Wrong answer."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {nextButtonText}
          </p>
        </button>
      )}
    </div>
  );
}
