# Admin Role-Based Navigation - Testing Guide

## Why All Buttons Still Show

The code is correctly implemented, but the role detection needs real backend data to work.

## Current State

The implementation filters the sidebar based on `session.role`:
- `session.role === 'AUTH'` → Show only Verifications + Logout
- `session.role === 'ADMIN'` or `null` → Show all items (safety default)

**If you see all buttons**, it means `session.role` is `null` (unknown role).

---

## How to Debug

### Step 1: Open Browser DevTools Console

Press `F12` or Right-click → Inspect → Console tab

### Step 2: Login and Watch Console Logs

You should see these logs when logging in:

#### A. Role Detection Logs:
```
[getAdminRole] Login response: {...}
[getAdminRole] JWT payload: {...}
```

**Look for role in these fields**:
- `response.role` or `response.roles`
- `response.authorities`
- `response.scope`
- `payload.role` or `payload.roles`
- `payload.authorities`
- `payload.scope`

#### B. Sidebar Render Log:
```
[AdminSidebar] Session role: "AUTH", isChecker: true
```
or
```
[AdminSidebar] Session role: null, isChecker: false
```

### Step 3: Interpret Results

| Console Shows | What It Means | Result |
|--------------|---------------|--------|
| `Session role: "AUTH", isChecker: true` | ✅ Role detected correctly | Only 2 buttons (Verifications + Logout) |
| `Session role: "ADMIN", isChecker: false` | ✅ Role detected correctly | All 13 buttons (full menu) |
| `Session role: null, isChecker: false` | ❌ Role not found | All 13 buttons (safety fallback) |

---

## Testing Checklist

### Test 1: Maker Account
**Email**: `admin.qa@nollywin.test`

1. ✅ Open DevTools Console
2. ✅ Login with maker credentials
3. ✅ Check console for:
   ```
   [getAdminRole] Login response: {...}
   [getAdminRole] JWT payload: {...}
   [AdminSidebar] Session role: ???
   ```
4. ✅ **Report**:
   - Which field contains the role? (e.g., `response.role`, `payload.authorities`)
   - What value? (e.g., `"ADMIN"`, `"ROLE_ADMIN"`, `["ADMIN"]`)
5. ✅ Expected: `Session role: "ADMIN"` → Shows all 13 buttons

### Test 2: Checker Account
**Email**: `checker.qa@nollywin.test`

1. ✅ Open DevTools Console (in incognito window)
2. ✅ Login with checker credentials
3. ✅ Check console for:
   ```
   [AdminLogin] Attempting maker login via /admin/auth/login
   [AdminLogin] Maker login failed with 401/403, trying checker fallback
   [AdminLogin] Checker login successful via fallback
   [getAdminRole] Login response: {...}
   [getAdminRole] JWT payload: {...}
   [AdminSidebar] Session role: ???
   ```
4. ✅ **Report**:
   - Which field contains the role?
   - What value? (e.g., `"AUTH"`, `"ROLE_AUTH"`, `["AUTH"]`)
   - Did login use fallback or normal endpoint?
5. ✅ Expected: `Session role: "AUTH"` → Shows **ONLY 2 buttons**:
   - Verifications
   - Logout

### Test 3: Unknown Account (Normal Player)
**Email**: Any player account

1. ✅ Try to login
2. ✅ Expected: Error message "This account doesn't have admin access."

---

## What to Report

### For Each Account (Maker & Checker):

Copy the console output and answer:

1. **Login Response** (from `[getAdminRole] Login response:`):
   ```json
   {
     "accessToken": "...",
     "email": "...",
     "role": "???",  // ← Does this field exist?
     "roles": ["???"],  // ← Or this?
     "authorities": ["???"],  // ← Or this?
     "scope": "???"  // ← Or this?
   }
   ```

2. **JWT Payload** (from `[getAdminRole] JWT payload:`):
   ```json
   {
     "sub": "...",
     "email": "...",
     "role": "???",  // ← Does this field exist?
     "roles": ["???"],  // ← Or this?
     "authorities": ["???"],  // ← Or this?
     "scope": "???"  // ← Or this?
   }
   ```

3. **Sidebar State** (from `[AdminSidebar]`):
   ```
   Session role: ???, isChecker: ???
   ```

4. **Visual Result**:
   - How many buttons in sidebar?
   - Which buttons are visible?

---

## Expected Final Behavior

### Checker Login (AUTH role):
- Console: `[AdminSidebar] Session role: "AUTH", isChecker: true`
- Sidebar: **Only 2 items**
  - ✅ Verifications (ShieldCheck icon)
  - ✅ Logout (LogOut icon)
- No other buttons visible
- No search bar in top bar
- Clicking logo → `/admin/change-requests`

### Maker Login (ADMIN role):
- Console: `[AdminSidebar] Session role: "ADMIN", isChecker: false`
- Sidebar: **All 13 items**
  - Overview
  - Trivia Setup
  - Game Settings
  - Packages
  - Token Rate
  - Users
  - Reports
  - Rewards
  - Client Sync
  - Verifications
  - Notifications
  - Payments
  - Audit Log
  - Logout
- Search bar visible
- Clicking logo → `/admin/overview`

---

## If Role is NOT Detected

If console shows `Session role: null`, the role field doesn't exist in the expected locations.

### Next Steps:
1. Copy the full `Login response` and `JWT payload` from console
2. Send to developer to identify actual role field
3. Update `getAdminRole()` function to check that field
4. Remove temp debug logging after role is confirmed

---

## After Role is Confirmed

### Remove Debug Logging:

**File**: `components/layout/admin-sidebar.tsx`

Remove:
```typescript
// TEMP: Debug logging
if (process.env.NODE_ENV === 'development') {
  console.debug('[AdminSidebar] Session role:', session?.role, 'isChecker:', isChecker);
}
```

**File**: `store/admin-auth-store.ts`

Remove:
```typescript
// TEMP DEV LOGGING: Remove after identifying role field
if (process.env.NODE_ENV === 'development') {
  console.debug('[getAdminRole] Login response:', loginResponse);
  const payload = decodeJWTPayload(token);
  console.debug('[getAdminRole] JWT payload:', payload);
}
```

**Keep**:
- `[AdminLogin]` logs (useful for debugging login flow)
- Unknown role warning (safety check)

---

## Quick Visual Check

**Checker logged in → Sidebar should look like this:**
```
┌─────────────────────┐
│  [Logo]             │
│                     │
│  🛡️ Verifications   │  ← Only this
│  🚪 Logout          │  ← and this
│                     │
│  (nothing else)     │
└─────────────────────┘
```

**Maker logged in → Sidebar shows all 13 items + Logout**

If you see all items for checker, role detection is not working yet.
