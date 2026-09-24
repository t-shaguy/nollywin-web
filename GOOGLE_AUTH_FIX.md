# Google Auth Error Fix

## Error You Saw:
```json
{
  "timestamp": "2026-09-23T12:45:28.243633399Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired Google ID token",
  "path": "/api/v1/auth/google"
}
```

## Root Cause:

We were sending the **wrong type of token** to your backend!

### What Happened:
1. Frontend was using `useGoogleLogin` hook with "implicit flow"
2. This gives us an **access token** (used for calling Google APIs)
3. Backend was expecting an **ID token** (JWT used for authentication)
4. Backend tried to verify the access token as an ID token → failed!

### The Difference:

| Token Type | Purpose | What It Is | Can Backend Verify? |
|------------|---------|------------|---------------------|
| **Access Token** | Call Google APIs | Random string | ❌ No (we sent this) |
| **ID Token** | Prove user identity | JWT with user claims | ✅ Yes (backend needs this) |

## The Fix:

Changed from `useGoogleLogin` hook → `GoogleLogin` component

### Before (Wrong):
```typescript
// This gives access token
const googleLogin = useGoogleLogin({
  onSuccess: (response) => {
    const accessToken = response.access_token; // ❌ Wrong!
    sendToBackend(accessToken);
  },
  flow: "implicit"
});
```

### After (Correct):
```typescript
// This gives ID token (JWT)
<GoogleLogin
  onSuccess={(credentialResponse) => {
    const idToken = credentialResponse.credential; // ✅ Correct!
    sendToBackend(idToken);
  }}
/>
```

## What Changed:

**File**: `app/features/auth/presentation/unified-auth-form.tsx`

1. Import: `useGoogleLogin` → `GoogleLogin, CredentialResponse`
2. Handler: Extract `credential` from response (this is the ID token)
3. UI: Replace custom button with `<GoogleLogin />` component

## Why It Works Now:

1. `GoogleLogin` component properly implements **Authorization Code flow**
2. Returns a signed JWT (ID token) in `credentialResponse.credential`
3. Backend can verify this JWT with Google's public keys
4. Backend trusts the user info in the verified JWT

## Test Now:

1. Refresh the page: `http://localhost:3000/auth`
2. Click the Google Sign-In button
3. Authenticate with Google
4. Should successfully log in and redirect to `/home`

## No Backend Changes Needed:

Your backend is already correct! It was expecting an ID token all along. We just needed to send the right thing from the frontend.
