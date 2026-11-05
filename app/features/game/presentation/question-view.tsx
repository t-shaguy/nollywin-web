import { CheckCircle } from "lucide-react";
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
  // isTimeout means selectedIndex === -1 (timeout sentinel value)
  const userSelectedAnswer = selectedIndex !== null && selectedIndex >= 0;
  const isCorrect = userSelectedAnswer && selectedIndex === question.correctIndex;
  const isWrong = userSelectedAnswer && selectedIndex !== question.correctIndex;
  const showResult = selectedIndex !== null; // Includes timeout (-1) and actual selections

  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-500 border-green-500",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
    Hard: "bg-red-500/10 text-red-500 border-red-500",
  };

  const optionLabels = ["A", "B", "C", "D", "E"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-5 md:space-y-6">
      {/* Stage Progress Row - horizontal scroll on very narrow screens */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-x-auto pb-2 -mb-2">
          {Array.from({ length: totalStages }).map((_, i) => {
            const stageNum = i + 1;
            const stageAnswered = answeredQuestionsPerStage[i];
            const isCompleted = stageAnswered >= 1;
            const isCurrent = stageNum === currentStage;

            return (
              <div key={stageNum} className="flex items-center flex-shrink-0">
                <div
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "✓" : stageNum}
                </div>
                {i < totalStages - 1 && (
                  <div
                    className={`h-0.5 w-4 sm:w-6 ${
                      isCompleted ? "bg-green-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Badge
          className={`${difficultyColors[stageDifficulty]} text-xs px-2.5 sm:px-3 py-1 border flex-shrink-0`}
        >
          {stageDifficulty}
        </Badge>
      </div>

      {/* Timer and Score Row - stack on very narrow screens */}
      <div className="flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-3 sm:gap-4">
        {/* Circular Countdown */}
        <div className="relative flex-shrink-0 self-center min-[400px]:self-auto">
          <svg className="transform -rotate-90" width="60" height="60" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="26"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-border"
            />
            <circle
              cx="30"
              cy="30"
              r="26"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - timeLeft / 10)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg sm:text-xl font-bold">{timeLeft}</span>
          </div>
        </div>

        {/* Points Display */}
        <div className="flex-1 bg-secondary/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 min-w-0">
          <p className="text-xs text-muted-foreground truncate">Points this attempt</p>
          <p className="text-xl sm:text-2xl font-bold text-primary truncate">{score} pts</p>
        </div>
      </div>

      {/* Question Text */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-5">
        <p className="text-sm sm:text-base font-semibold leading-relaxed break-words">{question.question}</p>
      </div>

      {/* Options (A-D) - Responsive sizing */}
      <div className="space-y-2 sm:space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = i === question.correctIndex;
          const isWrongAnswer = userSelectedAnswer && isSelected && !isCorrectOption;
          const shouldDim = showResult && !isCorrectOption && !isWrongAnswer;

          let stateClass = "border-border hover:border-primary/50 hover:bg-primary/5";
          let badgeClass = "bg-secondary transition-all duration-300";
          let textClass = "text-sm font-medium transition-all duration-300";
          let containerClass = "transition-all duration-300";

          if (showResult) {
            if (isCorrectOption) {
              stateClass = "border-green-500 bg-green-500/10";
              badgeClass = "bg-green-500 text-white transition-all duration-300";
              textClass = "text-sm font-bold text-white transition-all duration-300";
            } else if (isSelected && userSelectedAnswer) {
              stateClass = "border-red-500 bg-red-500/10";
              badgeClass = "bg-red-500 text-white transition-all duration-300";
              textClass = "text-sm font-medium text-red-200 transition-all duration-300";
            }
          }

          if (isWrongAnswer) {
            containerClass += " opacity-40";
          } else if (shouldDim) {
            containerClass += " opacity-25 grayscale";
            stateClass = "border-border/30";
            badgeClass = "bg-border/50 text-muted-foreground/40 transition-all duration-300";
            textClass = "text-sm font-medium text-muted-foreground/40 transition-all duration-300";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={selectedIndex !== null}
              onClick={() => onAnswer(i)}
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border bg-card flex items-center gap-2.5 sm:gap-3 min-h-[56px] ${stateClass} ${containerClass}`}
            >
              <div className={`flex-shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center font-semibold text-xs ${badgeClass}`}>
                {optionLabels[i]}
              </div>
              <span className={`flex-1 break-words ${textClass}`}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Answer Feedback Banner - responsive text */}
      {showResult && (
        <button
          onClick={onNext}
          className={`w-full rounded-lg px-3 sm:px-4 py-3 text-center transition-all min-h-[64px] ${
            isCorrect
              ? "bg-green-500/10 border border-green-500 hover:bg-green-500/20"
              : "bg-muted/50 border border-border hover:bg-muted/70"
          }`}
        >
          <p className={`font-semibold text-sm sm:text-base ${
            isCorrect 
              ? "text-green-500" 
              : isTimeout 
                ? "text-muted-foreground" 
                : "text-red-500"
          }`}>
            {isCorrect 
              ? "Correct! +50 pts" 
              : isTimeout 
                ? "⏰ Time's up! +0 pts" 
                : "Wrong answer. +0 pts"}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words">
            {isCorrect
              ? isLastQuestionInStage
                ? "Tap to see result"
                : "Tap to continue"
              : `The correct answer was ${optionLabels[question.correctIndex]}. Tap to ${isLastQuestionInStage ? "see result" : "continue"}`}
          </p>
        </button>
      )}
    </div>
  );
}
