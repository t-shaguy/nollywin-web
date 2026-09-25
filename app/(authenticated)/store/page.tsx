"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription-store";
import { usePackagesStore } from "@/store/packages-store";
import { type SubscriptionPackage } from "@/lib/api/subscriptions";
import { useTokenPackagesStore, type TokenPackage } from "@/store/token-packages-store";
import { useWalletStore } from "@/store/wallet-store";
import { Button } from "@/components/ui/button";

// Literal hex values matching the Figma — see earlier fix notes: the
// shared Badge component overrides custom bg-* classes, so these two
// pills stay as plain styled spans rather than <Badge>.
const PINK = "#F40289";
const RED = "#FC0D28";

type SelectedItem = 
  | { type: "subscription"; item: SubscriptionPackage }
  | { type: "tokens"; item: TokenPackage }
  | null;

// "browse" = the plan/token grid, with a "Proceed to Payment" button
// once something's selected. Clicking that REPLACES the whole view
// with "checkout" — a distinct screen (with its own Back button) that
// shows Order Summary + Payment Method together, matching the Figma
// exactly. It is not a section stacked below the plan grid.
type View = "browse" | "checkout" | "success";

export default function StorePage() {
  const { setSubscription } = useSubscriptionStore();
  const { packages, loading, error: packagesError } = usePackagesStore();
  const tokenPackages = useTokenPackagesStore((s) => s.packages);
  const { tokens } = useWalletStore();
  
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [view, setView] = useState<View>("browse");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);

  // Load current active subscription on mount
  useEffect(() => {
    async function loadCurrentSubscription() {
      try {
        const { getMySubscriptions } = await import("@/lib/api/subscriptions");
        const subs = await getMySubscriptions("ACTIVE");
        if (subs.length > 0) {
          setCurrentSubscription(subs[0].packageName);
        }
      } catch (err) {
        console.error("Failed to load current subscription:", err);
      }
    }
    loadCurrentSubscription();
  }, []);

  const activePackages = packages.filter((p) => p.active);
  
  const price = selected 
    ? selected.type === "subscription" 
      ? (selected.item as SubscriptionPackage).fee 
      : (selected.item as TokenPackage).price
    : 0;

  const handleSelect = (type: "subscription" | "tokens", item: SubscriptionPackage | TokenPackage) => {
    setSelected({ type, item } as SelectedItem);
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
      if (selected.type === "subscription") {
        // Purchase subscription using real UUID packageId
        const { purchasePackage } = await import("@/lib/api/subscriptions");
        const response = await purchasePackage({ packageId: selected.item.id });
        
        // Redirect to Paystack authorization URL
        if (response.authorizationUrl) {
          window.location.href = response.authorizationUrl;
          return;
        }
        
        throw new Error("No authorization URL received from server");
      } else {
        // Top up tokens - initiate payment
        const { initiatePayment } = await import("@/lib/api/payments");
        const response = await initiatePayment({
          amount: selected.item.price,
          purpose: "WALLET_TOPUP",
        });
        
        // Redirect to Paystack checkout
        if (response.authorizationUrl) {
          window.location.href = response.authorizationUrl;
          return;
        }
        
        throw new Error("Payment initiation failed - no authorization URL received");
      }
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

  // ---- CHECKOUT VIEW — full replacement screen, not a section on the browse page ----
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

          <div className="space-y-5">
            {/* Order Summary */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Package</span>
                  <span className="text-muted-foreground">Value</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total</span>
                  <span className="font-bold text-2xl" style={{ color: PINK }}>₦{price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</h3>
              <p className="text-sm text-muted-foreground">
                You'll choose exactly how to pay — card, bank transfer, USSD, or airtime — on the next secure screen.
              </p>
            </div>

            {/* Confirm Payment Button */}
            <div className="space-y-2">
              <Button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full justify-center text-base py-3.5"
              >
                {isProcessing ? "Processing..." : `Confirm Payment · ₦${price.toLocaleString()}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your payment is secured and encrypted
              </p>
            </div>
          </div>
        </div>
    );
  }

  // ---- SUCCESS VIEW ----
  if (view === "success" && selected) {
    return (
      <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selected.type === "subscription"
                  ? `You're now subscribed to ${selected.item.name}`
                  : `Tokens added to your account`}
              </p>
            </div>
            <Button onClick={resetCheckout} className="w-full justify-center">
              Continue Shopping
            </Button>
          </div>
        </div>
    );
  }

  // ---- BROWSE VIEW (default) ----
  return (
    <div className="space-y-8 max-w-lg mx-auto">
        {/* Loading state */}
        {loading && (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading subscription packages...</p>
          </div>
        )}

        {/* Error state */}
        {packagesError && !loading && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Error Loading Packages</h3>
              <p className="text-sm text-muted-foreground mt-2">{packagesError}</p>
            </div>
          </div>
        )}

        {/* Packages loaded */}
        {!loading && !packagesError && (
        <>
        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="text-sm font-medium">
              <span className="text-muted-foreground">Currently on: </span>
              <span className="text-primary font-bold">{currentSubscription}</span>
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
                  onClick={() => handleSelect("subscription", plan)}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all hover:border-primary ${
                    selected?.type === "subscription" && selected.item.id === plan.id
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
                    <p className="text-xs text-muted-foreground">{plan.attemptsIncluded} {plan.attemptsIncluded === 1 ? 'attempt' : 'attempts'} / {plan.attemptsPeriod.toLowerCase()}</p>
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

        {/* Token Top-Up Section */}
        <div>
          <h2 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">
            Token Top-Up · 1 Token = 1 Play
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {tokenPackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelect("tokens", pkg)}
                className={`relative px-4 py-3 border rounded-lg transition-all hover:border-primary text-left ${
                  selected?.type === "tokens" && selected.item.id === pkg.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                {pkg.popular && (
                  <span style={{ backgroundColor: RED, color: "#fff" }} className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <p className="text-sm text-muted-foreground mb-1">{pkg.name}</p>
                {pkg.tokensEstimate && (
                  <>
                    <p className="text-2xl font-extrabold leading-none mb-1">{pkg.tokensEstimate}</p>
                    <p className="text-xs text-muted-foreground mb-2">Approximate tokens</p>
                  </>
                )}
                <p className="font-bold text-sm" style={{ color: PINK }}>₦{pkg.price.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar — "Select a package first" or "Proceed to Payment" once something's chosen */}
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
            Mobile: USSD / airtime billing · Web: card payment
          </p>
        </div>
        </>
        )}
      </div>
  );
}