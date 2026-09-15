"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/store/subscription-store";
import { CheckoutModal } from "./checkout-modal";
import type { Package } from "@/store/packages-store";

export function PlanCard({ plan }: { plan: Package }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const hasActivePlan = useSubscriptionStore((s) => s.hasActivePlan);

  const handleClick = () => {
    setShowCheckout(true);
  };

  return (
    <>
      <div
        className={`rounded-2xl p-6 text-center flex flex-col items-center ${
          plan.mostPopular ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
        }`}
      >
        {plan.mostPopular && (
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full -mt-9 mb-4">
            Most Popular
          </span>
        )}
        <Star size={28} className={plan.mostPopular ? "text-primary fill-primary" : "text-muted-foreground"} />
        <p className="font-bold text-lg mt-4">{plan.name}</p>
        <p className="text-2xl font-extrabold mt-2 line-through decoration-2">{plan.price}</p>
        <Button
          onClick={handleClick}
          variant={plan.mostPopular ? "gradient" : "outline"}
          className="w-full justify-center mt-6"
        >
          {hasActivePlan ? "Extend Plan" : "Subscribe Now"}
        </Button>
      </div>

      <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} plan={plan} />
    </>
  );
}
