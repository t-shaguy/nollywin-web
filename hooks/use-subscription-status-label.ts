/**
 * Unified hook for getting subscription status label
 * Used by top bar, home header, and Store page
 * 
 * Priority:
 * 1. Payment pending (if subscriptionPaymentPending: true)
 * 2. No plan (if no active subscription)
 * 3. No tokens left (if tokensLeft === 0)
 * 4. N tokens left (if tokensLeft > 0)
 * 5. Unlimited (if tokensLeft === null)
 */

export interface SubscriptionStatusLabelProps {
  hasActiveSubscription: boolean;
  tokensLeft: number | null; // null = unlimited, 0 = no tokens, N = tokens remaining
  subscriptionPaymentPending: boolean;
}

export interface SubscriptionStatusLabel {
  text: string;
  variant: "pending" | "subscribe" | "disabled" | "enabled";
  disabled: boolean;
}

export function useSubscriptionStatusLabel({
  hasActiveSubscription,
  tokensLeft,
  subscriptionPaymentPending,
}: SubscriptionStatusLabelProps): SubscriptionStatusLabel {
  // Priority 1: Payment pending
  if (subscriptionPaymentPending) {
    return {
      text: "Payment pending",
      variant: "pending",
      disabled: false, // Don't hard-disable; let user try again
    };
  }
  
  // Priority 2: No plan
  if (!hasActiveSubscription) {
    return {
      text: "Subscribe",
      variant: "subscribe",
      disabled: false,
    };
  }
  
  // Priority 3: No tokens left
  if (tokensLeft === 0) {
    return {
      text: "No tokens left",
      variant: "disabled",
      disabled: true,
    };
  }
  
  // Priority 4: N tokens left
  if (tokensLeft !== null) {
    return {
      text: `${tokensLeft} token${tokensLeft === 1 ? "" : "s"} left`,
      variant: "enabled",
      disabled: false,
    };
  }
  
  // Priority 5: Unlimited
  return {
    text: "Unlimited",
    variant: "enabled",
    disabled: false,
  };
}
