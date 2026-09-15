import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlayNowCard({
  attemptsLeft,
  tokenCost,
}: {
  attemptsLeft: number;
  tokenCost: number;
}) {
  const noAttemptsLeft = attemptsLeft <= 0;

  return (
    <div className="bg-brand-gradient rounded-2xl p-6 text-white relative overflow-hidden">
      <Zap size={80} className="absolute -right-4 -bottom-4 opacity-20" />
      <p className="text-sm opacity-90">Ready for a challenge?</p>
      <h2 className="text-2xl font-bold mt-1">Play Now</h2>
      <div className="flex items-center gap-4 mt-3 text-sm opacity-90">
        <span>{attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left</span>
        <span>•</span>
        <span>{tokenCost} token{tokenCost === 1 ? "" : "s"}/play</span>
      </div>
      <Link href="/game">
        <Button
          variant="outline"
          disabled={noAttemptsLeft}
          className="mt-5 bg-white text-primary border-white hover:opacity-90 disabled:opacity-50"
        >
          {noAttemptsLeft ? "No attempts left" : "Start Playing"}
        </Button>
      </Link>
    </div>
  );
}
