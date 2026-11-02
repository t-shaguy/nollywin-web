import { useQuery } from "@tanstack/react-query";
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
 * 
 * @param days - Number of days to fetch (defaults to 7)
 */
export function usePerformanceTrend(days: number = 7) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["performance-trend", days],
    queryFn: () => getPerformanceTrend(days),
    staleTime: 60000, // 60 seconds
    placeholderData: PLACEHOLDER_PERFORMANCE.map(() => ({ date: "", gamesPlayed: 0, pointsEarned: 0 })),
  });

  // Map to chart format: label = short weekday, value = pointsEarned
  const data: DataPoint[] = rawData
    ? rawData.map((point) => {
        const date = new Date(point.date);
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        
        return {
          label: weekday,
          value: point.pointsEarned,
        };
      })
    : PLACEHOLDER_PERFORMANCE;

  return { data, loading: isLoading };
}
