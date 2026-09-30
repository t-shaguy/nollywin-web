# Google Sign-In Referral Code - Implementation

## Summary
Added referral code input field for Google Sign-In, visible only in signup mode.

## Changes Made

### File: `app/features/auth/presentation/unified-auth-form.tsx`

**1. Added State:**
```typescript
const [preAuthReferralCode, setPreAuthReferralCode] = useState<string>("");
```

**2. Added UI (signup mode only):**
```tsx
{mode === "signup" && (
  <div>
    <label className="text-xs text-white mb-1.5 block font-medium">
      Have a referral code? <span className="text-white/40">(optional — new accounts only)</span>
    </label>
    <Input 
      placeholder="Enter referral code" 
      value={preAuthReferralCode}
      onChange={(e) => setPreAuthReferralCode(e.target.value)}
      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
    />
  </div>
)}
```

**Location:** Directly above the Google Sign-In button, after the "or" divider

**3. Updated Handler:**
```typescript
// In handleGoogleSuccess
const referralCode = mode === "signup" ? (preAuthReferralCode.trim() || undefined) : undefined;
```

## Behavior

### Signup Mode
- ✅ Referral code field is visible above Google button
- ✅ User can enter optional referral code
- ✅ Code is sent with Google auth request
- ✅ Label explains "(optional — new accounts only)"

### Login Mode  
- ✅ Referral code field is NOT visible
- ✅ Existing users don't see unnecessary field
- ✅ referralCode is undefined (not sent to backend)

## Coexistence with Email Signup

The existing "Referral Code (Optional)" field in the email-signup form (`mode === "signup" && method === "email"`) continues to work independently. Both fields can coexist because:

- **Email path:** User fills email form → clicks "Create Account" → email referral code is sent
- **Google path:** User fills Google referral code → clicks "Sign in with Google" → Google referral code is sent

Only one path is taken per signup, so there's no conflict.

## Testing Checklist

- [ ] Switch to signup mode → referral field appears above Google button
- [ ] Switch to login mode → referral field disappears
- [ ] Enter referral code in signup mode
- [ ] Click "Sign in with Google" → code is sent in request
- [ ] Switch back to login mode after entering code → field disappears but code is retained if user switches back
- [ ] Verify email signup's referral field still works independently

## Backend Integration

- ✅ Backend already supports `referralCode` in `GoogleAuthRequest`
- ✅ No backend changes needed
- ✅ Code is sent only when `mode === "signup"`
- ✅ Login requests don't include referral code (as expected)
