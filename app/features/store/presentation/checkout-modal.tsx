"use client";
import { useState } from "react";
import { X, CreditCard, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { simulateRequest } from "@/lib/api/simulate";
import { useSubscriptionStore, PlanId } from "@/store/subscription-store";
import type { Package } from "@/store/packages-store";

type PaymentMethod = "card" | "airtime" | null;
type CheckoutStep = "method" | "details" | "success";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Package;
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>("method");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribe = useSubscriptionStore((s) => s.subscribe);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Airtime form state
  const [phoneNumber, setPhoneNumber] = useState("");

  const resetState = () => {
    setStep("method");
    setPaymentMethod(null);
    setIsProcessing(false);
    setError(null);
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setPhoneNumber("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep("details");
    setError(null);
  };

  const handleBackToMethod = () => {
    setStep("method");
    setError(null);
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      setError("Please fill in all card details");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await simulateRequest({ success: true }, 1500);
      subscribe(plan.id as PlanId);
      setStep("success");
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAirtimePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await simulateRequest({ success: true }, 1500);
      subscribe(plan.id as PlanId);
      setStep("success");
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Method Selection Step */}
        {step === "method" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Choose Payment Method</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Subscribe to {plan.name} for {plan.price}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleMethodSelect("card")}
                className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-xl hover:border-primary transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Pay with Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, Verve</p>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect("airtime")}
                className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-xl hover:border-primary transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone size={20} className="text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Pay with Airtime</p>
                  <p className="text-xs text-muted-foreground">Deduct from your phone balance</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Card Payment Details Step */}
        {step === "details" && paymentMethod === "card" && (
          <div className="space-y-6">
            <button
              onClick={handleBackToMethod}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold">Card Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.name} — {plan.price}
              </p>
            </div>

            <form onSubmit={handleCardPayment} className="space-y-4">
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Card Number</label>
                <Input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">Expiry Date</label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">CVV</label>
                  <Input
                    type="text"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={3}
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" disabled={isProcessing} className="w-full justify-center">
                {isProcessing ? "Processing..." : `Pay ${plan.price}`}
              </Button>
            </form>
          </div>
        )}

        {/* Airtime Payment Details Step */}
        {step === "details" && paymentMethod === "airtime" && (
          <div className="space-y-6">
            <button
              onClick={handleBackToMethod}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold">Pay with Airtime</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.name} — {plan.price}
              </p>
            </div>

            <form onSubmit={handleAirtimePayment} className="space-y-4">
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Phone Number</label>
                <div className="flex">
                  <span className="flex items-center px-4 rounded-l-xl border border-r-0 border-border bg-input text-muted-foreground">
                    NG +234
                  </span>
                  <Input
                    type="tel"
                    placeholder="8012345678"
                    className="rounded-l-none"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {plan.price} will be deducted from your airtime balance
                </p>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" disabled={isProcessing} className="w-full justify-center">
                {isProcessing ? "Processing..." : `Pay ${plan.price}`}
              </Button>
            </form>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-6 text-center py-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground mt-2">
                You&apos;re now subscribed to {plan.name}
              </p>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">You can now access all trivia stages</p>
            </div>

            <Button onClick={handleClose} className="w-full justify-center">
              Start Playing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
