import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

// Skeleton for loading cards
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 animate-pulse", className)}>
      <div className="space-y-3">
        <div className="h-4 bg-secondary rounded w-1/3"></div>
        <div className="h-8 bg-secondary rounded w-1/2"></div>
        <div className="h-3 bg-secondary rounded w-2/3"></div>
      </div>
    </div>
  );
}

// Skeleton for table rows
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/50 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-secondary rounded"></div>
        </td>
      ))}
    </tr>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = <Inbox size={40} className="text-muted-foreground" />,
  title = "No data",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Inline error with retry
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={cn("rounded-xl p-4 bg-[var(--danger-bg)] border border-[var(--danger-border)]", className)}>
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-[var(--danger)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--danger)] font-medium mb-1">Error</p>
          <p className="text-sm text-[var(--danger)]/90">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 px-4 py-1.5 text-sm font-medium rounded-lg bg-[var(--danger)] text-white hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn("animate-spin text-primary", className)} />;
}
