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
    ? "Next stage →"
    : "Continue";

  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-500 border-green-500",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
    Hard: "bg-red-500/10 text-red-500 border-red-500",
  };

  const optionLabels = ["A", "B", "C", "D", "E"];

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-4">
      {/* Top Bar: Timer, Progress Dots, Difficulty */}
      <div className="flex items-center justify-between">
        {/* Circular Timer */}
        <div className="relative">
          <svg className="transform -rotate-90" width="56" height="56">
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-border"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - timeLeft / 10)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{timeLeft}</span>
          </div>
        </div>

        {/* Stage Progress Dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalStages }).map((_, i) => {
            const stageAnswered = answeredQuestionsPerStage[i];
            const isCompleted = stageAnswered >= 1;
            const isCurrent = i + 1 === currentStage;

            return (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  isCompleted
                    ? "bg-green-500"
                    : isCurrent
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            );
          })}
        </div>

        {/* Difficulty Badge */}
        <Badge className={`${difficultyColors[stageDifficulty]} text-xs px-2.5 py-0.5 border`}>
          {stageDifficulty}
        </Badge>
      </div>

      {/* Points Display */}
      <div className="bg-secondary/30 rounded-lg px-4 py-2.5 text-center">
        <p className="text-xs text-muted-foreground">Points this attempt</p>
        <p className="text-xl font-bold text-primary">{score} pts</p>
      </div>

      {/* Question Text - Clean, no border */}
      <div className="py-2">
        <p className="text-base font-medium leading-relaxed text-foreground">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = i === question.correctIndex;
          const isWrongAnswer = showResult && isSelected && !isCorrectOption;
          const shouldDimHeavily = showResult && !isCorrectOption && !isSelected;

          let stateClass = "border-border/50 hover:border-primary/30 hover:bg-primary/5";
          let badgeClass = "bg-border text-muted-foreground transition-all duration-300";
          let textClass = "text-sm font-normal transition-all duration-300";
          let containerClass = "transition-all duration-300";

          if (showResult) {
            if (isCorrectOption) {
              // Correct answer: bright green, fully visible
              stateClass = "border-green-500/80 bg-green-500/10";
              badgeClass = "bg-green-500 text-white transition-all duration-300";
              textClass = "text-sm font-medium text-white transition-all duration-300";
            } else if (isSelected) {
              // Wrong answer: red
              stateClass = "border-red-500/80 bg-red-500/10";
              badgeClass = "bg-red-500 text-white transition-all duration-300";
              textClass = "text-sm font-normal text-red-200 transition-all duration-300";
            }
          }

          if (isWrongAnswer) {
            // Wrong answer: dimmed but readable
            containerClass += " opacity-35";
          } else if (shouldDimHeavily) {
            // Other options: heavily dimmed
            containerClass += " opacity-20 grayscale";
            stateClass = "border-border/30";
            badgeClass = "bg-border/50 text-muted-foreground/40 transition-all duration-300";
            textClass = "text-sm font-normal text-muted-foreground/40 transition-all duration-300";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={selectedIndex !== null}
              onClick={() => onAnswer(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border bg-card/50 flex items-center gap-3 ${stateClass} ${containerClass}`}
            >
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${badgeClass}`}>
                {optionLabels[i]}
              </div>
              <span className={`flex-1 ${textClass}`}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Answer Feedback Banner */}
      {showResult && (
        <button
          onClick={onNext}
          className={`w-full rounded-xl px-5 py-3 text-center transition-all ${
            isCorrect
              ? "bg-green-500/10 border border-green-500/50 hover:bg-green-500/15"
              : "bg-red-900/40 border border-red-500/50 hover:bg-red-900/50"
          }`}
        >
          <p className={`font-semibold text-base ${isCorrect ? "text-green-500" : "text-red-500"}`}>
            {isCorrect ? "Correct! +50 pts" : isTimeout ? "Time's up." : "Wrong answer."}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTimeout ? "See results" : nextButtonText}
          </p>
        </button>
      )}
    </div>
  );
}
