"use client";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsufficientTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTokens: number;
  currentTokens: number;
}

export function InsufficientTokensModal({
  isOpen,
  onClose,
  requiredTokens,
  currentTokens,
}: InsufficientTokensModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const shortfall = requiredTokens - currentTokens;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm text-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-destructive" />
        </div>

        <h2 className="text-xl font-bold mb-2">Insufficient Tokens</h2>
        <p className="text-muted-foreground text-sm mb-6">
          You need <span className="font-semibold text-foreground">{requiredTokens} tokens</span> to play this stage.
          You currently have <span className="font-semibold text-foreground">{currentTokens} tokens</span>
          {shortfall > 0 && (
            <>
              {" "}— you need <span className="font-semibold text-destructive">{shortfall} more</span>
            </>
          )}
          .
        </p>

        <div className="space-y-3">
          <Button onClick={() => router.push("/store")} className="w-full justify-center">
            Go to Store
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full justify-center">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
