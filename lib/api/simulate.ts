// TODO: delete this file and switch every call site back to the real apiClient()
// from lib/api/client.ts once the backend URL exists and endpoints are live.
export function simulateRequest<T = unknown>(result: T, delayMs = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(result), delayMs));
}
