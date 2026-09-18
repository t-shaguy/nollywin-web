"use client";
import { useState } from "react";
import { X, CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet-store";
import { useAuthStore } from "@/store/auth-store";
import { useRaffleStore, Raffle } from "@/store/raffle-store";
import { purchaseRaffleTicket } from "@/store/raffle-store";
import { fetchWalletBalance } from "@/store/wallet-store";

interface PurchaseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle;
}

type Step = "confirm" | "success" | "error";

export function PurchaseTicketModal({ isOpen, onClose, raffle }: PurchaseTicketModalProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { tokens } = useWalletStore(); // Get tokens from wallet
  const { user } = useAuthStore(); // Get totalPoints from user profile
  const { raffles } = useRaffleStore();

  // Get user ticket count from raffle data
  const userTickets = raffle.userTicketCount || 0;
  const hasEnoughTokens = tokens >= raffle.ticketCostTokens;

  const handleClose = () => {
    setStep("confirm");
    setErrorMessage("");
    onClose();
  };

  const handlePurchase = async () => {
    if (!hasEnoughTokens) {
      setErrorMessage(`You need ${raffle.ticketCostTokens - tokens} more tokens to buy this ticket`);
      setStep("error");
      return;
    }

    setIsProcessing(true);

    try {
      // Call real API to purchase ticket
      await purchaseRaffleTicket(raffle.id);
      
      // Refresh wallet balance after purchase
      await fetchWalletBalance();
      
      setStep("success");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to purchase ticket. Please try again.");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md">
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Ticket size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">Purchase Raffle Ticket</h2>
              <p className="text-sm text-muted-foreground mt-2">{raffle.prizeName}</p>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost per Ticket</span>
                <span className="font-semibold">{raffle.ticketCostTokens.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Tokens</span>
                <span className={`font-semibold ${hasEnoughTokens ? "text-primary" : "text-destructive"}`}>
                  {tokens.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Tickets</span>
                <span className="font-semibold">{userTickets} tickets</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">After Purchase</span>
                <span className="font-bold text-primary">
                  {(tokens - raffle.ticketCostTokens).toLocaleString()} tokens
                </span>
              </div>
            </div>

            {!hasEnoughTokens && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
                Insufficient tokens. Play more trivia to earn tokens.
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handlePurchase}
                disabled={!hasEnoughTokens || isProcessing}
                className="w-full justify-center"
              >
                {isProcessing ? "Processing..." : "Confirm Purchase"}
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full justify-center">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-6 text-center py-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Ticket Purchased!</h2>
              <p className="text-muted-foreground mt-2">
                You now have {userTickets + 1} {userTickets + 1 === 1 ? "ticket" : "tickets"} for this raffle
              </p>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Draw Schedule</p>
              <p className="font-semibold mt-1">{raffle.scheduleLabel}</p>
            </div>

            <Button onClick={handleClose} className="w-full justify-center">
              Done
            </Button>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-6 text-center py-6">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle size={40} className="text-destructive" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Purchase Failed</h2>
              <p className="text-muted-foreground mt-2">{errorMessage}</p>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full justify-center">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
