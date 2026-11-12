/**
 * Airtime payment configuration
 * Single source of truth for the temporary hello-spin endpoint.
 * Change here when migrating to the final NCC-approved endpoints.
 */

export interface AirtimePlanConfig {
  planId: number;
  planDesc: string;
  duration: string; // Days as string
  amount: string; // Decimal string with 2 places
}

/**
 * Airtime API endpoint (server-side only)
 * Default: hello-spin temporary endpoint
 */
export const AIRTIME_API_URL = 
  process.env.AIRTIME_API_URL || 
  "https://hellospin.ng:8443/hello-spin/api/subscription/subscribe-ext";

/**
 * Plan mapping: our package name → hello-spin plan config
 * Keys match package names from GET /api/v1/subscriptions/packages (case-insensitive)
 * 
 * Provider data (confirmed):
 * - Daily: planId 57, amount "100.00", 1 entry a day
 * - Weekly: planId 58, amount "300.00" (provider bills 300), 3 entries a week
 * - Monthly: planId 59, amount "500.00" (provider bills 500), 7 entries a month
 * 
 * Note: Provider ignores the amount we send and bills its own price per planId
 */
export const AIRTIME_PLANS: Record<string, AirtimePlanConfig> = {
  daily: {
    planId: 57,
    planDesc: "DAILY ONE TIME",
    duration: "1",
    amount: "100.00",
  },
  weekly: {
    planId: 58,
    planDesc: "WEEKLY ONE TIME",
    duration: "7",
    amount: "300.00", // Provider bills 300 (3 entries a week)
  },
  monthly: {
    planId: 59,
    planDesc: "MONTHLY ONE TIME",
    duration: "30",
    amount: "500.00", // Provider bills 500 (7 entries a month)
  },
};

/**
 * Per-plan feature flags
 * Set NEXT_PUBLIC_AIRTIME_{PLAN}_ENABLED in .env to control availability
 * 
 * Current status (provider checkout page availability):
 * - Daily: Working (planId 57, /508/ checkout URL)
 * - Weekly: BROKEN at provider (/509/ returns "page not found") - disable until fixed
 * - Monthly: BROKEN at provider (/510/ returns "page not found") - disable until fixed
 */
export const AIRTIME_DAILY_ENABLED = 
  process.env.NEXT_PUBLIC_AIRTIME_DAILY_ENABLED !== "false"; // Default true

export const AIRTIME_WEEKLY_ENABLED = 
  process.env.NEXT_PUBLIC_AIRTIME_WEEKLY_ENABLED === "true"; // Default false (provider checkout broken)

export const AIRTIME_MONTHLY_ENABLED = 
  process.env.NEXT_PUBLIC_AIRTIME_MONTHLY_ENABLED === "true"; // Default false (provider checkout broken)

/**
 * Supported networks (only MTN is documented)
 */
export const AIRTIME_NETWORKS = ["MTN"] as const;

/**
 * Get plan config by package name (case-insensitive lookup)
 */
export function getAirtimePlan(packageName: string): AirtimePlanConfig | undefined {
  const normalized = packageName.toLowerCase();
  return AIRTIME_PLANS[normalized];
}

/**
 * Check if a package supports airtime payment
 */
export function supportsAirtime(packageName: string): boolean {
  return getAirtimePlan(packageName) !== undefined;
}

/**
 * Check if airtime is available for a specific package
 * Each plan has its own feature flag
 */
export function isAirtimeAvailable(packageName: string): boolean {
  const plan = getAirtimePlan(packageName);
  if (!plan) return false;
  
  const normalized = packageName.toLowerCase();
  
  if (normalized === "daily") {
    return AIRTIME_DAILY_ENABLED;
  }
  
  if (normalized === "weekly") {
    return AIRTIME_WEEKLY_ENABLED;
  }
  
  if (normalized === "monthly") {
    return AIRTIME_MONTHLY_ENABLED;
  }
  
  return false;
}

/**
 * Get airtime plan by package ID
 * Looks up package name from ID, then returns airtime config
 */
export function getAirtimePlanByPackageId(packageId: number): AirtimePlanConfig | undefined {
  // Map package IDs to names (from existing packages in the system)
  // These IDs come from GET /api/v1/subscriptions/packages
  const packageIdToName: Record<number, string> = {
    1: "daily",
    2: "weekly",
    3: "monthly",
  };
  
  const packageName = packageIdToName[packageId];
  return packageName ? getAirtimePlan(packageName) : undefined;
}

/**
 * Check if a specific plan's airtime is enabled
 */
export function isPlanAirtimeEnabled(packageName: string): boolean {
  return isAirtimeAvailable(packageName);
}
