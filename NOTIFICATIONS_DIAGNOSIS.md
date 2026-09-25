# Notifications Diagnosis - Read State Not Persisting

## The Problem

From the screenshot, notifications show "8 new" and keep appearing as unread even after being opened/read. This indicates the backend is NOT persisting read state correctly.

## Added Extensive Logging

I've added comprehensive console logging to diagnose exactly what's happening:

### What to Check in Browser Console

1. **On page load:**
   ```
   === NOTIFICATIONS DEBUG ===
   Total notifications: X
   Sample notification (first one): { full JSON }
   All notification fields available: [list of fields]
   =========================
   ```
   
   **Look for:**
   - What fields does the backend actually send?
   - Is `isRead` field present and correct?
   - Are there metadata fields like `amount`, `tokens`, `packageName`?

2. **When clicking a notification:**
   ```
   Marking notification as read: <id>
   [API] Calling POST /api/v1/notifications/<id>/read
   [API] Mark as read successful for ID: <id>
   Mark as read API call completed successfully
   ```
   
   **Look for:**
   - Does the POST call succeed?
   - Any error messages?
   - Does the notification list reload after?

3. **When clicking "Mark all read":**
   ```
   Marking all notifications as read...
   [API] Calling POST /api/v1/notifications/read-all
   [API] Mark all as read successful
   Mark all as read API call completed successfully
   ```
   
   **Look for:**
   - Does the POST call succeed?
   - Does the list refresh showing updated read states?

## Likely Root Causes

Based on the persistent "8 new" issue, one of these is happening:

### 1. Backend Not Persisting (Most Likely)
The POST endpoints return 200 OK but don't actually update the database.

**Evidence to check:**
- Console shows POST calls succeeding
- But after refresh, notifications still show as unread
- `isRead` field in response is always `false`

**Fix needed:** Backend team needs to fix persistence logic

### 2. Wrong Endpoint or Parameters
We're calling the wrong API route.

**Evidence to check:**
- Console shows 404 or 400 errors
- Or POST calls return success but backend ignores them

**Fix needed:** Check backend API documentation for correct endpoints

### 3. Backend Caching Issue
Backend is returning cached unread data even after mark-read.

**Evidence to check:**
- POST succeeds
- But GET immediately after still returns old data
- Takes several minutes for changes to appear

**Fix needed:** Backend needs to clear cache on mark-read

### 4. Missing Authentication Context
Backend doesn't know which user's notifications to mark as read.

**Evidence to check:**
- POST returns 401/403 errors
- Or marks wrong user's notifications

**Fix needed:** Verify X-Client-Token and Authorization headers are sent

## Minimal Notification Content Issue

From screenshot: "Wallet topped up" with no details.

This means backend is NOT sending metadata fields like:
- `amount` (Naira value)
- `tokens` (token count)
- `packageName` (subscription name)
- etc.

**What to check:**
Look at the console log output for "Sample notification (first one)" - see what fields are actually available.

**If metadata fields are missing:**
Backend needs to include these in notification creation. Frontend cannot invent data that doesn't exist.

## Testing Instructions

1. Open browser DevTools → Console tab
2. Navigate to notifications page
3. Check console output for notification data structure
4. Click any unread notification
5. Watch console for API call logs
6. Refresh the page
7. Check if notification is still marked as read
8. Share console output with me

## Expected Backend Behavior

### Correct GET Response:
```json
[
  {
    "id": "123",
    "type": "WALLET_TOPUP",
    "title": "Wallet topped up",
    "description": "Your wallet has been credited",
    "timestamp": "2024-01-15T10:30:00Z",
    "isRead": false,
    "amount": 900,
    "tokens": 9,
    "metadata": {
      "transactionId": "tx_123",
      "paymentMethod": "card"
    }
  }
]
```

### After POST /notifications/{id}/read:
```json
{
  "id": "123",
  "isRead": true  // ← MUST be true now
}
```

### After another GET:
```json
[
  {
    "id": "123",
    "isRead": true,  // ← MUST persist
    ...
  }
]
```

## Next Steps

1. **Test in browser with console open**
2. **Share console output** showing:
   - Full notification object structure
   - API call logs (POST and subsequent GET)
   - Any error messages
3. **If backend is the issue**, report to backend team with evidence
4. **If frontend issue**, I'll fix based on actual backend behavior

## Files Modified (With Logging)

- `app/(authenticated)/notifications/page.tsx` - Added debug logs
- `lib/api/notifications.ts` - Added API call logs
