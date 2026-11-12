"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearPaymentStarted } from "@/lib/utils/payment-state";
import { type PlayerDashboard } from "@/lib/api/auth";

type Status = "verifying" | "confirmed" | "still-pending" | "cancelled";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment reference from URL
        const reference = searchParams.get("reference");
        const trxref = searchParams.get("trxref");
        
        // Check if payment was cancelled (Paystack callback param)
        if (searchParams.get("cancelled") === "true" || (!reference && !trxref)) {
          setStatus("cancelled");
          setMessage("You cancelled the payment. No charge was made.");
          clearPaymentStarted();
          return;
        }

        // Use whichever reference parameter Paystack provides
        const paymentRef = reference || trxref;

        if (!paymentRef) {
          setStatus("cancelled");
          setMessage("No payment reference found");
          clearPaymentStarted();
          return;
        }

        // Bounded polling: check up to 3 times, 3 seconds apart
        const MAX_CHECKS = 3;
        const CHECK_INTERVAL_MS = 3000;

        const checkPaymentStatus = async (attemptNumber: number) => {
          setCheckCount(attemptNumber);

          // Invalidate and refetch dashboard
          await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          await queryClient.refetchQueries({ queryKey: ["dashboard"] });

          // Get updated dashboard data
          const dashboard = queryClient.getQueryData<PlayerDashboard>(["dashboard"]);

          // Check if payment cleared
          if (dashboard && !dashboard.subscriptionPaymentPending && dashboard.hasActiveSubscription) {
            // Success! Payment confirmed and plan is active
            setStatus("confirmed");
            setMessage(`Your ${dashboard.subscription?.packageName || "plan"} is now active!`);
            clearPaymentStarted();
            
            // Invalidate other related queries
            queryClient.invalidateQueries({ queryKey: ["draws", "active"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            return true;
          }

          // Still pending after max checks
          if (attemptNumber >= MAX_CHECKS) {
            setStatus("still-pending");
            setMessage("Still confirming. We'll update your plan as soon as it's confirmed.");
            return false;
          }

          // Schedule next check
          setTimeout(() => {
            checkPaymentStatus(attemptNumber + 1);
          }, CHECK_INTERVAL_MS);
          
          return false;
        };

        // Start checking
        await checkPaymentStatus(1);
      } catch {
        setStatus("still-pending");
        setMessage("We're still confirming your payment. Check back in a few minutes.");
      }
    };

    verifyPayment();
  }, [searchParams, queryClient]);

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

          {status === "confirmed" && (
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-primary" />
            </div>
          )}

          {status === "still-pending" && (
            <div className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <Clock size={40} className="text-orange-500" />
            </div>
          )}

          {status === "cancelled" && (
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-muted-foreground" />
            </div>
          )}

          {/* Status Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {status === "verifying" && "Confirming your payment..."}
              {status === "confirmed" && "Payment Confirmed!"}
              {status === "still-pending" && "Still Confirming"}
              {status === "cancelled" && "Payment Cancelled"}
            </h1>

            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}

            {status === "verifying" && checkCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Check {checkCount} of 3...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {status !== "verifying" && (
            <div className="space-y-3">
              {status === "confirmed" ? (
                <Button 
                  onClick={() => router.push("/home")} 
                  className="w-full justify-center"
                >
                  Go to Home
                </Button>
              ) : status === "still-pending" ? (
                <>
                  <Button 
                    onClick={() => router.push("/store")} 
                    className="w-full justify-center"
                  >
                    Back to Packages
                  </Button>
                  <Button 
                    onClick={() => router.push("/home")} 
                    variant="outline"
                    className="w-full justify-center"
                  >
                    Go to Home
                  </Button>
                </>
              ) : (
                // Cancelled
                <>
                  <Button 
                    onClick={() => router.push("/store")} 
                    className="w-full justify-center"
                  >
                    Browse Plans
                  </Button>
                  <Button 
                    onClick={() => router.push("/home")} 
                    variant="outline"
                    className="w-full justify-center"
                  >
                    Go to Home
                  </Button>
                </>
              )}
            </div>
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
