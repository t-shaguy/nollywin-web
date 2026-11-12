"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { getAvailablePackages, getMySubscriptions, type SubscriptionPackage } from "@/lib/api/subscriptions";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { canBuyPlan, formatPlanAllowance, formatExpiryDate } from "@/lib/utils/subscription-helpers";
import { type PlayerDashboard } from "@/lib/api/auth";
import { AirtimePaymentModal } from "@/app/features/store/presentation/airtime-payment-modal";
import { PendingPaymentBanner } from "@/components/pending-payment-banner";
import { getAirtimePlan, isPlanAirtimeEnabled } from "@/lib/airtime/config";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getPaymentStarted,
  clearPaymentStarted,
  savePaymentStarted,
  formatTimeAgo,
} from "@/lib/utils/payment-state";

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
    <div className="border border-border rounded-lg p-4 md:p-5 space-y-3">
      <h2 className="font-bold text-base sm:text-lg">Your Current Plan</h2>
      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">Plan</span>
          <span className="font-medium text-xs sm:text-sm text-right truncate">{dashboard.subscription?.packageName}</span>
        </div>
        {startDate && (
          <div className="flex justify-between gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground">Subscribed on</span>
            <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{formatExpiryDate(startDate)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">Tokens left</span>
          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
            {dashboard.tokensLeft === null 
              ? "Unlimited" 
              : `${dashboard.tokensLeft} token${dashboard.tokensLeft === 1 ? '' : 's'}`
            }
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">Expires on</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{formatExpiryDate(dashboard.subscription?.expiresAt)}</span>
            {daysLeft !== null && (
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
                {daysLeft === 0 ? "Today" : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="pt-2 border-t border-border">
        <p className="text-xs sm:text-sm text-muted-foreground">
          You can buy another plan once you&apos;ve used all your plays or this plan expires.
        </p>
      </div>
    </div>
  );
}

export default function StorePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  
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
  const [paymentMethod, setPaymentMethod] = useState<"airtime" | "ussd" | "card" | null>(null);
  
  // Airtime modal state
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  
  // Payment pending state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckCooldown, setStatusCheckCooldown] = useState(false);
  const [statusCheckMessage, setStatusCheckMessage] = useState<string | null>(null);
  
  // Get payment started record
  const paymentStarted = dashboard?.subscriptionPaymentPending ? getPaymentStarted() : null;

  const activePackages = packages
    .filter((p) => p.active)
    .sort((a, b) => a.durationDays - b.durationDays); // Sequential: Daily → Weekly → Monthly
  
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
  
  const handleAirtimeClick = () => {
    setShowAirtimeModal(true);
  };
  
  const handleAirtimeSuccess = () => {
    setShowAirtimeModal(false);
    // Invalidate queries to refresh subscription status
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  };
  
  const handleRefreshStatus = () => {
    // Invalidate dashboard and subscriptions to trigger fresh data fetch
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  };

  const handleProceedToPayment = () => {
    if (!selected) return;
    setView("checkout");
  };

  const handleBackToBrowse = () => {
    setView("browse");
    setPaymentMethod(null);
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusCheckMessage(null);
    
    // Invalidate and refetch dashboard
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.refetchQueries({ queryKey: ["dashboard"] });
    
    setIsCheckingStatus(false);
    
    // Check if still pending
    const updatedDashboard = queryClient.getQueryData<PlayerDashboard>(["dashboard"]);
    
    if (!updatedDashboard?.subscriptionPaymentPending) {
      // Payment cleared! Clear saved record
      clearPaymentStarted();
      setStatusCheckMessage(null);
    } else {
      // Still pending
      setStatusCheckMessage("Still pending");
      
      // Set cooldown (10 seconds)
      setStatusCheckCooldown(true);
      setTimeout(() => {
        setStatusCheckCooldown(false);
      }, 10000);
    }
  };

  const handleStartNewPayment = () => {
    // Show confirm dialog
    setShowConfirmDialog(true);
    setConfirmDialogMessage("");
  };

  const handleConfirmPayAgain = async () => {
    await proceedWithPayment();
  };

  const proceedWithPayment = async () => {
    if (!selected) return;
    
    setIsProcessing(true);
    setBackendError(null);
    setConfirmDialogMessage("");
    setShowConfirmDialog(false);
    
    try {
      // Save payment-started record before redirecting
      savePaymentStarted({
        packageName: selected.name,
        startedAt: Date.now(),
      });
      
      // V37: Purchase subscription only (wallet top-up removed)
      const { purchasePackage } = await import("@/lib/api/subscriptions");
      const response = await purchasePackage({ packageId: selected.id });
      
      // Update saved record with reference if available
      if (response.reference) {
        savePaymentStarted({
          packageName: selected.name,
          startedAt: Date.now(),
          reference: response.reference,
        });
      }
      
      // Invalidate dashboard and draws queries before redirecting
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["draws", "active"] });
      
      // Redirect to Paystack authorization URL
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
        return;
      }
      
      throw new Error("No authorization URL received from server");
    } catch (error: unknown) {
      // Handle backend rejection (4xx response)
      const errorMessage = (error as Error).message || "Payment failed. Please try again.";
      
      // If showing confirm dialog, update its message
      if (showConfirmDialog) {
        setConfirmDialogMessage(errorMessage);
      } else {
        setBackendError(errorMessage);
        // Return to browse view
        setView("browse");
        setSelected(null);
      }
      
      // Refresh dashboard to get latest state
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleConfirmPayment = async () => {
    if (!selected) return;
    
    // If payment is pending, show confirm dialog
    if (dashboard?.subscriptionPaymentPending) {
      setShowConfirmDialog(true);
      setConfirmDialogMessage("");
      return;
    }
    
    // Proceed with payment
    await proceedWithPayment();
  };

  // ---- CHECKOUT VIEW ----
  const airtimePlan = selected ? getAirtimePlan(selected.name) : undefined;
  const hasAirtime = !!airtimePlan;
  const airtimeEnabled = selected ? isPlanAirtimeEnabled(selected.name) : false;
  const showAirtimeOption = hasAirtime && airtimeEnabled;
  
  const checkoutView = view === "checkout" && selected ? (
    <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto">
      <button
        onClick={handleBackToBrowse}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm min-h-[36px]"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Order Summary */}
      <div className="border border-border rounded-lg p-3 md:p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Order Summary</h2>
          <div className="flex justify-between items-center gap-3">
            <span className="text-xs text-muted-foreground">Package</span>
            <span className="text-xs font-medium text-right">{selected.name} ({formatPlanAllowance(selected).toLowerCase()})</span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm font-bold">Total</span>
            <span className="text-lg font-bold whitespace-nowrap text-[var(--color-brand)]">₦{price.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment Method</h2>
          
          {/* Row 1: Airtime (full width) */}
          {showAirtimeOption ? (
            <button
              onClick={() => setPaymentMethod("airtime")}
              className={`w-full rounded-lg p-3 flex items-center gap-3 transition-colors ${
                paymentMethod === "airtime"
                  ? "border-2 border-primary bg-primary/5"
                  : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-brand)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">Pay with Airtime</p>
                <p className="text-xs text-muted-foreground">Deducted from your airtime balance</p>
              </div>
              {paymentMethod === "airtime" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-brand)]">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ) : hasAirtime ? (
            <button
              disabled
              className="w-full rounded-lg p-3 flex items-center gap-3 border border-border bg-secondary/30 opacity-50 cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">Pay with Airtime</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </button>
          ) : null}
          
          {/* Row 2: USSD and Card (2 columns) */}
          <div className="grid grid-cols-2 gap-2">
            {/* USSD Code */}
            <button
              disabled
              className="border border-border rounded-lg p-3 flex flex-col items-start gap-2 opacity-50 cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">USSD Code</p>
                <p className="text-xs text-muted-foreground">Dial a short code</p>
              </div>
            </button>
            
            {/* Bank Card */}
            <button
              onClick={() => setPaymentMethod("card")}
              className={`rounded-lg p-3 flex flex-col items-start gap-2 transition-colors ${
                paymentMethod === "card"
                  ? "border-2 border-primary bg-primary/5"
                  : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">Bank Card</p>
                <p className="text-xs text-muted-foreground">Debit / credit card</p>
              </div>
            </button>
          </div>
        </div>

        {/* Airtime Payment Instructions (shows when airtime selected) */}
        {paymentMethod === "airtime" && (
          <div className="border border-border rounded-lg p-3 md:p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide">Airtime Payment</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-[var(--color-brand)]">1</div>
                <p className="text-xs">Open your dialer</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-[var(--color-brand)]">2</div>
                <p className="text-xs">Dial *20211# and follow prompts</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-[var(--color-brand)]">3</div>
                <p className="text-xs">Select NollyWin and confirm amount</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-[var(--color-brand)]">4</div>
                <p className="text-xs">Your account is credited instantly</p>
              </div>
            </div>
            
            <div className="border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Airtime charge</p>
              <p className="text-xl font-bold text-[var(--color-brand)]">₦{price.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Confirm Payment Button */}
        {paymentMethod && (
          <div className="space-y-2">
            <Button
              onClick={() => {
                if (paymentMethod === "airtime") {
                  handleAirtimeClick();
                } else if (paymentMethod === "card") {
                  handleConfirmPayment();
                }
              }}
              disabled={isProcessing}
              className="w-full justify-center text-sm py-3 min-h-[44px] bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]"
            >
              {isProcessing ? "Processing..." : `Confirm Payment · ₦${price.toLocaleString()}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your payment is secured and encrypted
            </p>
          </div>
        )}
      </div>
  ) : null;

  // ---- BROWSE VIEW ----
  const browseView = (
    <div className="space-y-5 md:space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Packages</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Choose a plan to start playing trivia and earning points.</p>
      </div>

      {/* New user explainer - show when no active subscription */}
      {!dashboard?.hasActiveSubscription && !loading && (
        <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold">Welcome to NollyWin!</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Subscribe to a package to unlock trivia games. Answer questions correctly to earn points, climb the leaderboard, and win cash prizes every month. The more you play, the more you earn!
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 sm:h-20 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <>
        {/* Payment pending card (Paystack payments) */}
        {dashboard?.subscriptionPaymentPending && (
          <div className="border border-orange-500/20 bg-orange-500/10 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold">Payment pending</h3>
            <p className="text-xs text-muted-foreground">
              {paymentStarted
                ? `You started a payment for ${paymentStarted.packageName} ${formatTimeAgo(paymentStarted.startedAt)}. If you've paid, it can take a few minutes to confirm. If you cancelled, you can start a new payment.`
                : "You have a payment that is still being confirmed. If you've paid, it can take a few minutes to confirm. If you cancelled, you can start a new payment."}
            </p>
            {statusCheckMessage && (
              <p className="text-xs text-orange-600 font-medium">{statusCheckMessage}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleCheckStatus}
                disabled={isCheckingStatus || statusCheckCooldown}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Checking...
                  </>
                ) : statusCheckCooldown ? (
                  "Check status (wait 10s)"
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Check status
                  </>
                )}
              </Button>
              <Button
                onClick={handleStartNewPayment}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Start a new payment
              </Button>
            </div>
          </div>
        )}

        {/* Pending airtime payment banner */}
        <PendingPaymentBanner onRefresh={handleRefreshStatus} />
        
        {/* Backend error message (4xx rejection) */}
        {backendError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-start gap-2.5 sm:gap-3">
            <AlertCircle size={18} className="sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">
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
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
              You&apos;ve used all plays in your {dashboard.subscription.packageName} plan.
            </p>
          </div>
        )}

        {/* Subscription Plans Section */}
        <div>
          <h2 className="text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider text-muted-foreground">Subscription Plans</h2>
          <div className="space-y-2">
            {activePackages.map((plan) => {
              const isBestValue = plan.name === "Monthly" || plan.durationDays === 30;
              const isSelected = selected?.id === plan.id;
              
              return (
                <button
                  key={plan.id}
                  onClick={() => canBuy && handleSelect(plan)}
                  disabled={!canBuy}
                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg transition-all min-h-[60px] gap-3 ${
                    !canBuy 
                      ? "opacity-50 cursor-not-allowed border-border"
                      : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold">{plan.name}</p>
                      {isBestValue && (
                        <span className="bg-[var(--color-brand)] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          Best value
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPlanAllowance(plan)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold whitespace-nowrap text-[var(--color-brand)]">₦{plan.fee.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      per {plan.durationDays === 1 ? 'day' : plan.durationDays === 7 ? 'week' : 'month'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="space-y-2">
          {!canBuy ? (
            <div className="bg-secondary/50 border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">{blockReason}</p>
            </div>
          ) : !selected ? (
            <div className="bg-secondary/50 border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Select a package first</p>
            </div>
          ) : (
            <Button onClick={handleProceedToPayment} className="w-full justify-center text-sm sm:text-base py-3 sm:py-3.5 min-h-[48px]">
              Proceed to Payment
            </Button>
          )}
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
            Secure payment via Paystack
          </p>
        </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {view === "checkout" && selected ? checkoutView : browseView}
      
      {/* Airtime Payment Modal - rendered at component level */}
      {showAirtimeModal && selected && (
        <AirtimePaymentModal
          packageId={selected.id}
          packageName={selected.name}
          amount={selected.fee}
          userPhone={user?.phoneNumber}
          onClose={() => setShowAirtimeModal(false)}
          onSuccess={handleAirtimeSuccess}
        />
      )}
      
      {/* Confirm Dialog - payment already pending */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmDialogMessage("");
        }}
        title="Payment already pending"
        message={
          confirmDialogMessage ||
          "You may already have paid for a plan that is still being confirmed. Check status first."
        }
        confirmText="Pay again anyway"
        cancelText="Check status"
        onConfirm={handleConfirmPayAgain}
        onCancel={handleCheckStatus}
        loading={isProcessing}
      />
    </>
  );
}
