# Hotfix: Rewards Page Display Issues

## Issues Fixed

### 1. Duplicate Token Cost Display ✅
**Problem:** Ticket cost showed as "50 50 tokens" or "1 1 token"  
**Root Cause:** `pluralize()` function was already returning the count + word, but code was prepending count again  
**Fix:** 
```typescript
// Before:
{drawDetail.ticketCostTokens.toLocaleString()} {pluralize(drawDetail.ticketCostTokens, "token")}
// Result: "50 50 tokens"

// After:
{pluralize(drawDetail.ticketCostTokens, "token", "tokens")}
// Result: "50 tokens"
```

**Changed:**
- Draw detail view: Ticket Cost field
- Draw list cards: Ticket Cost field

### 2. Winner Table Showing Null/"-" ✅
**Problem:** User and Phone columns showing "-" for all winners  
**Root Cause:** Winner API response doesn't include `userName`, `name`, or `phone` fields  
**API Response Actually Contains:**
- `email` or `userEmail` ✓
- `selectedAt` or `selected_at` ✓  
- `userId` or `user_id` (optional)
- `entryId` or `entry_id` (optional)

**Fix:** Rebuilt winner table to show only fields that exist in API:
```typescript
// Before: Expected userName, phone (didn't exist)
<th>User</th>
<th>Email</th>
<th>Phone</th>

// After: Show what actually exists
<th>Email</th>
<th>Selected At</th>
<th>User ID</th> // If present
<th>Entry ID</th> // If present
```

**Features Added:**
- Dynamic columns (only show User ID / Entry ID if data exists)
- Formatted timestamps (DD MMM YYYY, HH:mm)
- Handles both camelCase and snake_case field names
- Falls back gracefully to "-" if field missing

## Testing

### Before Fix
- [x] Ticket cost: "50 50 tokens", "1 1 token"
- [x] Winners: User column showing "-"
- [x] Winners: Phone column showing "-"

### After Fix
- [x] Ticket cost: "50 tokens", "1 token"
- [x] Winners: Email column showing actual emails
- [x] Winners: Selected At column showing formatted timestamps
- [x] Winners: Dynamic columns based on available data

## Files Modified

1. `app/admin/rewards/page.tsx`
   - Fixed pluralize calls (2 locations)
   - Rebuilt winner table structure
   - Added dynamic column rendering
   - Added timestamp formatting

## Build Status

```bash
✅ npm run build - passes
✅ TypeScript validation - passes
✅ No new errors introduced
```

## Deploy Notes

This is a display-only fix. No API changes required. Safe to deploy immediately.

The winner table now accurately reflects what the API actually returns, rather than expecting fields that don't exist.
