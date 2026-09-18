import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanId = "daily" | "weekly" | "monthly";

interface PlanMeta {
  name: string;
  durationDays: number;
}

const PLAN_META: Record<PlanId, PlanMeta> = {
  daily: { name: "Daily Plan", durationDays: 1 },
  weekly: { name: "Weekly Plan", durationDays: 7 },
  monthly: { name: "Monthly Plan", durationDays: 30 },
};

interface SubscriptionState {
  hasActivePlan: boolean;
  planId: PlanId | null;
  planName: string | null;
  expiresAt: string | null;
  isLoading: boolean;
  setSubscription: (subscription: { planId: PlanId; planName: string; expiresAt: string } | null) => void;
  setLoading: (loading: boolean) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      hasActivePlan: false,
      planId: null,
      planName: null,
      expiresAt: null,
      isLoading: false,

      setSubscription: (subscription) => {
        if (subscription) {
          set({
            hasActivePlan: true,
            planId: subscription.planId,
            planName: subscription.planName,
            expiresAt: subscription.expiresAt,
            isLoading: false,
          });
        } else {
          set({
            hasActivePlan: false,
            planId: null,
            planName: null,
            expiresAt: null,
            isLoading: false,
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      clearSubscription: () => set({
        hasActivePlan: false,
        planId: null,
        planName: null,
        expiresAt: null,
      }),
    }),
    { name: "nollywin-subscription" }
  )
);

/**
 * Fetch user's subscription status from the API
 * Call this on login or when subscription status needs to be refreshed
 */
export async function fetchSubscriptionStatus() {
  try {
    const { getMySubscriptions } = await import("@/lib/api/payments");
    useSubscriptionStore.getState().setLoading(true);
    
    const response = await getMySubscriptions();
    
    // Check if there's an active subscription
    const activeSubscription = response.activeSubscription || 
      response.subscriptions?.find((sub) => sub.status === "ACTIVE");
    
    if (activeSubscription) {
      useSubscriptionStore.getState().setSubscription({
        planId: activeSubscription.packageId,
        planName: activeSubscription.planName,
        expiresAt: new Date(activeSubscription.expiryDate).toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        }),
      });
    } else {
      useSubscriptionStore.getState().setSubscription(null);
    }
    
    return response;
  } catch (error) {
    useSubscriptionStore.getState().setLoading(false);
    console.error("Failed to fetch subscription status:", error);
    throw error;
  }
}
