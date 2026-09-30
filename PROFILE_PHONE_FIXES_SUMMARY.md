# Profile Page & Google Auth Flow Fixes - Summary

## Completed Fixes

### ✅ Fix #2: Phone Number Banner Not Disappearing
**Problem:** The "Complete Your Profile" banner remained visible after successfully saving phone number.

**Root Cause:** `showPhonePrompt` state was set to `true` by a useEffect but never set back to `false` in the success handler.

**Solution:** Added `setShowPhonePrompt(false)` in `handleSavePhone`'s success branch, right after `updateUser(response.user)`.

**Files Modified:**
- `app/(authenticated)/profile/page.tsx`

---

### ✅ Fix #3: Edit Phone Number UI Polish
**Problem:** Phone edit UI didn't match the app's phone input pattern and had oversized buttons.

**Changes Made:**
1. **Replaced single text input with NG +234 prefix box pattern** - Now matches `unified-auth-form.tsx`
2. **Smaller Save/Cancel buttons** - Changed from `flex-1` to `py-2 text-sm`
3. **Center-aligned edit form** - Icon, label, inputs, and buttons all centered
4. **Better input validation** - Only accepts digits with `maxLength={10}`
5. **Updated helper text** - Now reads "Enter your 10-digit number" (since prefix is fixed)
6. **Integrated phone formatting utility** - Uses `toInternationalPhone()` helper

**Files Modified:**
- `app/(authenticated)/profile/page.tsx`

---

### ✅ Bonus: Shared Phone Utility Created
**Created:** `lib/utils/phone.ts` with `toInternationalPhone()` helper function

**Benefits:**
- DRY principle - single source of truth for phone formatting
- Handles all formats: "08012345678", "2348012345678", "+2348012345678", "8012345678"
- Used in both `unified-auth-form.tsx` and `profile/page.tsx`

**Files Modified:**
- Created: `lib/utils/phone.ts`
- Updated: `app/features/auth/presentation/unified-auth-form.tsx` (removed duplicate helper, imported shared one)
- Updated: `app/(authenticated)/profile/page.tsx` (imported and uses shared helper)

---

## ⚠️ Fix #1: Referral Code Prompt - BLOCKED

**Status:** **CANNOT IMPLEMENT** - Missing backend endpoint

**Problem:** No way to apply referral code after account creation.

**Current State:**
- Referral API only has GET endpoints:
  - `GET /api/v1/referrals/link` - Get user's referral link
  - `GET /api/v1/referrals/stats` - Get referral stats
- No POST endpoint exists to apply/submit a referral code

**What's Needed:**
Backend team needs to create an endpoint like:
- `POST /api/v1/referrals/apply` 
- Request: `{ "referralCode": "ABC123" }`
- Response: `{ "message": "Referral code applied successfully" }`

**Additional Signal Needed:**
`GoogleAuthResponse` doesn't include an `isNewAccount` flag. Currently no reliable way to distinguish:
- New account created via Google → should see referral prompt
- Existing account logged in via Google → should NOT see referral prompt

The only signal we have is `profile.phoneNumber` being empty, but this is unreliable (existing accounts might also lack phone numbers).

**Recommendation:**
1. Backend should add `isNewAccount: boolean` to `GoogleAuthResponse`
2. Backend should add POST endpoint to apply referral codes post-signup
3. Frontend can then implement referral prompt in the same flow as phone prompt

---

## 📋 Security Gap Identified: Phone Number Verification

**Current Implementation:**
- Users can change phone number in profile WITHOUT any OTP verification
- `handleSavePhone` sends new phone directly to `PUT /api/v1/users/profile`
- No verification step at all

**Risk Level:** **MEDIUM**
Phone numbers are often used for:
- Account recovery
- Two-factor authentication
- SMS notifications

Allowing unverified phone changes could lead to:
- Account takeover via social engineering
- Unauthorized access to recovery mechanisms
- User confusion (wrong number → can't receive important SMS)

**Existing Phone OTP Infrastructure:**
These endpoints exist but are ONLY used in auth flow (login/signup):
- `POST /api/v1/auth/phone/otp/request` - Request OTP code
- `POST /api/v1/auth/phone/otp/verify` - Verify OTP code

**Recommendations:**

### Option A: Backend Validation (Preferred)
Modify `PUT /api/v1/users/profile` to:
1. Detect when `phoneNumber` field is changing
2. Require OTP verification before accepting the change
3. Return a specific error code if phone not verified
4. Frontend can then implement OTP flow in response to that error

### Option B: Separate Verification Endpoint
Create new endpoint:
- `POST /api/v1/users/phone/verify`
- Flow:
  1. User enters new phone
  2. Frontend calls request-otp endpoint
  3. User enters OTP code
  4. Frontend calls verify endpoint with code
  5. On success, update profile with verified phone

### Option C: Accept Current Risk
Document that phone numbers are NOT verified on profile updates and communicate this to stakeholders. Consider:
- Adding a warning in UI: "You won't receive verification SMS"
- Disabling phone-based recovery if phone was never verified
- Tracking "verified" vs "unverified" phone status

---

## Files Modified

1. ✅ `lib/utils/phone.ts` - Created shared phone formatting utility
2. ✅ `app/features/auth/presentation/unified-auth-form.tsx` - Uses shared phone utility
3. ✅ `app/(authenticated)/profile/page.tsx` - Fixed banner + polished phone edit UI

---

## Testing Checklist

### Phone Edit UI
- [ ] Click "Edit" on phone number in profile
- [ ] Verify NG +234 prefix box appears (not editable)
- [ ] Verify input only accepts 10 digits
- [ ] Verify form is center-aligned
- [ ] Verify Save/Cancel buttons are smaller (not full-width)
- [ ] Enter valid 10-digit number and save
- [ ] Verify phone updates correctly
- [ ] Verify "Complete Your Profile" banner disappears if it was showing

### Post-Google-Signup Flow
- [ ] Sign up via Google OAuth with account that has no phone
- [ ] Verify redirected to `/profile?prompt=phone`
- [ ] Verify "Complete Your Profile" banner appears
- [ ] Edit and save phone number
- [ ] Verify banner disappears after save

### Phone Formatting
- [ ] Test with "08012345678" → should become "+2348012345678"
- [ ] Test with "2348012345678" → should become "+2348012345678"
- [ ] Test with "8012345678" → should become "+2348012345678"

---

## Next Steps

### For Backend Team (Taysay):
1. **HIGH PRIORITY:** Add referral code application endpoint
   - `POST /api/v1/referrals/apply`
   - Accepts `{ referralCode: string }`
   - Can be called post-signup

2. **MEDIUM PRIORITY:** Add phone verification to profile updates
   - See "Security Gap" section above for options
   - Recommend Option A (backend validation)

3. **LOW PRIORITY:** Add `isNewAccount` flag to GoogleAuthResponse
   - Helps distinguish new signups from existing logins
   - Enables better onboarding flows

### For Frontend Team:
1. Once referral endpoint exists, implement referral prompt in profile page
2. Once phone verification pattern is defined, update handleSavePhone flow
3. Consider adding visual indicators for verified vs unverified phone numbers
