import { useEffect, useState } from "react";
import { getPerformanceTrend } from "@/lib/api/game";
import { PLACEHOLDER_PERFORMANCE } from "@/lib/placeholder-performance";

interface DataPoint {
  label: string;
  value: number;
}

/**
 * Shared hook for fetching and formatting 7-day performance trend data.
 * Used by both Home and Stats pages to ensure they don't drift apart.
 * 
 * Maps API response (date/gamesPlayed/pointsEarned) to chart format (label/value).
 * On error, falls back to PLACEHOLDER_PERFORMANCE so the chart still renders its empty state.
 */
export function usePerformanceTrend() {
  const [data, setData] = useState<DataPoint[]>(PLACEHOLDER_PERFORMANCE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const trend = await getPerformanceTrend(7);
        
        // Map to chart format: label = short weekday, value = pointsEarned
        const chartData: DataPoint[] = trend.map((point) => {
          const date = new Date(point.date);
          const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
          
          return {
            label: weekday,
            value: point.pointsEarned,
          };
        });

        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch performance trend:", error);
        // Fall back to placeholder so chart shows empty state instead of crashing
        setData(PLACEHOLDER_PERFORMANCE);
      } finally {
        setLoading(false);
      }
    }

    fetchTrend();
  }, []);

  return { data, loading };
}
