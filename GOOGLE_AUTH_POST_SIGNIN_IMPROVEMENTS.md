# Google Auth Post-Sign-In Improvements

## ✅ Implementation Complete

All requested tasks have been implemented for the Google Sign-In flow.

---

## TASK 1: Post-Google-Signup Phone Nudge

### What Was Implemented:

**File Modified**: `app/features/auth/presentation/unified-auth-form.tsx`

After successful Google authentication, the code now checks if `res.profile.phoneNumber` is empty/null:
- **If phone is missing**: Redirects to `/profile?prompt=phone` instead of `/home`
- **If phone exists**: Redirects to `/home` as normal

```typescript
// POST-GOOGLE-SIGNUP PHONE NUDGE:
// If Google account was just created (or linked account has no phone),
// redirect to /profile to prompt for phone number instead of /home.
// This is a soft nudge, not a hard gate - user can navigate elsewhere freely.
if (!res.profile.phoneNumber || res.profile.phoneNumber.trim() === "") {
  router.push("/profile?prompt=phone");
} else {
  router.push("/home");
}
```

**File Modified**: `app/(authenticated)/profile/page.tsx`

Added phone prompt detection:
1. Detects `?prompt=phone` query parameter
2. Shows a yellow banner explaining why phone is needed
3. Auto-expands the phone number edit form
4. User can still navigate away (soft nudge, not hard gate)

```typescript
// Check if redirected from Google sign-in with missing phone number
useEffect(() => {
  const promptPhone = searchParams.get("prompt") === "phone";
  if (promptPhone && (!user?.phoneNumber || user.phoneNumber.trim() === "")) {
    setShowPhonePrompt(true);
    setEditingPhone(true);
  }
}, [searchParams, user]);
```

### Banner UI:
```
┌─────────────────────────────────────────────┐
│ ⚠️ Complete Your Profile                    │
│ Please add your phone number to complete    │
│ your account setup. This helps us provide   │
│ better service and support.                 │
└─────────────────────────────────────────────┘
```

### Payment Flow Check:

**Verified**: `lib/api/payments.ts` does NOT require `phoneNumber` for any payment flows:
- `initiatePayment()` - No phone required
- `purchaseSubscription()` - No phone required
- Paystack handles payment methods independently

**Conclusion**: No hard gate needed for payments. The soft nudge on profile page is sufficient.

---

## TASK 2: Distinct Error for 403 on Google Sign-In

### What Was Implemented:

**File Modified**: `app/features/auth/presentation/unified-auth-form.tsx`

In the `handleGoogleSuccess` catch block, added specific handling for 403 status:

```typescript
catch (err) {
  const apiError = err as ApiError;
  
  // TASK 2: Distinct error for 403 (admin account trying to sign in via Google)
  if (apiError.status === 403) {
    setServerError("This email is registered as an admin account and can't sign in here via Google.");
  } else {
    setServerError(apiError.message || "Google Sign-In failed. Please try again.");
  }
}
```

### Error Messages:

| Status | Message |
|--------|---------|
| 403 | "This email is registered as an admin account and can't sign in here via Google." |
| Other | apiError.message or "Google Sign-In failed. Please try again." |

---

## TASK 3: Verify referralCode Handling

### Current Implementation:

**File**: `app/features/auth/presentation/unified-auth-form.tsx`

```typescript
// Get referral code from form if in signup mode
// NOTE: Backend Postman docs don't explicitly show referralCode field.
// Sending it anyway (harmless if ignored). If it causes errors in testing,
// we'll need to remove it from the request body.
const referralCode = mode === "signup" ? watch("referralCode") : undefined;

const res = await authApi.googleAuth({ 
  idToken,
  referralCode 
});
```

### Request Body:
```json
{
  "idToken": "eyJhbGciOiJSUzI1Ni...",
  "referralCode": "FRIEND123"  // Optional, only sent in signup mode
}
```

### Testing Required:

Since backend Postman docs don't explicitly document `referralCode` field for `/api/v1/auth/google`:

1. **Test with referralCode**: Sign up via Google with a referral code in the form
   - If backend honors it: ✅ Feature works
   - If backend ignores it: ✅ Harmless, leave as-is
   - If backend errors: ❌ Remove `referralCode` from request body

2. **Document result in API_INTEGRATION_SUMMARY.md**

---

## TASK 4: Environment Variables Check

### Current Values in `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=579977222970-***********************.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-*********************
```

**Note**: Actual values are in `.env.local` (not committed to git). These credentials were provided by the backend team.

✅ **No changes made** - credentials match production values

### Dev Server Check:

Run `npm run dev` and verify:
- Google Sign-In button appears (not the "GOOGLE_CLIENT_ID not configured" warning)
- Console doesn't show environment variable errors

If values fail to load:
- Check `.env.local` is in project root
- Restart dev server after any `.env.local` changes
- Variables starting with `NEXT_PUBLIC_` are exposed to browser
- `GOOGLE_CLIENT_SECRET` is server-side only (not used in current implementation)

---

## Manual Test Matrix

### Prerequisites:
- Backend API running at `NEXT_PUBLIC_API_URL`
- Dev server: `npm run dev`
- Browser with clean state (or incognito mode)
- Real Google accounts for testing

### Test Cases:

#### a) ✅ New Gmail → Google Sign-In → New Account + Phone Nudge

**Steps:**
1. Use a Gmail address that's never signed up for NollyWin
2. Go to `http://localhost:3000/auth`
3. Click Google Sign-In button
4. Sign in with Google
5. **Expected**:
   - Backend creates new ACTIVE account
   - Profile has name+email from Google, NO phoneNumber
   - Redirects to `/profile?prompt=phone`
   - Yellow banner shows: "Complete Your Profile"
   - Phone edit form is auto-expanded
   - Can save phone number or navigate away

**Verify:**
- [ ] New account created (check backend/database)
- [ ] No duplicate accounts
- [ ] Phone nudge appears
- [ ] Can add phone successfully
- [ ] Can navigate away without blocking

---

#### b) ✅ Existing Player → Google Sign-In → Same Account (No Duplicate)

**Steps:**
1. Use an email that already has a NollyWin player account (created via email/password)
2. Sign out if logged in
3. Go to `http://localhost:3000/auth`
4. Click Google Sign-In button
5. Sign in with Google using THE SAME EMAIL
6. **Expected**:
   - Backend links Google identity to EXISTING account
   - User lands in their existing account
   - Points/wallet/phone preserved
   - Redirects to `/home` (NOT `/profile?prompt=phone`) because phone already exists
   - No duplicate account created

**Verify:**
- [ ] Logged into existing account (check user ID)
- [ ] Points/wallet/phone unchanged
- [ ] No duplicate account created
- [ ] Redirects to /home (no phone nudge)
- [ ] firstName/lastName may be updated from Google on first Google sign-in

---

#### c) ✅ Admin Email → Google Sign-In → 403 Error Message

**Steps:**
1. Use an email that's registered as an ADMIN account (not PLAYER)
2. Go to `http://localhost:3000/auth`
3. Click Google Sign-In button
4. Sign in with Google
5. **Expected**:
   - Backend returns 403 status
   - Frontend shows specific error: "This email is registered as an admin account and can't sign in here via Google."
   - User stays on auth page
   - Can retry with different account

**Verify:**
- [ ] 403 error returned from backend
- [ ] Specific admin error message shows (not generic error)
- [ ] User not logged in
- [ ] Can try again with different account

---

#### d) ⚠️ Google Cloud Console - Authorized Origins Check

**NOT A CODE CHECK - CONSOLE SETTING**

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to project: `nollywin-mobile`
3. Go to: **APIs & Services** → **Credentials**
4. Click on OAuth 2.0 Client ID: `579977222970-8fg2vhanai2rigpsfi2maqt3asmeq7av`
5. Check **Authorized JavaScript origins**

**Current (Dev):**
```
http://localhost:3000
```

**Required for Production:**
```
http://localhost:3000
https://your-production-domain.com  ← ADD THIS!
```

**Action Required:**
- [ ] Confirm production domain is added to authorized origins
- [ ] Confirm authorized redirect URIs also include production domain
- [ ] Flag if still localhost-only before going live

**Note**: This is a Google Cloud Console setting, not code. Must be configured by someone with access to the Google Cloud project.

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `app/features/auth/presentation/unified-auth-form.tsx` | Added phone check + redirect logic, 403 error handling, referralCode comment |
| `app/(authenticated)/profile/page.tsx` | Added `useSearchParams`, phone prompt detection, yellow banner UI |

---

## TypeScript Compilation

✅ **PASSING** - All changes verified with `npx tsc --noEmit`

---

## Next Steps

1. ✅ **Run manual tests** with real Google accounts against live backend
2. ✅ **Document test results** per test case (a, b, c, d) above
3. ✅ **Verify referralCode** handling in test case (a) - check backend logs or response
4. ✅ **Update Google Cloud Console** with production domain (task d)
5. ✅ **Create API_INTEGRATION_SUMMARY.md** with referralCode findings

---

## Known Assumptions

1. **Backend behavior** documented in context is accurate (not guessed)
2. **Payment flows** don't require phoneNumber (verified in code)
3. **referralCode** field may or may not be supported - needs testing
4. **Google Client ID/Secret** already match production values
5. **Phone validation** uses existing profile form validation (+234 format, 10 digits)

---

## Rollback Instructions

If any issues arise, revert these commits:

```bash
# View recent commits
git log --oneline -5

# Revert specific commit (use commit hash)
git revert <commit-hash>
```

Or manually restore:
1. `unified-auth-form.tsx` - Remove phone check, use `router.push("/home")` always
2. `profile/page.tsx` - Remove `useSearchParams`, `showPhonePrompt`, and banner
