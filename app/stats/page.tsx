import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { PLACEHOLDER_PERFORMANCE } from "@/lib/placeholder-performance";
import { PerformanceChart } from "../features/home/presentation/performance-chart";

export default function StatsPage() {
  return (
    <AuthenticatedShell tokenBalance={0} unreadCount={0}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Stats</h1>
          <p className="text-muted-foreground text-sm mt-1">Your performance over the last 7 days.</p>
        </div>

        <PerformanceChart data={PLACEHOLDER_PERFORMANCE} />
      </div>
    </AuthenticatedShell>
  );
}
