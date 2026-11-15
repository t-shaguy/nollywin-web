/**
 * Shared helper for winner status formatting
 * 
 * DISBURSED status has different wording based on prize type:
 * - CASH winners: "Disbursed"
 * - ITEM winners: "Collected"
 * 
 * Used across: Winners table/cards, filters, drawer, redemptions, exports, approvals
 */

export type WinnerStatus = "SELECTED" | "REDEEMED" | "DISBURSED";
export type PrizeType = "CASH" | "ITEM";

/**
 * Get human-readable status label
 * 
 * @param status Winner status from backend
 * @param prizeType Prize type (CASH or ITEM)
 * @returns Formatted label like "Disbursed" or "Collected"
 */
export function getWinnerStatusLabel(
  status: WinnerStatus,
  prizeType: PrizeType | null | undefined
): string {
  switch (status) {
    case "SELECTED":
      return "Selected";
    case "REDEEMED":
      return "Redeemed";
    case "DISBURSED":
      // For DISBURSED, label depends on prize type
      return prizeType === "ITEM" ? "Collected" : "Disbursed";
    default:
      return status;
  }
}

/**
 * Get status label for filter options when prize type is unknown
 * Shows both possibilities for DISBURSED status
 */
export function getStatusFilterLabel(status: WinnerStatus): string {
  switch (status) {
    case "SELECTED":
      return "Selected";
    case "REDEEMED":
      return "Redeemed";
    case "DISBURSED":
      return "Disbursed / Collected";
    default:
      return status;
  }
}

/**
 * Get step label for Steps History
 * 
 * @param step Which step: "SELECTED", "REDEEMED", or "DISBURSED"
 * @param prizeType Prize type
 * @param includeDate Whether to include "on {date}" suffix
 * @param date Optional date string to append
 */
export function getStepHistoryLabel(
  step: WinnerStatus,
  prizeType: PrizeType | null | undefined,
  includeDate: boolean = false,
  date?: string | null
): string {
  let label: string;
  
  switch (step) {
    case "SELECTED":
      label = "Selected";
      break;
    case "REDEEMED":
      label = "Redeemed";
      break;
    case "DISBURSED":
      label = prizeType === "ITEM" ? "Collected" : "Disbursed";
      break;
    default:
      label = step;
  }
  
  if (includeDate && date) {
    return `${label} on ${date}`;
  }
  
  return label;
}

/**
 * Get badge CSS classes for status
 */
export function getStatusBadgeClasses(status: WinnerStatus): string {
  switch (status) {
    case "SELECTED":
      return "bg-blue-500/10 border-blue-500/30 text-blue-600";
    case "REDEEMED":
      return "bg-amber-500/10 border-amber-500/30 text-amber-600";
    case "DISBURSED":
      return "bg-green-500/10 border-green-500/30 text-green-600";
    default:
      return "bg-secondary border-border text-muted-foreground";
  }
}
