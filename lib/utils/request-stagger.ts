/**
 * Request Staggering Utility
 * 
 * Helps reduce concurrent request bursts by spacing out multiple fetches
 * that would otherwise fire simultaneously on page mount.
 */

/**
 * Stagger multiple async operations with configurable delays between them
 * 
 * @param operations - Array of async functions to execute
 * @param delayMs - Milliseconds to wait between starting each operation (default: 50ms)
 * @returns Promise that resolves when all operations complete
 * 
 * Example:
 * ```ts
 * await staggerRequests([
 *   () => fetchWalletBalance(),
 *   () => fetchSubscriptionStatus(),
 *   () => getNotifications(),
 * ], 50);
 * ```
 */
export async function staggerRequests<T = any>(
  operations: Array<() => Promise<T>>,
  delayMs: number = 50
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i++) {
    // Start the operation
    const promise = operations[i]();
    results.push(promise as any);
    
    // Wait before starting the next one (except for the last operation)
    if (i < operations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Wait for all operations to complete
  return Promise.all(results);
}

/**
 * Delay execution by the specified number of milliseconds
 * Useful for introducing a brief pause before making a request
 * 
 * @param ms - Milliseconds to delay
 * 
 * Example:
 * ```ts
 * await delay(100);
 * await fetchData();
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
