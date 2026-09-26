import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StageCleared({
  correctCount,
  total,
  pointsEarned,
  bonusTokens,
  onBackToStages,
  onNextStage,
  questionResults, // Array of boolean values for each question (true = correct, false = wrong)
}: {
  correctCount: number;
  total: number;
  pointsEarned: number;
  bonusTokens: number;
  onBackToStages: () => void;
  onNextStage: () => void;
  questionResults?: boolean[];
}) {
  // Default to all correct if not provided
  const results = questionResults || Array(total).fill(true);
  
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto py-10 space-y-6">
      {/* Trophy Icon */}
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
        <Trophy size={40} className="text-primary" />
      </div>
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">Game Over!</h1>
        <p className="text-muted-foreground mt-2">
          You got {correctCount} out of {total} correct.
        </p>
      </div>

      {/* Question Results - Q1, Q2, Q3 */}
      <div className="flex gap-3 w-full justify-center">
        {results.map((isCorrect, i) => (
          <div
            key={i}
            className={`flex-1 max-w-[140px] rounded-lg p-3 ${
              isCorrect 
                ? 'bg-green-900/30 border border-green-900' 
                : 'bg-red-900/30 border border-red-900'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">Q{i + 1}</p>
            <p className={`text-xl font-bold ${
              isCorrect ? 'text-green-500' : 'text-red-500'
            }`}>
              {isCorrect ? '+50' : '+0'}
            </p>
          </div>
        ))}
      </div>

      {/* Total Points */}
      <div className="w-full bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-1">Total Points Earned</p>
        <p className="text-4xl font-bold text-primary">+{pointsEarned}</p>
      </div>

      {/* Play Again Button */}
      <Button 
        onClick={onNextStage}
        className="w-full bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90 text-base py-3 justify-center font-medium"
      >
        Play Again
      </Button>
    </div>
  );
}
