import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriptionRequiredBanner({ showCta = false }: { showCta?: boolean }) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 flex items-start gap-4">
      <div className="h-11 w-11 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
        <Star size={20} className="text-destructive" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-destructive">Active Subscription Required to Play</p>
        <p className="text-sm text-muted-foreground mt-1">
          You must purchase a subscription plan before you can access the trivia stages.
        </p>
        {showCta && (
          <Link href="/store" className="inline-block mt-4">
            <Button>Go to Store</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
