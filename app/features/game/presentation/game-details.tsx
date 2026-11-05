"use client";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAGES } from "../data/mock-questions";
import { getGameSettings, type GameSettings } from "@/lib/api/game";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";

interface GameDetailsProps {
  tokenCostPerPlay: number;
  onStartGame: () => void;
  onBack: () => void;
}

export function GameDetails({ tokenCostPerPlay, onStartGame, onBack }: GameDetailsProps) {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  
  // Get dashboard data from unified hook
  const { data: dashboard } = usePlayerDashboard();
  const canPlay = dashboard?.canPlay ?? false;
  const tokensLeft = dashboard?.tokensLeft ?? null;

  useEffect(() => {
    // Fetch game settings
    getGameSettings()
      .then(setSettings)
      .catch((err) => console.warn("Failed to load game settings:", err));
  }, []);

  const secondsPerQuestion = settings?.secondsPerQuestion ?? 10; // fallback while loading
  const pointsPerCorrect = settings?.pointsPerCorrectAnswer ?? 50; // fallback while loading
  
  // V37: Calculate balance after play
  // tokensLeft can be: null (unlimited), 0 (no tokens), or N (remaining)
  const currentTokens = tokensLeft ?? 0;
  const balanceAfterPlay = tokensLeft === null ? null : Math.max((tokensLeft ?? 0) - tokenCostPerPlay, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold">Game Details</h1>
      </div>

      {/* Token Cost Card */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-5 space-y-3 md:space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          TOKEN COST
        </h2>
        <div className="space-y-2.5 md:space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-foreground">Cost per game</span>
            <span className="font-medium whitespace-nowrap">{tokenCostPerPlay} {tokenCostPerPlay === 1 ? 'token' : 'tokens'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-foreground">Current balance</span>
            <span className="font-medium whitespace-nowrap">
              {tokensLeft === null ? 'Unlimited' : `${currentTokens} tokens`}
            </span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-foreground">Balance after play</span>
            <span className="font-bold text-[#F40289] whitespace-nowrap">
              {balanceAfterPlay === null ? 'Unlimited' : `${balanceAfterPlay} tokens`}
            </span>
          </div>
        </div>
      </div>

      {/* Game Structure Card */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-5 space-y-3 md:space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          GAME STRUCTURE
        </h2>
        <div className="space-y-2.5 md:space-y-3">
          {STAGES.map((stage) => (
            <div key={stage.stage} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color} shrink-0`} />
                <div className="text-xs sm:text-sm min-w-0">
                  <span className="font-medium">{stage.title}</span>
                  <span className="text-muted-foreground ml-1.5 sm:ml-2 whitespace-nowrap">
                    {stage.difficulty} · {secondsPerQuestion}s
                  </span>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-medium text-[#F40289] whitespace-nowrap flex-shrink-0">
                +{pointsPerCorrect} pts
              </span>
            </div>
          ))}
        </div>
        
        <div className="pt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
          <p>Correct answer → advance to next stage</p>
          <p>Wrong answer or timeout → attempt ends</p>
        </div>
      </div>

      {/* Start Game Button */}
      <Button
        onClick={onStartGame}
        disabled={!canPlay}
        className={`w-full justify-center text-sm sm:text-base font-medium py-3 sm:py-3.5 min-h-[48px] ${
          canPlay
            ? 'bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90'
            : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
        }`}
      >
        Start Game · {tokenCostPerPlay} {tokenCostPerPlay === 1 ? 'Token' : 'Tokens'}
      </Button>

      {!canPlay && (
        <p className="text-destructive text-xs sm:text-sm text-center break-words px-4">
          You need an active subscription with tokens to play. Visit the Store to get a plan.
        </p>
      )}
    </div>
  );
}
