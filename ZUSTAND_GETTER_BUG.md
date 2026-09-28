# Zustand Frozen Getter Pattern Bug

## Problem

Zustand stores using the `get name() { return get().field; }` pattern inside the state object have a critical bug: **getters get frozen at their first evaluation and never update**.

### Root Cause

Zustand's `set()` function uses `Object.assign()` to merge state updates. When it encounters a getter, it evaluates it **once** at that moment and converts it to a plain static property. The getter is not preserved as a live accessor.

The very first `set()` call (even for unrelated fields like `setLoading(true)`) will freeze all getters at whatever their current value is — typically the initial state value since no real data has loaded yet.

### Example of the Bug

```typescript
interface WalletState {
  tokenBalance: number;
  get tokens(): number; // ❌ THIS GETS FROZEN
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  tokenBalance: 0,
  
  // ❌ BROKEN: This getter gets evaluated ONCE when first set() is called
  // and becomes a static value (0) forever, even as tokenBalance updates
  get tokens() {
    return get().tokenBalance;
  },
  
  setBalance: (tokenBalance) => set({ tokenBalance }), // Updates tokenBalance correctly
  setLoading: (loading) => set({ loading }), // ⚠️ First call FREEZES 'tokens' getter at 0
}));

// Later in the app:
useWalletStore.getState().setLoading(true);  // ⚠️ Freezes 'tokens' = 0
useWalletStore.getState().setBalance(51);     // ✅ tokenBalance = 51
// BUT: useWalletStore().tokens is STILL 0 (frozen)
// WHILE: useWalletStore().tokenBalance is correctly 51
```

## Fixed Stores

### ✅ wallet-store.ts
**Status:** Fixed in commit `2a302ad`

- Removed `get tokens()` getter entirely
- Updated 11 files to read `tokenBalance` directly instead of `tokens`
- Navbar and game screen now show correct token count

## Potentially Affected Stores

### ⚠️ referral-store.ts
**Status:** Has same pattern but currently **unused**

```typescript
interface ReferralState {
  referralCode: string | null;
  get code(): string | null; // ⚠️ Same frozen getter pattern
}
```

**Current usage:** No code actually reads the `.code` getter — all consumers use `referralCode` directly.

**Recommendation:** Remove the `get code()` getter pattern to prevent future bugs if anyone starts using it.

## Prevention

**DO NOT** define getters inside Zustand state objects:

```typescript
// ❌ NEVER DO THIS:
create((set, get) => ({
  field: 0,
  get alias() { return get().field; }, // Will freeze on first set()
}))

// ✅ DO THIS INSTEAD - just read the field directly:
const { field } = useStore();
// Or if you need a computed value, use a selector:
const computed = useStore((s) => s.field * 2);
```

## Search Commands

To find other instances of this pattern:

```bash
# Find stores with getter pattern
grep -r "get \w\+().*{" store/

# Find usage of suspected getters
grep -r "useXxxStore.*\.getterName" .
```

## References

- Fixed bug report: NollyWin navbar/game screen stuck at 0 tokens
- Zustand documentation: State mutations use Object.assign
- Commit: `2a302ad` - Remove frozen tokens getter
