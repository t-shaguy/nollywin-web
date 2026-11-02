"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getAvailablePackages, type SubscriptionPackage } from "@/lib/api/subscriptions";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { Button } from "@/components/ui/button";

// Literal hex values matching the Figma
const PINK = "#F40289";

type View = "browse" | "checkout";

export default function StorePage() {
  const queryClient = useQueryClient();
  
  const { data: packages = [], isLoading: loading } = useQuery({
    queryKey: ["subscriptions", "packages"],
    queryFn: getAvailablePackages,
  });
  
  // Get current subscription from dashboard (no additional API call needed)
  const { data: dashboard } = usePlayerDashboard();
  const currentSubscription = dashboard?.subscription?.packageName ?? null;
  
  const [selected, setSelected] = useState<SubscriptionPackage | null>(null);
  const [view, setView] = useState<View>("browse");
  const [isProcessing, setIsProcessing] = useState(false);

  const activePackages = packages.filter((p) => p.active);
  
  const price = selected?.fee ?? 0;

  const handleSelect = (item: SubscriptionPackage) => {
    setSelected(item);
  };

  const handleProceedToPayment = () => {
    if (!selected) return;
    setView("checkout");
  };

  const handleBackToBrowse = () => {
    setView("browse");
  };

  const handleConfirmPayment = async () => {
    if (!selected) return;
    
    setIsProcessing(true);
    try {
      // V37: Purchase subscription only (wallet top-up removed)
      const { purchasePackage } = await import("@/lib/api/subscriptions");
      const response = await purchasePackage({ packageId: selected.id });
      
      // Invalidate dashboard query before redirecting
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      // Redirect to Paystack authorization URL
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
        return;
      }
      
      throw new Error("No authorization URL received from server");
    } catch (error: any) {
      alert(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCheckout = () => {
    setSelected(null);
    setView("browse");
  };

  // ---- CHECKOUT VIEW ----
  if (view === "checkout" && selected) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
          <button
            onClick={handleBackToBrowse}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>

        <h1 className="text-2xl font-bold">Checkout</h1>

        {/* Order Summary */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-bold">Order Summary</h2>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Package</span>
            <span className="font-medium">{selected.name}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="font-medium">{selected.durationDays} {selected.durationDays === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Tokens</span>
            <span className="font-medium">{selected.attemptsIncluded ?? 'Unlimited'}</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between py-2">
            <span className="font-bold">Total</span>
            <span className="font-bold text-lg" style={{ color: PINK }}>₦{price.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-bold">Payment Method</h2>
          <p className="text-sm text-muted-foreground">
            You will be redirected to Paystack to complete your payment securely.
          </p>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          className="w-full justify-center text-base py-3.5"
        >
          {isProcessing ? "Processing..." : "Confirm & Pay"}
        </Button>
      </div>
    );
  }

  // ---- BROWSE VIEW ----
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Subscribe to Play</h1>
        <p className="text-muted-foreground mt-1">Choose a plan to start playing trivia and earning points.</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <>
        {currentSubscription && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Active: {currentSubscription}
            </p>
          </div>
        )}

        {/* Subscription Plans Section */}
        <div>
          <h2 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">Subscription Plans</h2>
          <div className="space-y-2">
            {activePackages.map((plan) => {
              // Determine if this is the best value (most attempts per day)
              const isBestValue = plan.name === "Monthly" || plan.durationDays === 30;
              
              return (
                <button
                  key={plan.id}
                  onClick={() => handleSelect(plan)}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all hover:border-primary ${
                    selected?.id === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">{plan.name}</p>
                      {isBestValue && (
                        <span style={{ backgroundColor: PINK, color: "#fff" }} className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Best value
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.attemptsIncluded !== null 
                        ? `${plan.attemptsIncluded} tokens / ${plan.attemptsPeriod?.toLowerCase() || 'period'}` 
                        : 'Unlimited plays'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: PINK }}>₦{plan.fee.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{plan.durationDays} {plan.durationDays === 1 ? 'day' : 'days'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="space-y-2">
          {!selected ? (
            <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground">Select a package first</p>
            </div>
          ) : (
            <Button onClick={handleProceedToPayment} className="w-full justify-center text-base py-3.5">
              Proceed to Payment
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Secure payment via Paystack
          </p>
        </div>
        </>
      )}
    </div>
  );
}
