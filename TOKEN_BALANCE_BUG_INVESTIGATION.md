# Token Balance Not Updating After Game - Investigation

## Problem
After completing a trivia game (1 token should be consumed per attempt), the token balance shown in the header does NOT decrease. Example: player had 58 tokens before starting a game, completed the game, and the header still shows 58 tokens afterward.

## Investigation

### Code Analysis

#### 1. Backend Deduction
- `startAttempt()` API call: `POST /api/v1/game/attempts`
- According to the user, wallet transaction history shows DEBIT entries for "Trivia game attempt"
- **✅ BACKEND IS DEDUCTING CORRECTLY**

#### 2. Frontend Wallet Refresh
The code DOES call `fetchWalletBalance()` in multiple places:

**trivia-flow.tsx line 106-107** (when game starts):
```typescript
// Refresh wallet balance and invalidate dashboard query (token was debited)
fetchWalletBalance().catch(console.error);
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
```

**trivia-flow.tsx line 145-146** (when game ends via normal answer):
```typescript
// Refresh wallet balance and invalidate dashboard query
fetchWalletBalance().catch(console.error);
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
```

**trivia-flow.tsx line 191-192** (when game ends via timeout):
```typescript
// Refresh wallet balance and invalidate dashboard query
fetchWalletBalance().catch(console.error);
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
```

#### 3. Wallet Store Updates
`fetchWalletBalance()` in `store/wallet-store.ts`:
```typescript
export async function fetchWalletBalance() {
  try {
    console.log("[CANARY] fetchWalletBalance() invoked - about to import getBalance");
    const { getBalance } = await import("@/lib/api/wallet");
    useWalletStore.getState().setLoading(true);
    const balance = await getBalance();
    useWalletStore.getState().setBalance(balance.tokenBalance);  // ✅ Updates Zustand store
    return balance;
  } catch (error) {
    useWalletStore.getState().setLoading(false);
    console.error("Failed to fetch wallet balance:", error);
    throw error;
  }
}
```

#### 4. TopBar Component
`authenticated-shell.tsx` → `top-bar.tsx`:
```typescript
// authenticated-shell.tsx receives tokenBalance prop
export function AuthenticatedShell({ children, tokenBalance, unreadCount })

// top-bar.tsx displays the prop
<div className="flex items-center gap-1.5">
  <Coins size={16} />
  {tokenBalance.toLocaleString()} {tokenBalance === 1 ? "token" : "tokens"}
</div>
```

#### 5. Layout Component
`app/(authenticated)/layout.tsx` - **THIS IS THE KEY**:
```typescript
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { tokenBalance } = useWalletStore();  // ✅ Reads from Zustand store
  const { unreadCount } = useNotificationsSync();
  
  return (
    <AuthenticatedShell tokenBalance={tokenBalance} unreadCount={unreadCount}>
      {children}
    </AuthenticatedShell>
  );
}
```

**Zustand subscriptions ARE working** - when the store updates via `setBalance()`, any component using `useWalletStore()` will re-render with the new value.

## Root Cause

The issue is **timing/async race condition**:

1. Game ends, `fetchWalletBalance()` is called (async)
2. 1.5 second timeout starts before showing "Game Over" screen
3. User sees Game Over screen but API fetch may not have completed yet
4. Even if fetch completes, the balance was ALREADY deducted on game START, not game END

**THE REAL ISSUE**: The token is deducted when `startAttempt()` is called (line 96 in trivia-flow.tsx), but the wallet balance is fetched AFTER the deduction. However, since both the deduction and the fetch happen server-side atomically, the fetch should return the CORRECT (decremented) balance.

**HOWEVER**, looking closer at the code:

When `startGame()` is called:
1. Line 96: `const question = await gameApi.startAttempt();` - Backend deducts 1 token
2. Lines 99-105: Set various state
3. Line 106: `fetchWalletBalance().catch(console.error);` - Fetch new balance

This SHOULD work correctly. Let me check if there's a caching issue or if the fetch is being silently caught and logged.

## Hypothesis

The most likely issue is that `fetchWalletBalance()` is being called, but:
1. The API call might be failing silently (caught by `.catch(console.error)`)
2. The fetch is working but there's a React render batching issue
3. The Zustand persist middleware is restoring stale values

## Fix Strategy

### Option 1: Await the balance fetch (RECOMMENDED)
Make the balance fetch awaited and handle errors properly:

```typescript
const startGame = async () => {
  setError(null);
  try {
    const question = await gameApi.startAttempt();
    
    // ... set state ...
    
    // AWAIT the wallet balance refresh
    try {
      await fetchWalletBalance();
    } catch (err) {
      console.error("Failed to refresh wallet after game start:", err);
      // Continue anyway - game has started
    }
    
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  } catch (err) {
    // ... error handling ...
  }
};
```

### Option 2: Add explicit refresh on Game Over screen mount
In `StageCleared` component, add a `useEffect` that fetches balance on mount.

### Option 3: Investigate API failure
Check if `getBalance()` is returning cached/stale data or failing with a silent error.

## Testing Required

1. Open browser console
2. Start a game
3. Look for `[CANARY] fetchWalletBalance() invoked` log
4. Check if any API errors appear after that log
5. Check Network tab for `/api/v1/wallet` requests and their responses
6. Verify the response shows the DECREMENTED balance (57, not 58)
7. Check if Zustand devtools shows the store updating

## Conclusion

**Status**: ❌ FRONTEND SYNC GAP (timing/async issue)

The backend IS deducting correctly, but the frontend wallet refresh is:
- Being called correctly
- But possibly failing silently
- Or completing after the user has already observed the stale balance

**Recommendation**: Implement Option 1 (await the fetch) and add better error visibility.
