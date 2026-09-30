// Fallback data used when performance trend API fails to load.
// Real data is fetched from GET /api/v1/game/attempts/performance-trend
// via the usePerformanceTrend hook (shared by Home and Stats pages).
export const PLACEHOLDER_PERFORMANCE = [
  { label: "Mon", value: 0 },
  { label: "Tue", value: 0 },
  { label: "Wed", value: 0 },
  { label: "Thu", value: 0 },
  { label: "Fri", value: 0 },
  { label: "Sat", value: 0 },
  { label: "Sun", value: 0 },
];
