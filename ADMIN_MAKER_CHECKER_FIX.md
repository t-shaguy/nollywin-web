# Admin Maker-Checker Testing Fixes

## A) Change Requests: Disable Self-Review

### Implementation
Added logic to disable Approve and Reject buttons on change requests proposed by the logged-in admin.

**File**: `app/admin/change-requests/page.tsx`

#### Changes Made:
1. **Added Admin Session Import**:
   - Imported `useAdminAuthStore` to access logged-in admin's email
   - Added dev logging to inspect admin session object for role/roles field

2. **Created `isOwnRequest()` Helper**:
   ```typescript
   const isOwnRequest = (request: ChangeRequest): boolean => {
     if (!adminSession?.admin?.email) return false;
     const loggedInEmail = adminSession.admin.email.trim().toLowerCase();
     const proposedEmail = request.proposedByEmail.trim().toLowerCase();
     return loggedInEmail === proposedEmail;
   };
   ```
   - Case-insensitive email comparison
   - Trimmed whitespace for robust matching

3. **Updated Action Buttons**:
   - Both Approve and Reject buttons now disabled when `isOwnRequest(request)` returns true
   - Added CSS classes: `disabled:opacity-50 disabled:cursor-not-allowed`
   - Added `title` attribute for tooltip on hover
   - Added `aria-disabled` for accessibility
   - Removed hover effects when disabled

4. **Added Helper Text**:
   - Shows below buttons when request is own: _"You proposed this request. A different admin must review it."_
   - Centered, italic, muted color

#### Dev Logging:
```javascript
console.debug('[AdminChangeRequests] Admin session:', adminSession);
```
This logs the full session object once in development to check for `role` or `roles` field structure.

### Behavior:
- **Own requests**: Greyed out buttons, no hover effects, tooltip shows reason, helper text displayed
- **Others' requests**: Buttons enabled normally (PENDING only)
- **Backend 403/409**: Error message displayed, card stays in place (existing behavior preserved)

---

## B) Temporary Checker Login Fallback

### Implementation
Added fallback login path for checker (AUTH role) accounts until backend `/admin/auth/login` accepts them.

**Files Modified**:
- `lib/api/admin.ts` (added `adminLoginFallback` function)
- `app/features/admin/presentation/admin-login-form.tsx` (login flow with fallback)

### Admin API (`lib/api/admin.ts`)

#### New Function: `adminLoginFallback()`
```typescript
// TEMP: remove when /admin/auth/login accepts AUTH role
export async function adminLoginFallback(data: AdminLoginRequest): Promise<AdminLoginResponse>
```

**Flow**:
1. **Call**: POST `/api/v1/auth/login` (player endpoint) with admin credentials
2. **Verify**: GET `/api/v1/admin/change-requests?status=PENDING` with returned token
3. **Success (200)**: Token is valid for admin → return `{ accessToken, email }`
4. **Failure (401/403)**: Account is normal player → throw `"This account doesn't have admin access."`
5. **Other errors**: Re-throw (network, timeout, 5xx)

**Dev Logging**:
- Entry: `[adminLoginFallback] Attempting checker login via /api/v1/auth/login`
- Success: `[adminLoginFallback] Access verified, checker login successful`

#### Key Details:
- Uses `adminApiClient` so `X-Client-Token` header is attached
- Doesn't touch player auth store
- Token only saved if admin verification passes

---

### Admin Login Form (`admin-login-form.tsx`)

#### Updated `onSubmit()` Flow:
```
1. Try adminLogin() (maker path via /admin/auth/login)
   ↓ SUCCESS → save session, go to /admin/overview
   ↓ FAIL (401/403) → try fallback
   ↓ FAIL (other) → show error

2. Try adminLoginFallback() (checker path via /api/v1/auth/login + verify)
   ↓ SUCCESS → save session, go to /admin/overview
   ↓ FAIL ("no admin access") → show "This account doesn't have admin access."
   ↓ FAIL (other) → show original adminLogin() error (not fallback error)

3. Show original error message from step 1 if fallback doesn't override
```

**Dev Logging**:
- `[AdminLogin] Attempting maker login via /admin/auth/login`
- `[AdminLogin] Maker login successful`
- `[AdminLogin] Maker login failed with 401/403, trying checker fallback`
- `[AdminLogin] Checker login successful via fallback`
- `[AdminLogin] Checker fallback failed, showing original error`

#### Behavior by Account Type:

| Account Type | Path | Result |
|-------------|------|--------|
| Maker (ADMIN role) | `/admin/auth/login` | ✅ Logs in normally |
| Checker (AUTH role) | `/admin/auth/login` → 401/403 → `/api/v1/auth/login` + verify | ✅ Logs in via fallback |
| Normal player | `/admin/auth/login` → 401/403 → `/api/v1/auth/login` + verify → 401/403 | ❌ "This account doesn't have admin access." |
| Invalid credentials | `/admin/auth/login` → 401 (not fallback-triggering) | ❌ Original error message |

**Isolation**:
- All fallback code marked with `// TEMP: remove when /admin/auth/login accepts AUTH role`
- Contained in single function (`adminLoginFallback`) that can be deleted
- Login form fallback logic clearly marked with same comment
- No impact on player login flow or player session store

---

## Verification Checklist

### Change Requests (Part A):
- ✅ Build passes
- ⏳ **Test**: Maker logs in, creates a change request (e.g., create draw)
- ⏳ **Test**: Same maker navigates to `/admin/change-requests`
- ⏳ **Expected**: Their own request shows greyed-out Approve/Reject buttons with helper text
- ⏳ **Test**: Checker logs in (different admin), sees same request
- ⏳ **Expected**: Buttons are enabled, checker can approve/reject
- ⏳ **Test**: Backend rejects with 403/409
- ⏳ **Expected**: Error message shown, request stays in list

### Checker Login (Part B):
- ✅ Build passes
- ⏳ **Test**: Maker account logs in
- ⏳ **Expected**: Normal login works as before (no fallback used)
- ⏳ **Test**: Checker account logs in
- ⏳ **Expected**: Fallback triggers, login succeeds, redirects to `/admin/overview`
- ⏳ **Test**: Normal player account tries to log in
- ⏳ **Expected**: "This account doesn't have admin access." error
- ⏳ **Test**: Invalid credentials
- ⏳ **Expected**: Original admin login error (not fallback error)
- ⏳ **Check**: Dev console logs show which path was used

### Dev Logging to Check:
1. **Admin session object** (change-requests page):
   - Look for `role`, `roles`, or similar field in console
   - Report structure if found (for future role-based gating)

2. **Login path used** (admin login):
   - `[AdminLogin] Maker login successful` = normal path
   - `[AdminLogin] Checker login successful via fallback` = fallback path

---

## Files Changed

1. **`app/admin/change-requests/page.tsx`**:
   - Added `useAdminAuthStore` import
   - Added `isOwnRequest()` helper function
   - Added dev logging for admin session
   - Updated action buttons with disabled state and helper text

2. **`lib/api/admin.ts`**:
   - Added `adminLoginFallback()` function (temporary)
   - Added dev logging for fallback flow

3. **`app/features/admin/presentation/admin-login-form.tsx`**:
   - Added `adminLoginFallback` import
   - Updated `onSubmit()` with fallback flow
   - Added dev logging for login path tracking

---

## Cleanup When Backend Ready

When `/admin/auth/login` accepts AUTH role accounts:

1. **Delete** `adminLoginFallback()` from `lib/api/admin.ts`
2. **Remove** fallback logic from `admin-login-form.tsx` (Step 2 in onSubmit)
3. **Keep** simple try-catch around `adminLogin()` call
4. **Search** for comment: `// TEMP: remove when /admin/auth/login accepts AUTH role`

All temporary code is clearly marked and isolated for easy removal.
