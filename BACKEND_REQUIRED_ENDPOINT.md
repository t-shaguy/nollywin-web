# Required Backend Endpoint: Public Token Exchange Rate

## Issue
The Store page (`/store`) needs to display token package pricing, which requires the current token exchange rate. Previously, the frontend was incorrectly calling the admin-only endpoint `/api/v1/admin/token-exchange-rate/current`, which caused authentication issues for regular players.

## Required New Endpoint

### `GET /api/v1/token-exchange-rate/current`

**Purpose**: Allow authenticated players to fetch the current token exchange rate for displaying package pricing on the Store page.

**Authentication**: 
- Requires: `X-Client-Token` header (standard web client auth)
- Requires: `Authorization: Bearer <playerToken>` header (standard player auth)
- Does NOT require admin role/permissions

**Response Format**:
```json
{
  "koboPerToken": 10000
}
```

**Notes**:
- This should return the exact same data as the admin endpoint `/api/v1/admin/token-exchange-rate/current`
- The only difference is the authentication tier: player-scoped vs admin-scoped
- Players need read-only access to this rate to see Store pricing
- Admins still use the existing `/api/v1/admin/token-exchange-rate/current` endpoint (keep that unchanged)

## Frontend Changes Made

1. Created `lib/api/wallet.ts` with player-scoped `getCurrentTokenExchangeRate()` function
2. Updated `store/token-packages-store.ts` to import from `wallet.ts` instead of `admin.ts`
3. Added safety checks in `admin-client.ts` to prevent this class of bug from recurring

## Testing

Once the backend endpoint is deployed:

1. **As a regular player** (no admin session):
   - Visit `/store`
   - Verify no redirect to `/admin/login`
   - Check Network tab: should see successful call to `/api/v1/token-exchange-rate/current`
   - Verify package pricing displays with correct token amounts

2. **As a regular player** (with stale admin session in localStorage):
   - First log into `/admin/login` in the same browser
   - Then log in as a regular player
   - Visit `/store`
   - Verify no redirect to `/admin/login` occurs
   - Verify pricing displays correctly

3. **As an admin**:
   - Visit `/admin/token-rate` (admin token rate management page)
   - Verify it still works correctly using the admin endpoint

## Fallback Behavior

Until the backend endpoint is deployed, the frontend will:
- Catch the error from the missing endpoint
- Fall back to a hardcoded exchange rate (₦100 = 1 token, i.e., 10,000 kobo per token)
- Log a warning in the console
- Display pricing with the fallback rate (better than crashing)

This means the Store page will continue to function, but with potentially incorrect pricing until the endpoint is available.
