# Client Sync Page - Real API Data Integration

## Problem
The Client Sync admin page was displaying fake/placeholder data showing all clients as "Disabled / Never / Never", which didn't match the actual backend data. The page was using outdated field names that didn't align with the confirmed API response structure.

## Solution
Updated the Client Sync page to use the real API response fields confirmed through live testing.

## Confirmed Backend Response Shape

### GET /api/v1/admin/clients-sync
Returns an array of client objects:

```json
[
  {
    "id": "f05f2709-4441-4ace-aee0-ee6af06692b3",
    "email": "web-app@clients.nollywin.com",
    "displayName": "NollyWin Web App",
    "channel": "WEB",
    "status": "ACTIVE",
    "locallyDisabled": false,
    "accessAllowed": true,
    "partnerCode": "NOLLYWIN",
    "lastSyncedAt": "2026-09-17T19:40:51.260923Z"
  }
]
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique client identifier |
| `email` | string | Client email (e.g., web-app@clients.nollywin.com) |
| `displayName` | string | Human-readable name (e.g., "NollyWin Web App") |
| `channel` | enum | Client type: WEB, MOBILE, ADMIN |
| `status` | enum | Backend status: ACTIVE, DISABLED |
| `locallyDisabled` | boolean | Local override flag |
| `accessAllowed` | boolean | Derived permission flag |
| `partnerCode` | string | Partner identifier (e.g., "NOLLYWIN") |
| `lastSyncedAt` | string \| null | ISO timestamp of last sync |

### Write Endpoints (Maker-Checker)
All write operations return 202 Accepted with maker-checker response:

```json
{
  "message": "This action requires a different admin (AUTH role) to approve it before it takes effect.",
  "timestamp": "2026-09-17T19:45:00Z",
  "changeRequestId": "uuid-here",
  "status": "PENDING_APPROVAL"
}
```

## Changes Made

### 1. Updated Type Definition (`lib/api/admin.ts`)

**Before:**
```typescript
export interface SyncedClient {
  email: string;
  enabled: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  [key: string]: unknown;
}
```

**After:**
```typescript
export interface SyncedClient {
  id: string; // UUID
  email: string;
  displayName: string; // e.g., "NollyWin Web App"
  channel: "WEB" | "MOBILE" | "ADMIN" | string;
  status: "ACTIVE" | "DISABLED" | string;
  locallyDisabled: boolean; // Can be disabled locally even if status is ACTIVE
  accessAllowed: boolean; // Derived from status and locallyDisabled
  partnerCode: string;
  lastSyncedAt: string | null; // ISO timestamp, can be null
}
```

### 2. Updated UI Display (`app/admin/client-sync/page.tsx`)

#### Table Structure Changed
**Before:** Email, Status, Last Sync, Created, Actions  
**After:** Client (displayName + email), Channel, Status, Last Sync, Actions

#### New Helper Functions

**Determine Effective Status:**
```typescript
const isClientEnabled = (client: SyncedClient) => {
  return client.status === "ACTIVE" && !client.locallyDisabled;
};
```

A client is only truly enabled if:
1. Backend status is ACTIVE, AND
2. Not locally disabled

**Status Badge Color:**
```typescript
const getStatusColor = (client: SyncedClient) => {
  if (client.status === "ACTIVE" && !client.locallyDisabled) {
    return "bg-green-500/10 border-green-500/30 text-green-600"; // Green
  }
  return "bg-red-500/10 border-red-500/30 text-red-600"; // Red
};
```

**Channel Badge Color:**
```typescript
const getChannelColor = (channel: string) => {
  switch (channel) {
    case "WEB":
      return "bg-blue-500/10 border-blue-500/30 text-blue-600";
    case "MOBILE":
      return "bg-purple-500/10 border-purple-500/30 text-purple-600";
    case "ADMIN":
      return "bg-orange-500/10 border-orange-500/30 text-orange-600";
    default:
      return "bg-secondary border-border text-muted-foreground";
  }
};
```

#### Table Row Display

**Primary Label:** `displayName` (e.g., "NollyWin Web App")  
**Secondary Label:** `email` (e.g., web-app@clients.nollywin.com)

**Channel Badge:** Color-coded by type (WEB=blue, MOBILE=purple, ADMIN=orange)

**Status Display:**
- Shows "Enabled" (green) or "Disabled" (red) with icon
- If `status === "ACTIVE"` but `locallyDisabled === true`, shows "(Locally disabled)" note

**Last Sync:** Formatted timestamp or "Never" if null

#### Search Result Display
Shows full client details:
- `displayName` as primary
- `email` as secondary
- Channel badge
- Partner code
- Last sync timestamp
- Enable/Disable action button

## Visual Changes

### Before (Fake Data)
```
Email                           Status      Last Sync    Created    Actions
test1@example.com              Disabled    Never        Never      Enable
test2@example.com              Disabled    Never        Never      Enable
test3@example.com              Disabled    Never        Never      Enable
```

### After (Real Data)
```
Client                          Channel    Status                Last Sync             Actions
NollyWin Web App               [WEB]      ✓ Enabled            Sep 17, 2026 7:40PM   Disable
web-app@clients...

NollyWin Mobile App            [MOBILE]   ✓ Enabled            Sep 17, 2026 7:40PM   Disable
mobile-app@clients...

QA Test Client                 [WEB]      ✓ Enabled            Sep 17, 2026 7:35PM   Disable
qa-test-client@clients...

Admin Console                  [ADMIN]    ✗ Disabled           Never                  Enable
admin-console@clients...                  (Locally disabled)
```

## Status Logic

### Effective Status Calculation

| Backend Status | locallyDisabled | Display | Color |
|---------------|-----------------|---------|-------|
| ACTIVE | false | ✓ Enabled | Green |
| ACTIVE | true | ✗ Disabled (Locally disabled) | Red |
| DISABLED | false | ✗ Disabled | Red |
| DISABLED | true | ✗ Disabled | Red |

This allows admins to:
1. See which clients are ACTIVE at the backend level
2. See which clients are locally disabled (override)
3. Enable/disable clients independently of backend status

## Maker-Checker Integration

All write operations correctly implement maker-checker pattern:

### Refresh Clients
```typescript
const response = await refreshSyncedClients();
// POST /api/v1/admin/clients-sync/refresh
setSuccessMessage(response.message);
// Shows: "This action requires a different admin (AUTH role) to approve..."
// Does NOT reload client list (waits for approval)
```

### Enable Client
```typescript
const response = await enableSyncedClient(email);
// POST /api/v1/admin/clients-sync/{email}/enable
setSuccessMessage(response.message);
// Shows changeRequestId in success message
// Does NOT update local state
```

### Disable Client
```typescript
const response = await disableSyncedClient(email);
// POST /api/v1/admin/clients-sync/{email}/disable
setSuccessMessage(response.message);
// Shows changeRequestId in success message
// Does NOT update local state
```

## Expected Live Data

Based on the confirmed backend response, the table should show:

1. **web-app@clients.nollywin.com**
   - Display: "NollyWin Web App"
   - Channel: WEB (blue badge)
   - Status: Enabled (green, with check icon)
   - Last Sync: Real timestamp

2. **mobile-app@clients.nollywin.com**
   - Display: "NollyWin Mobile App"
   - Channel: MOBILE (purple badge)
   - Status: Enabled (green, with check icon)
   - Last Sync: Real timestamp

3. **qa-test-client@clients.nollywin.com**
   - Display: "QA Test Client"
   - Channel: WEB (blue badge)
   - Status: Enabled (green, with check icon)
   - Last Sync: Real timestamp

4. **admin-console@clients.nollywin.com**
   - Display: "Admin Console"
   - Channel: ADMIN (orange badge)
   - Status: Disabled (red, with X icon)
   - Last Sync: "Never" or real timestamp

## Testing Checklist

- [ ] Navigate to Admin → Client Sync
- [ ] Confirm table shows 4 distinct clients (not uniform fake rows)
- [ ] Verify displayName shown as primary label
- [ ] Verify email shown as secondary label below displayName
- [ ] Confirm channel badges have different colors (blue/purple/orange)
- [ ] Verify 3 clients show as "Enabled" (green)
- [ ] Verify 1 client shows as "Disabled" (red)
- [ ] Confirm last sync times are real timestamps (not all "Never")
- [ ] Test search by email - confirms correct client details shown
- [ ] Click Refresh - confirms network request + maker-checker message
- [ ] Click Enable/Disable - confirms network request + maker-checker message
- [ ] Verify no local state updates after actions (maker-checker pattern)

## Build Status
✅ Compiles successfully  
✅ No TypeScript errors in Client Sync code  
✅ Type safety maintained with updated interface  

## Migration Notes

This change updates the UI to display the real backend data structure. No database migrations or backend changes required - the backend was already returning these fields, but the frontend was:
1. Using wrong field names (enabled → status + locallyDisabled)
2. Looking for fields that don't exist (createdAt)
3. Missing fields that do exist (displayName, channel, partnerCode)

The fix aligns the frontend with the actual API contract that was already live.
