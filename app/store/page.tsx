"use client";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useSubscriptionStore } from "@/store/subscription-store";
import { usePackagesStore, type Package } from "@/store/packages-store";
import { useTokenPackagesStore, type TokenPackage } from "@/store/token-packages-store";
import { useWalletStore } from "@/store/wallet-store";
import { Button } from "@/components/ui/button";
import { simulateRequest } from "@/lib/api/simulate";

// Literal hex values matching the Figma — see earlier fix notes: the
// shared Badge component overrides custom bg-* classes, so these two
// pills stay as plain styled spans rather than <Badge>.
const PINK = "#F40289";
const RED = "#FC0D28";

type SelectedItem = 
  | { type: "subscription"; item: Package }
  | { type: "tokens"; item: TokenPackage }
  | null;

type PaymentMethod = "airtime" | "ussd" | "card";

// "browse" = the plan/token grid, with a "Proceed to Payment" button
// once something's selected. Clicking that REPLACES the whole view
// with "checkout" — a distinct screen (with its own Back button) that
// shows Order Summary + Payment Method together, matching the Figma
// exactly. It is not a section stacked below the plan grid.
type View = "browse" | "checkout" | "success";

export default function StorePage() {
  const subscribe = useSubscriptionStore((s) => s.subscribe);
  const packages = usePackagesStore((s) => s.packages);
  const tokenPackages = useTokenPackagesStore((s) => s.packages);
  const { tokens, addTokens } = useWalletStore();
  
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [view, setView] = useState<View>("browse");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("airtime");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const activePackages = packages.filter((p) => p.active);
  
  const price = selected ? selected.item.price : 0;

  const handleSelect = (type: "subscription" | "tokens", item: Package | TokenPackage) => {
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
      // TODO: replace with real API call once the backend exists
      await simulateRequest({ success: true }, 1500);
      
      if (selected.type === "subscription") {
        subscribe(selected.item.id);
      } else {
        addTokens(selected.item.tokens);
      }
      
      setView("success");
    } catch {
      // Error handling
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCheckout = () => {
    setSelected(null);
    setView("browse");
    setPaymentMethod("airtime");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardHolder("");
  };

  // ---- CHECKOUT VIEW — full replacement screen, not a section on the browse page ----
  if (view === "checkout" && selected) {
    return (
      <AuthenticatedShell tokenBalance={tokens} unreadCount={0}>
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
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</h3>
              
              <div className="space-y-3">
                {/* Pay with Airtime - selected state with pink border, icon, and checkmark */}
                <button
                  onClick={() => setPaymentMethod("airtime")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border rounded-lg transition-colors ${
                    paymentMethod === "airtime"
                      ? "border-[#F40289]"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div 
                    className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      paymentMethod === "airtime" ? "" : "bg-secondary"
                    }`}
                    style={paymentMethod === "airtime" ? { backgroundColor: PINK } : {}}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === "airtime" ? "white" : "currentColor"} strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Pay with Airtime</p>
                    <p className="text-xs text-muted-foreground">Deducted from your airtime balance</p>
                  </div>
                  {paymentMethod === "airtime" && (
                    <CheckCircle2 size={20} style={{ color: PINK }} />
                  )}
                </button>

                {/* USSD Code and Bank Card - side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("ussd")}
                    className={`flex items-start gap-3 px-4 py-4 border rounded-lg transition-colors ${
                      paymentMethod === "ussd"
                        ? "border-[#F40289]"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div 
                      className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                        paymentMethod === "ussd" ? "" : "bg-secondary"
                      }`}
                      style={paymentMethod === "ussd" ? { backgroundColor: PINK } : {}}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === "ussd" ? "white" : "currentColor"} strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">USSD Code</p>
                      <p className="text-xs text-muted-foreground">Dial a short code</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-start gap-3 px-4 py-4 border rounded-lg transition-colors ${
                      paymentMethod === "card"
                        ? "border-[#F40289]"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div 
                      className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                        paymentMethod === "card" ? "" : "bg-secondary"
                      }`}
                      style={paymentMethod === "card" ? { backgroundColor: PINK } : {}}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === "card" ? "white" : "currentColor"} strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Bank Card</p>
                      <p className="text-xs text-muted-foreground">Debit / credit card</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod === "airtime" && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Airtime Payment</h4>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span 
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PINK }}
                    >1</span>
                    <span className="text-muted-foreground">Open your dialer</span>
                  </li>
                  <li className="flex gap-3">
                    <span 
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PINK }}
                    >2</span>
                    <span className="text-muted-foreground">Dial *20211# and follow prompts</span>
                  </li>
                  <li className="flex gap-3">
                    <span 
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PINK }}
                    >3</span>
                    <span className="text-muted-foreground">Select NollyWin and confirm amount</span>
                  </li>
                </ol>
              </div>
            )}

            {paymentMethod === "ussd" && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">USSD Payment</h4>
                <div className="bg-secondary/50 border border-primary/30 rounded-lg p-6 text-center mb-4">
                  <p className="text-3xl font-bold text-primary tracking-wider">*20211#</p>
                </div>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Dial the code above to debit ₦{price.toLocaleString()} from your account
                </p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span 
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PINK }}
                    >1</span>
                    <span className="text-muted-foreground">Dial the code on your device</span>
                  </li>
                  <li className="flex gap-3">
                    <span 
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PINK }}
                    >2</span>
                    <span className="text-muted-foreground">Follow the on-screen prompts</span>
                  </li>
                  <li className="flex gap-3">
                    <span 
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PINK }}
                    >3</span>
                    <span className="text-muted-foreground">Confirm deduction to activate</span>
                  </li>
                </ol>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Card Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Card Number</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full px-4 py-3 rounded-lg border-0 bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-lg border-0 bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">CVV</label>
                      <input
                        type="text"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength={3}
                        className="w-full px-4 py-3 rounded-lg border-0 bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-lg border-0 bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

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
      </AuthenticatedShell>
    );
  }

  // ---- SUCCESS VIEW ----
  if (view === "success" && selected) {
    return (
      <AuthenticatedShell tokenBalance={tokens} unreadCount={0}>
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
                  : `${(selected.item as TokenPackage).tokens} tokens added to your account`}
              </p>
            </div>
            <Button onClick={resetCheckout} className="w-full justify-center">
              Continue Shopping
            </Button>
          </div>
        </div>
      </AuthenticatedShell>
    );
  }

  // ---- BROWSE VIEW (default) ----
  return (
    <AuthenticatedShell tokenBalance={tokens} unreadCount={0}>
      <div className="space-y-8 max-w-lg mx-auto">
        {/* Subscription Plans Section */}
        <div>
          <h2 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">Subscription Plans</h2>
          <div className="space-y-2">
            {activePackages.map((plan) => (
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
                    {plan.bestValue && (
                      <span style={{ backgroundColor: PINK, color: "#fff" }} className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Best value
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.attempts}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg" style={{ color: PINK }}>₦{plan.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{plan.duration}</p>
                </div>
              </button>
            ))}
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
                <p className="text-3xl font-extrabold leading-none mb-1">{pkg.tokens}</p>
                <p className="text-xs text-muted-foreground mb-2">{pkg.tokens} plays</p>
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
      </div>
    </AuthenticatedShell>
  );
}