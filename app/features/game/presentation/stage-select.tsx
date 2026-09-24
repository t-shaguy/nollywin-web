"use client";
import { useEffect, useState } from "react";
import { Play, Coins, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGameSettings, type GameSettings } from "@/lib/api/game";

export function StageSelect({ 
  onStart, 
  currentTokens, 
  tokenCostPerPlay 
}: { 
  onStart: () => void; 
  currentTokens: number;
  tokenCostPerPlay: number;
}) {
  const [settings, setSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    // NOTE: This endpoint is currently admin-only in lib/api/admin.ts (uses adminApiClient).
    // If it works with player tokens, great; if it 401s, we need a player-accessible version.
    getGameSettings()
      .then(setSettings)
      .catch((err) => console.error("Failed to load game settings:", err));
  }, []);

  const secondsPerQuestion = settings?.secondsPerQuestion ?? 10; // fallback while loading
  const hasEnoughTokens = currentTokens >= tokenCostPerPlay;

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto py-10">
      <div className="h-24 w-24 rounded-full bg-primary/15 flex items-center justify-center mb-6">
        <Play size={36} className="text-primary" />
      </div>
      <h1 className="text-3xl font-extrabold">Trivia Challenge</h1>
      <p className="text-muted-foreground mt-2">
        {secondsPerQuestion} seconds per question.
      </p>

      {/* Current balance banner */}
      <div className="bg-secondary/50 rounded-xl p-3 w-full mt-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Your Balance</span>
        <span className="flex items-center gap-1.5 font-bold">
          <Coins size={16} className="text-primary" />
          {currentTokens} Tokens
        </span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 w-full mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entry Fee</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Coins size={16} className="text-primary" />
            {tokenCostPerPlay} {tokenCostPerPlay === 1 ? 'Token' : 'Tokens'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Potential Reward</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Star size={16} className="text-amber-500" />
            150 Points
          </span>
        </div>
      </div>

      <Button
        onClick={onStart}
        disabled={!hasEnoughTokens}
        className="w-full justify-center mt-6"
      >
        {hasEnoughTokens
          ? `Pay ${tokenCostPerPlay} ${tokenCostPerPlay === 1 ? 'Token' : 'Tokens'} & Play`
          : "Insufficient Tokens"}
      </Button>

      {!hasEnoughTokens && (
        <p className="text-destructive text-sm mt-2">
          You need {tokenCostPerPlay - currentTokens} more {tokenCostPerPlay - currentTokens === 1 ? 'token' : 'tokens'} to play
        </p>
      )}
    </div>
  );
}
