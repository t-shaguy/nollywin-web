# Admin Role-Based Navigation Implementation

## Overview
Implemented role-based navigation for admin panel to restrict CHECKER (AUTH role) access to only Verifications page, while MAKER (ADMIN role) retains full menu access.

## 1. Role Detection - NEEDS REAL DATA TESTING

### Temporary Dev Logging Added
**Location**: `store/admin-auth-store.ts` in `getAdminRole()` function

```typescript
// TEMP DEV LOGGING: Remove after identifying role field
if (process.env.NODE_ENV === 'development') {
  console.debug('[getAdminRole] Login response:', loginResponse);
  const payload = decodeJWTPayload(token);
  console.debug('[getAdminRole] JWT payload:', payload);
}
```

### What to Check
When testing with real accounts:
- **Maker**: `admin.qa@nollywin.test`
- **Checker**: `checker.qa@nollywin.test`

Look in browser console for:
1. `[getAdminRole] Login response:` - Check for role in response body
2. `[getAdminRole] JWT payload:` - Check for role in JWT claims
3. Common field names checked (in order):
   - `role` (string)
   - `roles` (array)
   - `authorities` (array, Spring Security format)
   - `scope` (string, space-separated)

### Expected Values
- Maker role: `"ADMIN"` or `"ROLE_ADMIN"`
- Checker role: `"AUTH"` or `"ROLE_AUTH"`

### Current Implementation
The `getAdminRole()` function checks all common JWT role locations:
- Direct properties in login response
- JWT token claims (decoded)
- Handles both string and array formats
- Strips `ROLE_` prefix if present
- Unknown role → treated as ADMIN (full access) with dev warning

---

## 2. Admin Auth Store - Role Storage

**File**: `store/admin-auth-store.ts`

### Changes Made:
1. **Added Role Type**:
   ```typescript
   type AdminRole = "ADMIN" | "AUTH" | null;
   ```

2. **Updated Session Structure**:
   ```typescript
   session: { token: string; admin: { email: string }; role: AdminRole } | null
   ```

3. **JWT Decoder**:
   ```typescript
   function decodeJWTPayload(token: string): Record<string, unknown> | null
   ```
   - Decodes JWT payload using `atob()`
   - Handles base64url encoding
   - Returns null on parse errors

4. **Role Extractor**:
   ```typescript
   function getAdminRole(loginResponse, token): AdminRole
   ```
   - Checks login response first
   - Falls back to JWT claims
   - Handles multiple field formats
   - Returns null for unknown roles (treated as ADMIN)

5. **Updated setSession()**:
   ```typescript
   setSession: (token, admin, loginResponse?) => {
     const role = getAdminRole(loginResponse, token);
     set({ session: { token, admin, role } });
   }
   ```

6. **Hydration Fix**:
   ```typescript
   onRehydrateStorage: () => (state) => {
     if (state?.session && !state.session.role) {
       const role = getAdminRole(undefined, state.session.token);
       state.session.role = role;
     }
   }
   ```
   - Re-derives role from token on page load if missing
   - Ensures persisted sessions get role assigned

---

## 3. Admin Login - Role-Based Routing

**File**: `app/features/admin/presentation/admin-login-form.tsx`

### Changes:
1. Pass full login response to `setSession()`:
   ```typescript
   setSession(res.accessToken, { email: res.email }, res);
   ```

2. Role-based redirect after login:
   ```typescript
   const session = useAdminAuthStore.getState().session;
   if (session?.role === 'AUTH') {
     router.push("/admin/change-requests");  // Checker
   } else {
     router.push("/admin/overview");         // Maker
   }
   ```

3. Fallback login (checker via player endpoint):
   ```typescript
   setSession(fallbackRes.accessToken, { email: fallbackRes.email }, fallbackRes);
   router.push("/admin/change-requests");  // Always Verifications for fallback
   ```

---

## 4. Sidebar Navigation - Filtered Menu

**File**: `components/layout/admin-sidebar.tsx`

### Changes:
1. Get role from session:
   ```typescript
   const session = useAdminAuthStore((s) => s.session);
   const isChecker = session?.role === 'AUTH';
   ```

2. Filter nav items:
   ```typescript
   const visibleNavItems = isChecker 
     ? NAV_ITEMS.filter(item => item.href === '/admin/change-requests')
     : NAV_ITEMS;
   ```

### Result:
- **Checker sees**:
  - Verifications
  - Logout
- **Maker sees**: All menu items (unchanged)

### Applies To:
- Desktop sidebar
- Mobile sidebar (same component)

---

## 5. Top Bar - Hidden Search for Checkers

**File**: `components/layout/admin-top-bar.tsx`

### Changes:
1. Get role:
   ```typescript
   const session = useAdminAuthStore((s) => s.session);
   const isChecker = session?.role === 'AUTH';
   ```

2. Conditional search bar:
   ```typescript
   {!isChecker && (
     <div className="relative flex-1 max-w-md">
       <Search ... />
       <Input placeholder="Search..." />
     </div>
   )}
   
   {isChecker && <div className="flex-1" />}  // Spacer
   ```

3. Show user initial:
   ```typescript
   {session?.admin?.email?.charAt(0).toUpperCase() || 'A'}
   ```

---

## 6. Route Guard - Redirect Unauthorized Access

**File**: `components/layout/admin-auth-guard.tsx`

### Changes:
1. Get role and pathname:
   ```typescript
   const pathname = usePathname();
   const isChecker = session?.role === 'AUTH';
   ```

2. Checker route restrictions:
   ```typescript
   if (isChecker) {
     const allowedPaths = ['/admin/change-requests', '/admin/login'];
     const isAllowedPath = allowedPaths.some(path => 
       pathname === path || pathname?.startsWith(path + '/')
     );
     
     if (!isAllowedPath) {
       router.replace("/admin/change-requests");
     }
   }
   ```

3. Redirect from /admin or /admin/overview:
   ```typescript
   if (isChecker && (pathname === '/admin' || pathname === '/admin/overview')) {
     router.replace("/admin/change-requests");
   }
   ```

### Behavior:
- Checker accessing `/admin/rewards` → redirected to `/admin/change-requests`
- Checker accessing `/admin/overview` → redirected to `/admin/change-requests`
- Checker accessing `/admin` → redirected to `/admin/change-requests`
- Maker: no restrictions

---

## 7. Logout - Role Cleared

**File**: `store/admin-auth-store.ts`

```typescript
logout: () => set({ session: null })
```

Clears entire session including role.

---

## Files Modified

1. **`store/admin-auth-store.ts`**:
   - Added `AdminRole` type
   - Added `role` to session structure
   - Added `decodeJWTPayload()` function
   - Added `getAdminRole()` function with dev logging
   - Updated `setSession()` to extract and store role
   - Added `onRehydrateStorage` to re-derive role from token

2. **`app/features/admin/presentation/admin-login-form.tsx`**:
   - Pass login response to `setSession()`
   - Role-based redirect after login
   - Checker goes to `/admin/change-requests`
   - Maker goes to `/admin/overview`

3. **`components/layout/admin-sidebar.tsx`**:
   - Filter nav items for checkers
   - Show only Verifications + Logout for AUTH role
   - Full menu for ADMIN role or unknown role

4. **`components/layout/admin-top-bar.tsx`**:
   - Hide search bar for checkers
   - Show user email initial in avatar

5. **`components/layout/admin-auth-guard.tsx`**:
   - Added pathname-based routing
   - Redirect checkers from unauthorized pages
   - Redirect from `/admin` and `/admin/overview` to `/admin/change-requests`

---

## Verification Checklist

### Maker Account (admin.qa@nollywin.test):
- ✅ Build passes
- ⏳ Login successful (normal path, not fallback)
- ⏳ Redirects to `/admin/overview`
- ⏳ Full menu visible (all items)
- ⏳ Search bar visible
- ⏳ Can navigate to all pages
- ⏳ **Dev Console**: Check `[getAdminRole]` logs for role field location
- ⏳ **Report**: Which field contains "ADMIN" role?

### Checker Account (checker.qa@nollywin.test):
- ✅ Build passes
- ⏳ Login successful (via fallback or normal if backend updated)
- ⏳ Redirects to `/admin/change-requests`
- ⏳ **Desktop**: Only Verifications + Logout in sidebar
- ⏳ **Mobile** (toggle menu): Only Verifications + Logout
- ⏳ Search bar hidden
- ⏳ Typing `/admin/rewards` in URL redirects to `/admin/change-requests`
- ⏳ Typing `/admin/overview` in URL redirects to `/admin/change-requests`
- ⏳ Typing `/admin` redirects to `/admin/change-requests`
- ⏳ Page refresh keeps restricted menu (role persisted and re-derived)
- ⏳ Status tabs (Pending/Approved/Rejected/All) work
- ⏳ Approve/Reject actions work
- ⏳ Own requests greyed out (from previous fix)
- ⏳ **Dev Console**: Check `[getAdminRole]` logs for role field location
- ⏳ **Report**: Which field contains "AUTH" role?
- ⏳ **Report**: Did checker login use normal path or fallback?

### Incognito Testing:
- ⏳ Checker in incognito window: restricted menu
- ⏳ Maker in normal window: full menu
- ⏳ Both work simultaneously

---

## Dev Logging to Remove

After identifying the role field location:

**File**: `store/admin-auth-store.ts`

Remove these lines from `getAdminRole()`:
```typescript
// TEMP DEV LOGGING: Remove after identifying role field
if (process.env.NODE_ENV === 'development') {
  console.debug('[getAdminRole] Login response:', loginResponse);
  const payload = decodeJWTPayload(token);
  console.debug('[getAdminRole] JWT payload:', payload);
}
```

**Do NOT remove**:
- `[AdminLogin]` logs (useful for debugging login flow)
- Role derivation warning:
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    console.warn('[getAdminRole] No valid role found, treating as ADMIN (full access)');
  }
  ```

---

## Debugging - Why All Buttons Still Show

The implementation is correct, but the role might not be properly detected yet. 

### Check Browser Console

When you log in, look for these debug logs:

1. **In `getAdminRole()`** (store/admin-auth-store.ts):
   ```
   [getAdminRole] Login response: {...}
   [getAdminRole] JWT payload: {...}
   ```

2. **In `AdminSidebar`** (components/layout/admin-sidebar.tsx):
   ```
   [AdminSidebar] Session role: null | "ADMIN" | "AUTH", isChecker: true/false
   ```

### If All Buttons Still Show:

This means `session.role` is `null` or `undefined`, which causes:
- `isChecker = false`
- All nav items shown (default behavior for unknown role)

**Likely causes**:
1. **Role field not found**: The backend might use a different field name than checked
2. **Login response missing role**: Need to check actual response structure
3. **JWT doesn't contain role**: Need to check actual token payload

### Expected Behavior After Role Detection:

**Checker (AUTH role):**
```
[AdminSidebar] Session role: "AUTH", isChecker: true
```
- Only shows: Verifications + Logout (2 items total)
- Logo links to /admin/change-requests

**Maker (ADMIN role):**
```
[AdminSidebar] Session role: "ADMIN", isChecker: false
```
- Shows all 13 nav items + Logout
- Logo links to /admin/overview

**Unknown role:**
```
[AdminSidebar] Session role: null, isChecker: false
[getAdminRole] No valid role found, treating as ADMIN (full access)
```
- Shows all 13 nav items + Logout (safety fallback)
- Logo links to /admin/overview

**This is UX-only routing restriction**. The backend still enforces all permissions on API endpoints. The client-side routing guard:
- Improves user experience (prevents accessing pages they can't use)
- Hides confusing UI elements (search, extra menu items)
- Does NOT provide security (backend validation required)

Comments in code do not claim this provides security.

---

## Unknown Role Behavior

If role cannot be determined from login response or JWT:
1. Logs warning in development: `[getAdminRole] No valid role found, treating as ADMIN (full access)`
2. Returns `null` as role
3. Treated as ADMIN (full menu, no restrictions)
4. User can navigate normally
5. Backend still enforces actual permissions

This ensures we don't accidentally lock out admins if role detection fails.

---

## Next Steps

1. **Test with real accounts** (maker and checker)
2. **Check dev console** for `[getAdminRole]` logs
3. **Report findings**:
   - Which field contains the role for maker?
   - Which field contains the role for checker?
   - Did checker login use normal admin endpoint or fallback?
4. **Remove dev logging** after role field is confirmed
5. **Update documentation** with actual field name if different from expected

---

## Expected Behavior Summary

| User | Login Endpoint | Redirects To | Sidebar Items | Search Bar | Can Access |
|------|---------------|--------------|---------------|------------|------------|
| Maker (ADMIN) | `/admin/auth/login` | `/admin/overview` | All 13 items | ✅ Visible | All pages |
| Checker (AUTH) | Fallback: `/api/v1/auth/login` | `/admin/change-requests` | 1 item only | ❌ Hidden | Verifications only |
| Unknown role | Any | `/admin/overview` | All 13 items | ✅ Visible | All pages |

**Logout**: Clears session and role, redirects to `/admin/login`
