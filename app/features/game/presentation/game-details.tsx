"use client";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAGES } from "../data/mock-questions";
import { getGameSettings, type GameSettings } from "@/lib/api/game";

interface GameDetailsProps {
  currentTokens: number;
  tokenCostPerPlay: number;
  onStartGame: () => void;
  onBack: () => void;
}

export function GameDetails({ currentTokens, tokenCostPerPlay, onStartGame, onBack }: GameDetailsProps) {
  const [settings, setSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    // NOTE: This endpoint is currently admin-only in lib/api/admin.ts (uses adminApiClient).
    // If it works with player tokens, great; if it 401s, we need a player-accessible version.
    getGameSettings()
      .then(setSettings)
      .catch((err) => console.error("Failed to load game settings:", err));
  }, []);

  const secondsPerQuestion = settings?.secondsPerQuestion ?? 10; // fallback while loading
  const pointsPerCorrect = settings?.pointsPerCorrectAnswer ?? 50; // fallback while loading
  
  const balanceAfterPlay = currentTokens - tokenCostPerPlay;
  const canPlay = currentTokens >= tokenCostPerPlay;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Game Details</h1>
      </div>

      {/* Token Cost Card */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          TOKEN COST
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Cost per game</span>
            <span className="font-medium">{tokenCostPerPlay} {tokenCostPerPlay === 1 ? 'token' : 'tokens'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Current balance</span>
            <span className="font-medium">{currentTokens} tokens</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-foreground">Balance after play</span>
            <span className="font-bold text-[#F40289]">{balanceAfterPlay} tokens</span>
          </div>
        </div>
      </div>

      {/* Game Structure Card */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          GAME STRUCTURE
        </h2>
        <div className="space-y-3">
          {STAGES.map((stage) => (
            <div key={stage.stage} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color} shrink-0`} />
                <div className="text-sm">
                  <span className="font-medium">{stage.title}</span>
                  <span className="text-muted-foreground ml-2">
                    {stage.difficulty} · {secondsPerQuestion}s
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium text-[#F40289]">
                +{pointsPerCorrect} pts
              </span>
            </div>
          ))}
        </div>
        
        <div className="pt-2 space-y-1 text-sm text-muted-foreground">
          <p>Correct answer → advance to next stage</p>
          <p>Wrong answer or timeout → attempt ends</p>
        </div>
      </div>

      {/* Start Game Button */}
      <Button
        onClick={onStartGame}
        disabled={!canPlay}
        className={`w-full justify-center text-base font-medium py-3.5 ${
          canPlay
            ? 'bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white hover:opacity-90'
            : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
        }`}
      >
        Start Game · {tokenCostPerPlay} {tokenCostPerPlay === 1 ? 'Token' : 'Tokens'}
      </Button>

      {!canPlay && (
        <p className="text-destructive text-sm text-center">
          You need at least {tokenCostPerPlay} {tokenCostPerPlay === 1 ? 'token' : 'tokens'} to play. Visit the Store to top up.
        </p>
      )}
    </div>
  );
}
