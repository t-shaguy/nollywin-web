# Draw Winner Selection & Change Request Error Handling - Fixed ✅

## Issue 1: Select Winners Timing

### Problem
Backend rejects winner selection with 409 if attempted before the day after `endsOn` (UTC).

Example error:
```
"This draw's period runs until 2026-11-30 - winners can be selected from 2026-12-01"
```

### Solution ✅
**File**: `app/admin/rewards/page.tsx`

Updated action matrix logic:
```typescript
// OLD: today > endsOn (allows selection ON the endsOn date)
const allowSelect = isLegacy || (draw.endsOn && today > draw.endsOn);

// NEW: Same logic but clarified with comment
const allowSelect = isLegacy || (draw.endsOn && today > draw.endsOn);
// today > endsOn means: if endsOn is "2026-11-30", today must be "2026-12-01" or later
```

The logic was already correct (`>` not `>=`), which means:
- If `endsOn` is `2026-11-30`
- `today` must be `2026-12-01` or later
- This matches backend requirement: "day after endsOn"

## Issue 2: Change Request Error Handling

### Problem
When approve/reject returns 409 or any 4xx error:
- Generic error message shown
- Request removed from list
- User can't see backend error message or retry

### Solution ✅
**File**: `app/admin/change-requests/page.tsx`

#### Changes Made:

1. **Extract Backend Error Messages**
```typescript
const backendMessage = err?.message || err?.error || "Failed to approve";
```

2. **Show Backend Message for 4xx Errors**
```typescript
if (err?.status >= 400 && err?.status < 500) {
  setError(backendMessage); // Shows actual backend message
  // Don't remove request - user can try again
}
```

3. **Keep Request in Place**
- For 4xx errors, request stays in pending list
- User can see the error and try again later
- Modal stays open so error is visible

#### Error Handling Matrix:

| Status Code | Behavior | Request Action |
|-------------|----------|----------------|
| 403 | Show "Access denied: CHECKER role required" | Keep in list |
| 409 | Show backend message (e.g. "can be selected from...") | Keep in list |
| 400-499 | Show backend message | Keep in list |
| 500+ | Show backend message | Keep in list |
| 2xx | Show success + resultSummary | Remove from list |

## Testing Scenarios

### Scenario 1: Select Winners Too Early
1. Create draw with `endsOn: 2026-11-30`
2. Close draw
3. Try to select winners on 2026-11-30
4. ✅ Button should be **disabled** (grayed out)
5. Try to select winners on 2026-12-01
6. ✅ Button should be **enabled**

### Scenario 2: Approval with 409 Error
1. Checker tries to approve "Select Winners" for 2026-11-30 draw
2. Backend returns 409 with message
3. ✅ Error shows: "This draw's period runs until 2026-11-30 - winners can be selected from 2026-12-01"
4. ✅ Request stays in pending list
5. ✅ Can try again on 2026-12-01

### Scenario 3: Approval with 403 Error
1. Non-checker admin tries to approve
2. Backend returns 403
3. ✅ Error shows: "Access denied: Your admin account doesn't have CHECKER role permissions..."
4. ✅ Request stays in list

## Files Modified

1. `app/admin/rewards/page.tsx` - Added comment clarifying UTC day-after logic
2. `app/admin/change-requests/page.tsx` - Enhanced error handling for approve/reject

## Build Status
✅ **Build passes** - Exit Code 0, no TypeScript errors
