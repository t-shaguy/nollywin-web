/**
 * Shared Status Badge Component
 * 
 * Unified status colours across the admin:
 * - Red: reserved for rejected, failed, destructive only
 * - Green: success, active, approved, paid
 * - Amber: pending, redeemed, awaiting
 * - Blue: selected, info
 * - Violet: awaiting approval
 * - Grey: neutral, expired, closed
 */

import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, AlertCircle, Package, Banknote } from "lucide-react";

type StatusType = 
  // Winner statuses
  | "SELECTED" | "REDEEMED" | "DISBURSED"
  // Subscription statuses
  | "ACTIVE" | "EXPIRED" | "PENDING_PAYMENT"
  // Draw statuses  
  | "UPCOMING" | "CLOSED" | "CANCELLED"
  // Approval statuses
  | "PENDING" | "APPROVED" | "REJECTED"
  // Prize types
  | "CASH" | "ITEM";

interface StatusConfig {
  label: string;
  className: string;
  icon?: React.ReactNode;
  dot?: boolean;
}

const STATUS_MAP: Record<StatusType, StatusConfig> = {
  // Winner statuses
  SELECTED: {
    label: "Selected",
    className: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    dot: true
  },
  REDEEMED: {
    label: "Redeemed",
    className: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    dot: true
  },
  DISBURSED: {
    label: "Paid", // Will be overridden for ITEM type
    className: "bg-green-500/10 border-green-500/30 text-green-600",
    dot: true
  },
  
  // Subscription statuses
  ACTIVE: {
    label: "Active",
    className: "bg-green-500/10 border-green-500/30 text-green-600",
    icon: <CheckCircle2 size={12} />,
    dot: false
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-secondary border-border text-muted-foreground",
    icon: <XCircle size={12} />,
    dot: false
  },
  PENDING_PAYMENT: {
    label: "Pending payment",
    className: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    icon: <Clock size={12} />,
    dot: false
  },
  
  // Draw statuses
  UPCOMING: {
    label: "Upcoming",
    className: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    dot: true
  },
  CLOSED: {
    label: "Closed",
    className: "bg-secondary border-border text-muted-foreground",
    dot: true
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500/10 border-red-500/30 text-red-600",
    icon: <XCircle size={12} />,
    dot: false
  },
  
  // Approval statuses
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    icon: <Clock size={12} />,
    dot: false
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-500/10 border-green-500/30 text-green-600",
    icon: <CheckCircle2 size={12} />,
    dot: false
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/10 border-red-500/30 text-red-600",
    icon: <XCircle size={12} />,
    dot: false
  },
  
  // Prize types (neutral)
  CASH: {
    label: "Cash",
    className: "bg-transparent border-border text-foreground",
    icon: <Banknote size={12} />,
    dot: false
  },
  ITEM: {
    label: "Item",
    className: "bg-transparent border-border text-foreground",
    icon: <Package size={12} />,
    dot: false
  }
};

interface StatusBadgeProps {
  status: StatusType | string;
  prizeType?: "CASH" | "ITEM"; // For DISBURSED label override
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, prizeType, className, size = "md" }: StatusBadgeProps) {
  // Handle unknown statuses gracefully
  const statusUpper = status.toUpperCase() as StatusType;
  let config = STATUS_MAP[statusUpper];
  
  if (!config) {
    // Fallback for unknown statuses
    config = {
      label: status,
      className: "bg-secondary border-border text-muted-foreground",
      dot: true
    };
  }
  
  // Override DISBURSED label based on prize type
  let label = config.label;
  if (statusUpper === "DISBURSED" && prizeType) {
    label = prizeType === "CASH" ? "Paid" : "Collected";
  }
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium whitespace-nowrap",
      size === "sm" ? "text-xs" : "text-xs",
      config.className,
      className
    )}>
      {config.icon ? (
        config.icon
      ) : config.dot ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      ) : null}
      {label}
    </span>
  );
}

/**
 * Awaiting approval chip (violet with clock icon)
 */
export function AwaitingApprovalBadge({ 
  action,
  className 
}: { 
  action: "REDEEM" | "FULFIL" | string;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
      "bg-violet-500/10 border-violet-500/30 text-violet-600",
      className
    )}>
      <Clock size={12} />
      {action} pending
    </span>
  );
}

/**
 * Type badge for prize types (neutral outlined)
 */
export function TypeBadge({ type, className }: { type: "CASH" | "ITEM"; className?: string }) {
  return <StatusBadge status={type} className={className} />;
}
