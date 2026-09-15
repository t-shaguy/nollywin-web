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
  subscribe: (planId: PlanId) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      // TODO: replace with GET /users/subscription once the backend is live.
      hasActivePlan: false,
      planId: null,
      planName: null,
      expiresAt: null,

      subscribe: (planId) => {
        // TODO: replace with POST /subscriptions once the backend + payment gateway exist.
        // Frontend-only simulation for now — instantly "activates" the plan so the full
        // flow (Store -> Dashboard -> Play Trivia gate) can be tested end-to-end without
        // a real charge happening.
        const meta = PLAN_META[planId];
        const expires = new Date();
        expires.setDate(expires.getDate() + meta.durationDays);
        set({
          hasActivePlan: true,
          planId,
          planName: meta.name,
          expiresAt: expires.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        });
      },
    }),
    { name: "nollywin-subscription" } // localStorage key
  )
);
