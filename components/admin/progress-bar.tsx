import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  successValue?: number;
  failureValue?: number;
  className?: string;
  showPercentage?: boolean;
}

// Stacked bar showing success/failure proportions
export function StackedProgressBar({
  successValue = 0,
  failureValue = 0,
  max,
  className,
}: {
  successValue?: number;
  failureValue?: number;
  max: number;
  className?: string;
}) {
  const total = successValue + failureValue;
  const successPercent = max > 0 ? (successValue / max) * 100 : 0;
  const failurePercent = max > 0 ? (failureValue / max) * 100 : 0;
  
  return (
    <div className={cn("h-2 w-full bg-secondary rounded-full overflow-hidden flex", className)}>
      {successValue > 0 && (
        <div
          className="bg-[var(--success)] transition-all"
          style={{ width: `${successPercent}%` }}
        />
      )}
      {failureValue > 0 && (
        <div
          className="bg-[var(--danger)] transition-all"
          style={{ width: `${failurePercent}%` }}
        />
      )}
    </div>
  );
}

// Simple single-value progress bar
export function ProgressBar({ value, max, className, showPercentage = false }: ProgressBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 flex-1 bg-secondary rounded-full overflow-hidden", className)}>
        <div
          className="h-full bg-primary transition-all rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
          {percent.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
