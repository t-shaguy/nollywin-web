"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getAvailablePackages, getMySubscriptions, type SubscriptionPackage } from "@/lib/api/subscriptions";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { Button } from "@/components/ui/button";
import { canBuyPlan, formatPlanAllowance, formatExpiryDate } from "@/lib/utils/subscription-helpers";
import { type PlayerDashboard } from "@/lib/api/auth";

// Literal hex values matching the Figma
const PINK = "#F40289";

type View = "browse" | "checkout";

// Current Plan Card Component
function CurrentPlanCard({ 
  dashboard, 
  packages 
}: { 
  dashboard: PlayerDashboard;
  packages: SubscriptionPackage[];
}) {
  // Fetch user subscriptions to get start date
  const { data: userSubscriptions } = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: () => getMySubscriptions(),
    staleTime: 5 * 60_000, // 5 minutes
    enabled: !!dashboard.subscription, // Only fetch if there's an active subscription
  });

  // Find the matching subscription entry
  const currentSub = userSubscriptions?.find(
    (sub) => sub.packageName === dashboard.subscription?.packageName
  );

  // Determine start date
  let startDate: string | null = null;
  let startDateDerived = false;

  if (currentSub?.startsAt) {
    // Use actual start date from API
    startDate = currentSub.startsAt;
  } else if (dashboard.subscription?.expiresAt) {
    // Derive from expiry - durationDays
    const matchingPackage = packages.find(
      (pkg) => pkg.name === dashboard.subscription?.packageName
    );
    if (matchingPackage?.durationDays) {
      const expiryDate = new Date(dashboard.subscription.expiresAt);
      const derivedStart = new Date(expiryDate);
      derivedStart.setDate(derivedStart.getDate() - matchingPackage.durationDays);
      startDate = derivedStart.toISOString();
      startDateDerived = true;
    }
  }

  // Calculate days left (calendar days in Africa/Lagos)
  const getDaysLeft = (expiryDateStr: string): number | null => {
    try {
      const now = new Date();
      const expiry = new Date(expiryDateStr);
      
      // Convert both to Africa/Lagos timezone
      const nowLagos = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
      const expiryLagos = new Date(expiry.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
      
      // Calculate difference in days
      const diffTime = expiryLagos.getTime() - nowLagos.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    } catch {
      return null;
    }
  };

  const daysLeft = dashboard.subscription?.expiresAt 
    ? getDaysLeft(dashboard.subscription.expiresAt) 
    : null;

  return (
    <div className="border border-border rounded-lg p-5 space-y-3">
      <h2 className="font-bold text-lg">Your Current Plan</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Plan</span>
          <span className="font-medium">{dashboard.subscription?.packageName}</span>
        </div>
        {startDate && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Subscribed on</span>
            <span className="font-medium">{formatExpiryDate(startDate)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Tokens left</span>
          <span className="font-medium">
            {dashboard.tokensLeft === null 
              ? "Unlimited" 
              : `${dashboard.tokensLeft} token${dashboard.tokensLeft === 1 ? '' : 's'}`
            }
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Expires on</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatExpiryDate(dashboard.subscription?.expiresAt)}</span>
            {daysLeft !== null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          You can buy another plan once you've used all your plays or this plan expires.
        </p>
      </div>
    </div>
  );
}

export default function StorePage() {
  const queryClient = useQueryClient();
  
  const { data: packages = [], isLoading: loading } = useQuery({
    queryKey: ["subscriptions", "packages"],
    queryFn: getAvailablePackages,
  });
  
  // Get current subscription from dashboard (source of truth)
  const { data: dashboard } = usePlayerDashboard();
  
  const [selected, setSelected] = useState<SubscriptionPackage | null>(null);
  const [view, setView] = useState<View>("browse");
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const activePackages = packages.filter((p) => p.active);
  
  const price = selected?.fee ?? 0;
  
  // Check if user can buy a new plan (one-active-plan rule)
  const buyCheck = canBuyPlan(dashboard);
  const canBuy = buyCheck.allowed;
  const blockReason = buyCheck.reason;
  
  // Check if plan exists with 0 plays left (show note, keep enabled)
  const hasUsedUpPlan = dashboard?.hasActiveSubscription && dashboard?.tokensLeft === 0;

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
    
    // Guard: re-check if user can still buy (stale page, another tab)
    const recheckBuy = canBuyPlan(dashboard);
    if (!recheckBuy.allowed) {
      setBackendError(recheckBuy.reason || "You cannot purchase a plan at this time.");
      setView("browse");
      return;
    }
    
    setIsProcessing(true);
    setBackendError(null);
    
    try {
      // V37: Purchase subscription only (wallet top-up removed)
      const { purchasePackage } = await import("@/lib/api/subscriptions");
      const response = await purchasePackage({ packageId: selected.id });
      
      // Invalidate dashboard and draws queries before redirecting
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["draws", "active"] });
      
      // Redirect to Paystack authorization URL
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
        return;
      }
      
      throw new Error("No authorization URL received from server");
    } catch (error: any) {
      // Handle backend rejection (4xx response)
      const errorMessage = error.message || "Payment failed. Please try again.";
      setBackendError(errorMessage);
      
      // Refresh dashboard to get latest state
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      // Return to browse view
      setView("browse");
      setSelected(null);
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
            <span className="text-sm text-muted-foreground">Details</span>
            <span className="font-medium text-sm">{formatPlanAllowance(selected)}</span>
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
        {/* Backend error message (4xx rejection) */}
        {backendError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {backendError}
              </p>
            </div>
          </div>
        )}

        {/* Current plan card (when NOT allowed to buy) */}
        {!canBuy && dashboard?.subscription && (
          <CurrentPlanCard 
            dashboard={dashboard} 
            packages={packages}
          />
        )}

        {/* Used up plan note (when allowed but plan exists with 0 plays) */}
        {canBuy && hasUsedUpPlan && dashboard?.subscription && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              You've used all plays in your {dashboard.subscription.packageName} plan.
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
                  onClick={() => canBuy && handleSelect(plan)}
                  disabled={!canBuy}
                  aria-disabled={!canBuy}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all ${
                    !canBuy 
                      ? "opacity-50 cursor-not-allowed border-border"
                      : selected?.id === plan.id
                        ? "border-primary bg-primary/5 hover:border-primary"
                        : "border-border hover:border-primary"
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
                      {formatPlanAllowance(plan)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: PINK }}>₦{plan.fee.toLocaleString()}</p>
                    {!canBuy && (
                      <p className="text-xs text-muted-foreground">Current plan active</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="space-y-2">
          {!canBuy ? (
            <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground">{blockReason}</p>
            </div>
          ) : !selected ? (
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
