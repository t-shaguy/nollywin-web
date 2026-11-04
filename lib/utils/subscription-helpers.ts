/**
 * Subscription helpers for one-active-plan rule enforcement
 */

import { type PlayerDashboard } from "@/lib/api/auth";
import { type SubscriptionPackage } from "@/lib/api/subscriptions";

export interface CanBuyPlanResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Determine if a player can buy a new plan based on dashboard data
 * 
 * Rules (backend/product decision):
 * - One active plan at a time
 * - Can buy when: no plan, plan expired, or plan used up (tokensLeft === 0)
 * - Cannot buy when: payment pending, or active plan with plays left (tokensLeft > 0 or null)
 * 
 * Source of truth: dashboard (NOT /subscriptions/me which mislabels expired plans)
 */
export function canBuyPlan(dashboard: PlayerDashboard | undefined | null): CanBuyPlanResult {
  if (!dashboard) {
    return { allowed: true }; // No dashboard data yet, allow UI to show
  }

  // Payment pending - block purchase
  if (dashboard.subscriptionPaymentPending) {
    return {
      allowed: false,
      reason: "Your payment is still being confirmed.",
    };
  }

  // Active plan exists
  if (dashboard.hasActiveSubscription) {
    // Unlimited plan (tokensLeft === null) - block purchase
    if (dashboard.tokensLeft === null) {
      return {
        allowed: false,
        reason: `You have an active ${dashboard.subscription?.packageName || 'plan'} with unlimited plays.`,
      };
    }

    // Plan with plays left (tokensLeft > 0) - block purchase
    if (dashboard.tokensLeft > 0) {
      return {
        allowed: false,
        reason: `You have ${dashboard.tokensLeft} play${dashboard.tokensLeft === 1 ? '' : 's'} remaining in your ${dashboard.subscription?.packageName || 'current plan'}.`,
      };
    }

    // Plan with 0 plays left - allow purchase (plan is used up)
    // Fall through to allowed: true
  }

  // No active plan, or plan is used up (tokensLeft === 0)
  return { allowed: true };
}

/**
 * Format plan allowance text for display
 * 
 * Shows: "{n} play(s) or {durationDays} day(s), whichever comes first"
 * When attemptsIncluded is null, shows only duration (not confirmed as unlimited)
 * 
 * This is a one-line change later if backend confirms null means unlimited.
 */
export function formatPlanAllowance(pkg: SubscriptionPackage): string {
  if (pkg.attemptsIncluded === null) {
    // Don't claim "Unlimited" - show only duration
    return `${pkg.durationDays} day${pkg.durationDays === 1 ? '' : 's'}`;
  }

  return `${pkg.attemptsIncluded} play${pkg.attemptsIncluded === 1 ? '' : 's'} or ${pkg.durationDays} day${pkg.durationDays === 1 ? '' : 's'}, whichever comes first`;
}

/**
 * Format date as DD MMM YYYY in Africa/Lagos timezone
 */
export function formatExpiryDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";

  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    }).format(date);
  } catch {
    return "—";
  }
}
