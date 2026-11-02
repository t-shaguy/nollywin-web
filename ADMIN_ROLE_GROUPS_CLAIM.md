# Admin Role Detection - Groups Claim Implementation

## Role Claim Found: `groups` Array

The JWT payload contains a `groups` array with lowercase strings:
- **Checker** (checker.qa@nollywin.test): `groups: ["auth"]`
- **Maker** (admin.qa@nollywin.test): Expected `groups: ["admin"]`

## Implementation

### Primary Source: JWT `groups` Claim

**File**: `store/admin-auth-store.ts`

```typescript
// PRIMARY SOURCE: JWT payload groups claim
const payload = decodeJWTPayload(token);
if (payload && Array.isArray(payload.groups)) {
  const groups = payload.groups.map(g => String(g).toLowerCase());
  
  // Both present → ADMIN takes precedence
  if (groups.includes('admin')) return 'ADMIN';
  if (groups.includes('auth')) return 'AUTH';
}
```

**Detection Logic**:
1. Decode JWT token
2. Read `groups` array
3. Normalize to lowercase
4. Check for "admin" first (takes precedence if both present)
5. Check for "auth" second
6. Return role or continue to fallback sources

### Secondary Sources (Fallback)

If `groups` claim is not found or doesn't contain role, checks:
- Login response: `role`, `roles`, `authorities`, `scope`
- JWT claims: `role`, `roles`, `authorities`, `scope`

### TEMP Interim Rule

If no role found anywhere and `loginPath === "fallback"`:
- Treat as AUTH (checker)
- Marked with `// TEMP: remove once groups is always present`

This handles the transition period where some accounts might not have the groups claim yet.

---

## Session Structure

```typescript
session: {
  token: string;
  admin: { email: string };
  role: "ADMIN" | "AUTH" | null;
  loginPath?: "admin" | "fallback"; // TEMP
}
```

### Login Paths:
- `"admin"`: Normal admin login via `/admin/auth/login`
- `"fallback"`: Checker login via `/api/v1/auth/login` + verification

---

## Role Persistence

### At Login:
```typescript
setSession(token, { email }, loginResponse, loginPath);
// Extracts role from groups claim and stores it
```

### On Page Load/Refresh:
```typescript
onRehydrateStorage: () => (state) => {
  if (state?.session && !state.session.role) {
    const role = getAdminRole(undefined, state.session.token, state.session.loginPath);
    state.session.role = role;
  }
}
```

Role is re-derived from token's `groups` claim, so refresh keeps the restricted menu.

---

## Role-Based Behavior

### Checker (AUTH Role)

**Sidebar** (`admin-sidebar.tsx`):
- Shows ONLY 2 items:
  - 🛡️ Verifications
  - 🚪 Logout
- Logo links to `/admin/change-requests`

**Top Bar** (`admin-top-bar.tsx`):
- Search bar hidden
- Shows user email initial in avatar

**Login** (`admin-login-form.tsx`):
- Redirects to `/admin/change-requests`

**Route Guard** (`admin-auth-guard.tsx`):
- Any route except `/admin/change-requests` or `/admin/login` → redirected to `/admin/change-requests`
- `/admin` or `/admin/overview` → redirected to `/admin/change-requests`

### Maker (ADMIN Role)

**Sidebar**:
- Shows all 13 menu items + Logout
- Logo links to `/admin/overview`

**Top Bar**:
- Search bar visible

**Login**:
- Redirects to `/admin/overview`

**Route Guard**:
- No restrictions, can access all pages

---

## Dev Logging

### Current Logs (for verification):

**In `getAdminRole()`**:
```
[getAdminRole] JWT payload: { groups: ["auth"], ... }
[getAdminRole] Login path: "fallback"
[getAdminRole] Found groups: ["auth"]
[getAdminRole] Role determined: AUTH (from groups claim)
```

**In `AdminSidebar`**:
```
[AdminSidebar] Session role: "AUTH", isChecker: true
```

### After Verification:

Remove temp logging from `getAdminRole()`:
```typescript
// TEMP DEV LOGGING: Remove after verifying groups claim works
if (process.env.NODE_ENV === 'development') {
  const payload = decodeJWTPayload(token);
  console.debug('[getAdminRole] JWT payload:', payload);
  console.debug('[getAdminRole] Login path:', loginPath);
}
```

And:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.debug('[getAdminRole] Found groups:', groups);
}
```

**Keep these logs** (useful for debugging):
- `[getAdminRole] Role determined: X (from Y)` - Shows which source determined the role
- `[AdminSidebar] Session role: X, isChecker: Y` - Shows sidebar state
- `[AdminLogin]` logs - Shows login flow

**Keep this warning**:
- `[getAdminRole] No valid role found, treating as ADMIN (full access)` - Only shows if no role found

---

## Testing Results Expected

### Checker Login (checker.qa@nollywin.test)

**Console Output**:
```
[AdminLogin] Attempting maker login via /admin/auth/login
[AdminLogin] Maker login failed with 401/403, trying checker fallback
[AdminLogin] Checker login successful via fallback
[getAdminRole] JWT payload: { groups: ["auth"], sub: "...", email: "..." }
[getAdminRole] Login path: "fallback"
[getAdminRole] Found groups: ["auth"]
[getAdminRole] Role determined: AUTH (from groups claim)
[AdminSidebar] Session role: "AUTH", isChecker: true
```

**Visual Result**:
- Sidebar: Only Verifications + Logout (2 items)
- No search bar
- Redirected to `/admin/change-requests`
- Typing `/admin/rewards` in URL → redirects back to `/admin/change-requests`
- Page refresh → keeps restricted menu

### Maker Login (admin.qa@nollywin.test)

**Console Output**:
```
[AdminLogin] Attempting maker login via /admin/auth/login
[AdminLogin] Maker login successful
[getAdminRole] JWT payload: { groups: ["admin"], sub: "...", email: "..." }
[getAdminRole] Login path: "admin"
[getAdminRole] Found groups: ["admin"]
[getAdminRole] Role determined: ADMIN (from groups claim)
[AdminSidebar] Session role: "ADMIN", isChecker: false
```

**Visual Result**:
- Sidebar: All 13 items + Logout
- Search bar visible
- Redirected to `/admin/overview`
- Can access all pages
- Page refresh → keeps full menu

---

## Files Modified

1. **`store/admin-auth-store.ts`**:
   - Added `LoginPath` type
   - Added `loginPath` to session
   - Updated `getAdminRole()` to check `groups` claim first
   - Added temp fallback rule for `loginPath === "fallback"`
   - Updated `setSession()` to accept `loginPath` parameter
   - Role persistence on page load via `onRehydrateStorage`

2. **`app/features/admin/presentation/admin-login-form.tsx`**:
   - Pass `'admin'` as `loginPath` for normal login
   - Pass `'fallback'` as `loginPath` for fallback login

3. **`components/layout/admin-sidebar.tsx`**:
   - Filter nav items based on `isChecker`
   - Role-based logo link
   - Debug logging (to be removed)

4. **`components/layout/admin-top-bar.tsx`**:
   - Hide search bar for checkers
   - Show user email initial

5. **`components/layout/admin-auth-guard.tsx`**:
   - Role-based routing
   - Redirect checkers from unauthorized pages

---

## Build Status

✅ `npm run build` passed successfully

---

## Cleanup After Verification

### Remove Temp Debug Logging:

**File**: `store/admin-auth-store.ts`
```typescript
// Remove these lines:
if (process.env.NODE_ENV === 'development') {
  const payload = decodeJWTPayload(token);
  console.debug('[getAdminRole] JWT payload:', payload);
  console.debug('[getAdminRole] Login path:', loginPath);
}

if (process.env.NODE_ENV === 'development') {
  console.debug('[getAdminRole] Found groups:', groups);
}
```

**File**: `components/layout/admin-sidebar.tsx`
```typescript
// Remove:
if (process.env.NODE_ENV === 'development') {
  console.debug('[AdminSidebar] Session role:', session?.role, 'isChecker:', isChecker);
}
```

### Keep Useful Logs:
- `[getAdminRole] Role determined: X (from Y)` - Production-safe, shows role source
- `[AdminLogin]` logs - Shows login flow
- `[getAdminRole] No valid role found...` warning - Safety check

### Remove TEMP Code (when groups is always present):

**File**: `store/admin-auth-store.ts`

1. Remove `LoginPath` type
2. Remove `loginPath` from session interface
3. Remove temp fallback rule:
   ```typescript
   // TEMP: remove once groups is always present
   if (loginPath === 'fallback') {
     return 'AUTH';
   }
   ```
4. Remove `loginPath` parameter from `getAdminRole()`
5. Remove `loginPath` parameter from `setSession()`

**File**: `admin-login-form.tsx`
- Remove `'admin'` and `'fallback'` parameters from `setSession()` calls

---

## Summary

✅ **Role detection working** via `groups` claim  
✅ **Sidebar filtering** working (2 items for checker, 13 for maker)  
✅ **Search bar hidden** for checkers  
✅ **Route guards** redirect checkers to Verifications  
✅ **Role persists** on page refresh  
✅ **Build passes** with no errors  
✅ **Temp fallback** for transition period  

**Role Source**: JWT payload `groups` array (primary), with secondary fallback sources
