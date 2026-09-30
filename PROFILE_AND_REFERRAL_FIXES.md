# Profile Changes & Referral Code Fixes - Summary

## Bug Fix #1: Profile Changes Don't Reflect Until Page Refresh

### Problem
When users updated their name or phone number in the profile page, the changes weren't immediately visible in the UI. The UI would only update after a full page refresh.

### Root Cause
Both `handleSaveName` and `handleSavePhone` were trusting the `PUT /api/v1/users/profile` response's returned user object directly:

```typescript
const response = await updateProfile(...);
updateUser(response.user);  // Potentially stale data
```

### Solution
Changed both handlers to ignore the PUT response and immediately re-fetch fresh data using the same `GET /api/v1/users/profile` endpoint that's already used on mount:

```typescript
await updateProfile(...);
const freshProfile = await getProfile();  // Fresh GET
updateUser(freshProfile);
```

This guarantees the UI always reflects what the backend actually has, regardless of whether the PUT response itself is stale.

### Files Modified
- `app/(authenticated)/profile/page.tsx`
  - Updated `handleSaveName()` to re-fetch after update
  - Updated `handleSavePhone()` to re-fetch after update
  - Already had `setShowPhonePrompt(false)` from previous fix

---

## Bug Fix #2: Referral Code Missing from Google & Phone Signup

### Problem
Referral code input was ONLY visible on email+password signup. Users signing up via:
- Google OAuth → no referral code input visible
- Phone OTP signup → no referral code input visible

This meant the `referralCode` field in `GoogleAuthRequest` (which the backend already supports) was always empty in practice.

### Root Cause Analysis

**Phone Signup:**
- `PhoneOtpRequestRequest` and `PhoneOtpVerifyRequest` have NO `referralCode` field at all
- Comment in `lib/api/auth.ts` says "shapes TBD - not yet verified with live backend"
- Backend doesn't currently support referral codes for phone signup flow

**Google Signup:**
- `GoogleAuthRequest` DOES have `referralCode?: string` field (backend supports it)
- But unified-auth-form.tsx only rendered the referral input when `mode === "signup" && method === "email"`
- So it was blank for all Google signups

### Solution Implemented

#### 1. Added Referral Code to Phone Signup Form
- Updated `signupPhoneSchema` to include `referralCode?: string`
- Added referral code input to phone signup form (after phone number field)
- Added warning text: "Phone signup referral codes are not yet supported by the backend"
- Field is rendered but NOT wired to the OTP endpoints (they don't accept it)

#### 2. Added Standalone Referral Code for Google Signup
- Added `referralCodeForGoogle` state variable (not tied to form)
- Added standalone referral input ABOVE Google button (visible in signup mode)
- Wired it into `handleGoogleSuccess` to send with Google auth request
- Updated `handleGoogleSuccess` to use standalone referral code OR email form referral code (whichever is filled)

### Files Modified
- `app/features/auth/presentation/unified-auth-form.tsx`
  - Updated `signupPhoneSchema` to include optional `referralCode` field
  - Added `referralCodeForGoogle` state for Google/phone signups
  - Added referral code input to phone signup form (with warning note)
  - Added standalone referral code input above Google button (signup mode only)
  - Updated `handleGoogleSuccess` to check both sources for referral code

---

## Backend Coordination Required

### Phone Signup Referral Support (HIGH PRIORITY)

**Current State:**
- Frontend NOW collects referral code for phone signup
- Backend phone OTP endpoints (`/api/v1/auth/phone/otp/request` and `/api/v1/auth/phone/otp/verify`) do NOT accept `referralCode` parameter

**Options for Backend:**

**Option A: Add referralCode to OTP Verify (Recommended)**
```typescript
// POST /api/v1/auth/phone/otp/verify
{
  "phoneNumber": "+2348012345678",
  "code": "123456",
  "referralCode": "ABC123"  // NEW - optional
}
```
This makes sense because the account is created during verification, not during OTP request.

**Option B: Separate Apply Endpoint**
Create `POST /api/v1/referrals/apply` that can be called after any signup method:
```typescript
{
  "referralCode": "ABC123"
}
```
This is more flexible but requires an extra API call.

**Option C: Add to OTP Request**
Add `referralCode` to `/api/v1/auth/phone/otp/request`, store it temporarily, and apply it when verification succeeds. More complex server-side state management.

**Recommendation:** Option A (add to verify endpoint) is cleanest.

---

## Testing Checklist

### Profile Updates
- [ ] Update first/last name in profile
- [ ] Verify name updates immediately without page refresh
- [ ] Update phone number in profile
- [ ] Verify phone updates immediately without page refresh
- [ ] Verify "Complete Your Profile" banner disappears after phone save

### Email Signup with Referral Code
- [ ] Sign up via email with referral code filled
- [ ] Verify referral code is sent with registration
- [ ] Verify referral stats increment for referrer

### Google Signup with Referral Code
- [ ] Switch to signup mode
- [ ] Enter referral code in standalone field above Google button
- [ ] Click "Sign up with Google"
- [ ] Verify referral code is sent in Google auth request
- [ ] Verify referral stats increment for referrer

### Phone Signup with Referral Code
- [ ] Switch to signup mode
- [ ] Select phone method
- [ ] Enter referral code in phone form
- [ ] Click "Send OTP"
- [ ] Verify referral code is collected (but not sent to backend yet)
- [ ] Complete OTP verification
- [ ] **NOTE:** Backend doesn't support this yet, so referral won't actually apply

---

## Implementation Notes

### Google Referral Code Logic
The `handleGoogleSuccess` function now checks TWO sources:
1. `referralCodeForGoogle` (standalone input above Google button)
2. `watch("referralCode")` (email form input, if user was on email signup)

This ensures referral code works regardless of which method the user was viewing before clicking Google button.

### Phone Referral Code Storage
The referral code for phone signup is:
- ✅ Collected in the form
- ✅ Validated by schema
- ✅ Stored in form state
- ❌ NOT sent to backend (endpoints don't accept it)
- ⏳ Ready to be wired once backend adds support

### Warning Messages
Both phone referral inputs include explanatory text:
- Phone form: "Phone signup referral codes are not yet supported by the backend"
- Google standalone: "Use this if signing up with Google or Phone"

These can be removed once backend support is confirmed working.

---

## Files Changed

1. ✅ `app/(authenticated)/profile/page.tsx`
   - Fixed `handleSaveName` to re-fetch after update
   - Fixed `handleSavePhone` to re-fetch after update

2. ✅ `app/features/auth/presentation/unified-auth-form.tsx`
   - Added `referralCode` to `signupPhoneSchema`
   - Added `referralCodeForGoogle` state
   - Added referral input to phone signup form
   - Added standalone referral input above Google button
   - Updated `handleGoogleSuccess` to use both referral sources

---

## Next Steps

1. **Backend Team (Taysay):** Add `referralCode` parameter to phone OTP verify endpoint
2. **Frontend Team:** Once backend supports phone referral codes, remove warning text and wire the field to OTP verification
3. **QA Team:** Test all three signup methods (email, phone, Google) with referral codes
4. **Product Team:** Decide if referral code should be visible in login mode (currently signup-only)
