/**
 * Centralized draw action logic
 * Used by both draw list cards and draw detail view to ensure consistency
 */

export interface DrawAction {
  label: string;
  variant: "gradient" | "danger" | "secondary";
  onClick: () => void;
  disabled?: boolean;
}

export interface DrawStatus {
  status: string;
  winnersSelected: boolean;
}

export function getDrawActions(
  draw: DrawStatus,
  handlers: {
    onCloseAndSelectWinners: () => void;
    onSelectWinners: () => void;
  }
): DrawAction[] {
  const { status, winnersSelected } = draw;
  
  // ACTIVE: primary action is "Close & Select Winners"
  if (status === "ACTIVE") {
    return [
      {
        label: "Close & Select Winners",
        variant: "danger",
        onClick: handlers.onCloseAndSelectWinners,
      },
    ];
  }
  
  // CLOSED + winnersSelected=false: primary action is "Select Winners"
  if (status === "CLOSED" && !winnersSelected) {
    return [
      {
        label: "Select Winners",
        variant: "gradient",
        onClick: handlers.onSelectWinners,
      },
    ];
  }
  
  // CLOSED + winnersSelected=true: NO actions
  if (status === "CLOSED" && winnersSelected) {
    return [];
  }
  
  // Any other status: read-only, no actions
  return [];
}

export function getDrawStatusMessage(draw: DrawStatus): { show: boolean; message: string } | null {
  const { status, winnersSelected } = draw;
  
  // If CLOSED with winners selected, show a calm read-only note
  if (status === "CLOSED" && winnersSelected) {
    return {
      show: true,
      message: "Winners selected. No further actions available.",
    };
  }
  
  return null;
}
