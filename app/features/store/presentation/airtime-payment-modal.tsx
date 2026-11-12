"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Smartphone, ArrowRight, CheckCircle, Info } from "lucide-react";
import { startAirtimeSubscription } from "@/lib/api/airtime";
import { normalizeNigerianPhone, validateNigerianPhone } from "@/lib/airtime/phone-utils";
import { usePlayerDashboard } from "@/hooks/use-player-dashboard";

interface AirtimePaymentModalProps {
  packageId: string; // UUID from packages API
  packageName: string;
  amount: number;
  userPhone?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AirtimePaymentModal({
  packageId,
  packageName,
  amount,
  userPhone,
  onClose,
  onSuccess,
}: AirtimePaymentModalProps) {
  const [phone, setPhone] = useState(userPhone || "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current dashboard for baseline
  const { data: dashboard } = usePlayerDashboard();

  const resetState = () => {
    setPhoneError(null);
    setError(null);
    setSubmitting(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setPhoneError(null);
    setError(null);
  };

  const handlePhoneBlur = () => {
    if (phone.trim()) {
      const validationError = validateNigerianPhone(phone);
      setPhoneError(validationError);
    }
  };

  const handleContinue = async () => {
    // Validate phone
    const phoneValidation = validateNigerianPhone(phone);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }

    // Normalize phone
    const normalizedPhone = normalizeNigerianPhone(phone);
    if (!normalizedPhone) {
      setPhoneError("Invalid phone number format");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await startAirtimeSubscription({
        packageId,
        msisdn: normalizedPhone,
      });

      // Store pending payment in sessionStorage with baseline
      const pendingPayment = {
        transactionId: response.transactionId,
        tid: response.tid,
        packageName,
        startedAt: new Date().toISOString(),
        baseline: {
          expiresAt: dashboard?.subscription?.expiresAt || null,
          tokensLeft: dashboard?.tokensLeft ?? null,
          packageName: dashboard?.subscription?.packageName || null,
        },
      };
      sessionStorage.setItem("nollywin:airtime-pending", JSON.stringify(pendingPayment));

      // Log redirect URL for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("[Airtime Modal] Redirecting to:", response.redirectUrl);
      }

      // Redirect to MTN secure page (use exact URL as returned, do not rewrite http to https)
      if (response.redirectUrl) {
        // Validate URL before redirecting
        try {
          const url = new URL(response.redirectUrl);
          if (url.protocol === "http:" || url.protocol === "https:") {
            // Call onSuccess before redirect
            onSuccess();
            window.location.assign(response.redirectUrl);
          } else {
            throw new Error("Invalid redirect URL received");
          }
        } catch (urlError) {
          console.error("[Airtime Modal] Invalid URL:", response.redirectUrl, urlError);
          throw new Error("Invalid payment URL received. Please try again or contact support.");
        }
      } else {
        throw new Error("No redirect URL received from server");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal open={true} onClose={submitting ? () => {} : handleClose} title="">
      <div className="space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div 
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[var(--color-brand-soft)]"
          >
            <Smartphone size={32} className="text-[var(--color-brand)]" />
          </div>
          <h2 className="text-xl font-bold">Pay with MTN Airtime</h2>
          <p className="text-sm text-muted-foreground">
            Amount will be deducted from your airtime balance
          </p>
        </div>

        {/* Plan Summary Card */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subscription Plan</span>
            <span className="font-semibold text-sm">{packageName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Entries</span>
            <span className="font-medium text-sm">
              {packageName.toLowerCase() === "daily" && "1 entry a day"}
              {packageName.toLowerCase() === "weekly" && "3 entries a week"}
              {packageName.toLowerCase() === "monthly" && "7 entries a month"}
            </span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">Amount to Pay</span>
            <span className="text-2xl font-bold text-[var(--color-brand)]">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex items-center justify-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[var(--color-brand-border)] bg-[var(--color-brand-soft)]"
          >
            <div 
              className="w-2 h-2 rounded-full bg-[var(--color-brand)]"
            />
            <span className="font-semibold text-sm text-[var(--color-brand)]">
              MTN Network Only
            </span>
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="space-y-2">
          <label htmlFor="airtime-phone" className="block text-sm font-semibold">
            Enter Your MTN Number
          </label>
          <div className="relative">
            <Input
              id="airtime-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g., 0803 123 4567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={handlePhoneBlur}
              disabled={submitting}
              className={`pl-10 h-12 text-base ${phoneError ? "border-red-500" : ""}`}
            />
            <Smartphone 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
          {phoneError && (
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{phoneError}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>This must be the MTN line you want to use for payment</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Payment Error</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div 
          className="rounded-lg p-4 space-y-2 border bg-[var(--color-brand-soft)] border-[var(--color-brand-border)]"
        >
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-[var(--color-brand)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-brand)]">
              You&apos;ll be redirected to MTN&apos;s secure payment page
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-[var(--color-brand)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-brand)]">
              Confirm the {packageName} plan for ₦{amount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-[var(--color-brand)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-brand)]">
              Your subscription activates instantly after payment
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 h-12 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={submitting || !phone.trim() || !!phoneError}
            className="flex-1 h-12 text-sm font-semibold bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Continue to Payment
                <ArrowRight size={18} />
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
