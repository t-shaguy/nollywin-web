"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "failed" | "abandoned";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment reference from URL
        const reference = searchParams.get("reference");
        const trxref = searchParams.get("trxref");
        
        // Check if payment was cancelled (Paystack callback param)
        if (searchParams.get("cancelled") === "true") {
          setStatus("abandoned");
          setMessage("You didn't complete the payment — no charge was made");
          return;
        }

        // Use whichever reference parameter Paystack provides
        const paymentRef = reference || trxref;

        if (!paymentRef) {
          setStatus("failed");
          setMessage("No payment reference found");
          return;
        }

        // Verify payment with backend
        const { verifyPayment } = await import("@/lib/api/payments");
        const result = await verifyPayment(paymentRef);

        // Convert amountKobo to Naira for display
        const amountNaira = (result.amountKobo / 100).toLocaleString();
        setAmount(`₦${amountNaira}`);

        // Handle different status values
        if (result.status === "success") {
          setStatus("success");
          setMessage(`Payment of ${amountNaira} ${result.currency} completed successfully!`);
          
          // Refresh user data (subscription, wallet, etc.)
          const { fetchSubscriptionStatus } = await import("@/store/subscription-store");
          const { fetchWalletBalance } = await import("@/store/wallet-store");
          
          await Promise.all([
            fetchSubscriptionStatus().catch(() => {}),
            fetchWalletBalance().catch(() => {}),
          ]);
        } else if (result.status === "pending") {
          setStatus("verifying");
          setMessage("Payment is being processed. Please check back in a few minutes.");
        } else if (result.status === "ABANDONED") {
          setStatus("abandoned");
          setMessage("You didn't complete the payment — no charge was made");
        } else {
          // Treat all other statuses as failed
          setStatus("failed");
          setMessage(`Payment verification failed (status: ${result.status})`);
        }
      } catch (error: any) {
        setStatus("failed");
        setMessage(error?.message || "Failed to verify payment");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === "success") {
      router.push("/home");
    } else {
      router.push("/store");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
          {/* Status Icon */}
          {status === "verifying" && (
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Loader2 size={40} className="text-primary animate-spin" />
            </div>
          )}

          {status === "success" && (
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-primary" />
            </div>
          )}

          {status === "abandoned" && (
            <div className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <AlertCircle size={40} className="text-orange-500" />
            </div>
          )}

          {status === "failed" && (
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-destructive" />
            </div>
          )}

          {/* Status Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {status === "verifying" && "Verifying Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "failed" && "Payment Failed"}
              {status === "abandoned" && "Payment Not Completed"}
            </h1>

            {amount && (
              <p className="text-lg font-semibold text-primary">
                {amount}
              </p>
            )}

            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}

            {status === "verifying" && !message && (
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment...
              </p>
            )}
          </div>

          {/* Action Button */}
          {status !== "verifying" && (
            <Button 
              onClick={handleContinue} 
              className="w-full justify-center"
            >
              {status === "success" ? "Continue to Home" : "Back to Store"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Loader2 size={40} className="text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
