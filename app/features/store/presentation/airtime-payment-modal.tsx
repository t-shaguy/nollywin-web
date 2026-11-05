"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { startAirtimeSubscription } from "@/lib/api/airtime";
import { normalizeNigerianPhone, validateNigerianPhone } from "@/lib/airtime/phone-utils";
import { AIRTIME_NETWORKS } from "@/lib/airtime/config";

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

      // Store pending payment in sessionStorage (including subTransId and tid from upstream)
      const pendingPayment = {
        transactionId: response.transactionId,
        tid: response.tid,
        packageName,
        startedAt: new Date().toISOString(),
      };
      sessionStorage.setItem("nollywin:airtime-pending", JSON.stringify(pendingPayment));

      // Redirect to MTN secure page (use exact URL as returned, do not rewrite http to https)
      if (response.redirectUrl) {
        // Call onSuccess before redirect
        onSuccess();
        window.location.assign(response.redirectUrl);
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
    <Modal open={true} onClose={submitting ? () => {} : handleClose} title="Pay with airtime">
      <div className="space-y-4 sm:space-y-5">
        <p className="text-xs sm:text-sm text-muted-foreground">
          The amount is deducted from your MTN airtime balance.
        </p>

        {/* Summary Box */}
        <div className="bg-secondary/30 rounded-lg p-3 sm:p-4 space-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-xs text-muted-foreground">Plan</span>
            <span className="font-medium text-xs">{packageName}</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between gap-3">
            <span className="font-bold text-sm">Price</span>
            <span className="font-bold text-base text-primary">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Network Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-2">Network</label>
          <div className="flex gap-2">
            {AIRTIME_NETWORKS.map((network) => (
              <button
                key={network}
                disabled
                className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border-2 border-primary bg-primary/10 text-primary cursor-default"
              >
                {network}
              </button>
            ))}
            <button
              disabled
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-border bg-secondary/30 text-muted-foreground cursor-not-allowed"
            >
              Others (Coming soon)
            </button>
          </div>
        </div>

        {/* Phone Number Input */}
        <div>
          <label htmlFor="airtime-phone" className="block text-xs sm:text-sm font-medium mb-2">
            MTN phone number
          </label>
          <Input
            id="airtime-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 653 3888"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            disabled={submitting}
            className={phoneError ? "border-red-500" : ""}
          />
          {phoneError && (
            <p className="text-xs text-red-600 mt-1.5">{phoneError}</p>
          )}
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">
            Use the MTN number you want to pay with.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Note */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            You&apos;ll be taken to MTN&apos;s secure page to confirm. Enter your MTN number again and make sure the {packageName} pack (₦{amount.toLocaleString()}) is selected. Your plan starts after the payment is confirmed.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 justify-center min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={submitting || !phone.trim()}
            className="flex-1 justify-center min-h-[44px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
