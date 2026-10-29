import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showDot?: boolean;
  className?: string;
}

// Map common backend status strings to semantic variants
function getVariantFromStatus(status: string): StatusVariant {
  const s = status.toUpperCase();
  
  // Success states
  if (['ACTIVE', 'SUCCESS', 'APPROVED'].includes(s)) {
    return 'success';
  }
  
  // Warning states
  if (['PENDING', 'PENDING_PAYMENT', 'UPCOMING'].includes(s)) {
    return 'warning';
  }
  
  // Neutral states
  if (['CLOSED', 'EXPIRED', 'HISTORICAL'].includes(s)) {
    return 'neutral';
  }
  
  // Danger states
  if (['FAILED', 'REJECTED', 'CANCELLED'].includes(s)) {
    return 'danger';
  }
  
  // Info states (rare, for draft/new)
  if (['DRAFT', 'NEW'].includes(s)) {
    return 'info';
  }
  
  // Default to neutral for unknown
  return 'neutral';
}

export function StatusBadge({ status, variant, showDot = true, className }: StatusBadgeProps) {
  const resolvedVariant = variant || getVariantFromStatus(status);
  
  // Format status text: title case with spaces
  const displayText = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  
  const variantStyles = {
    success: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]',
    info: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-border)]',
    neutral: 'bg-[var(--neutral-bg)] text-[var(--neutral)] border-[var(--neutral-border)]',
  };
  
  const dotColors = {
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
    info: 'bg-[var(--info)]',
    neutral: 'bg-[var(--neutral)]',
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
        variantStyles[resolvedVariant],
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[resolvedVariant])} />
      )}
      {displayText}
    </span>
  );
}

/**
 * Count pill component - neutral grey, never red
 * For use in "2 subs", "9 items", etc.
 */
interface CountPillProps {
  count: number;
  label?: string;
  className?: string;
}

export function CountPill({ count, label, className }: CountPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-[var(--neutral-bg)] text-[var(--neutral)] border border-[var(--neutral-border)]",
        className
      )}
    >
      {count}
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}
