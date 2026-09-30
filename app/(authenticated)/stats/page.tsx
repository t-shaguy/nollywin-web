"use client";
import { PerformanceChart } from "../../features/home/presentation/performance-chart";
import { usePerformanceTrend } from "../../features/home/hooks/use-performance-trend";

export default function StatsPage() {
  const { data: performanceData } = usePerformanceTrend();

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Stats</h1>
          <p className="text-muted-foreground text-sm mt-1">Your performance over the last 7 days.</p>
        </div>

        <PerformanceChart data={performanceData} />
      </div>
  );
}
