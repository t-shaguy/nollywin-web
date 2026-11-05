"use client";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StageCleared({
  correctCount,
  total,
  pointsEarned,
  bonusTokens,
  onBackToStages,
  onNextStage,
  questionScores, // Array of points earned per question
}: {
  correctCount: number;
  total: number;
  pointsEarned: number;
  bonusTokens: number;
  onBackToStages: () => void;
  onNextStage: () => void;
  questionScores?: number[];
}) {
  // V37: Dashboard refresh happens in trivia-flow.tsx after game ends
  
  // Default to all correct (50 pts each) if not provided
  const scores = questionScores || Array(total).fill(50);
  
  // Calculate total from scores to ensure consistency
  const calculatedTotal = scores.reduce((sum, score) => sum + score, 0);
  
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-5 md:space-y-6">
      {/* Trophy Icon */}
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Trophy size={36} className="sm:w-10 sm:h-10 text-primary" />
      </div>
      
      {/* Title */}
      <div className="space-y-1.5 md:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Game Over!</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          You got {correctCount} out of {total} correct.
        </p>
      </div>

      {/* Question Results - Q1, Q2, Q3 - responsive grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-md">
        {scores.map((points, i) => {
          const isCorrect = points > 0;
          return (
            <div
              key={i}
              className={`rounded-lg p-2.5 sm:p-3 ${
                isCorrect 
                  ? 'bg-green-900/30 border border-green-900' 
                  : 'bg-red-900/30 border border-red-900'
              }`}
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Q{i + 1}</p>
              <p className={`text-lg sm:text-xl font-bold ${
                isCorrect ? 'text-green-500' : 'text-red-500'
              }`}>
                +{points}
              </p>
            </div>
          );
        })}
      </div>

      {/* Total Points - calculated from per-question scores */}
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-4 sm:p-5">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Points Earned</p>
        <p className="text-3xl sm:text-4xl font-bold text-primary">+{calculatedTotal}</p>
      </div>

      {/* Play Again Button */}
      <Button 
        onClick={onNextStage}
        className="w-full max-w-md bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90 text-sm sm:text-base py-3 justify-center font-medium min-h-[48px]"
      >
        Play Again
      </Button>
    </div>
  );
}
