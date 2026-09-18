"use client";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function DashboardHeader({
  attemptsLeft,
  tokenCost,
}: {
  attemptsLeft: number;
  tokenCost: number;
}) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName ?? "Player";
  const noAttemptsLeft = attemptsLeft <= 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">Here is your progress this week.</p>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-1.5">
        <Link href="/game">
          <Button disabled={noAttemptsLeft} className="disabled:opacity-50">
            <Play size={18} />
            {noAttemptsLeft ? "No attempts left" : "Start Playing"}
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left • {tokenCost} token{tokenCost === 1 ? "" : "s"}/play
        </p>
      </div>
    </div>
  );
}
