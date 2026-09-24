# Google OAuth Implementation

## ✅ Frontend Implementation Complete (FIXED)

Google Sign-In has been fully implemented on the frontend with the provided credentials.

### ⚠️ Issue Fixed (Sept 23, 2026):

**Problem**: Backend was rejecting requests with "Invalid or expired Google ID token" error.

**Root Cause**: We were using `useGoogleLogin` hook with implicit flow, which returns an **access token** instead of an **ID token**. The backend expects an ID token (JWT) for verification.

**Solution**: Switched to using the `GoogleLogin` component which properly returns an ID token in the credential field.

### What Was Done:

1. **Environment Variables Added** (`.env.local`):
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: `579977222970-***********************.apps.googleusercontent.com` (redacted)
   - `GOOGLE_CLIENT_SECRET`: `GOCSPX-*********************` (redacted - server-side only)

2. **Package Installed**:
   - `@react-oauth/google` - Official Google OAuth library for React

3. **Google OAuth Provider**:
   - Created `components/providers/google-auth-provider.tsx`
   - Wrapped app in root layout with GoogleOAuthProvider

4. **Auth API Function** (`lib/api/auth.ts`):
   - Added `googleAuth(data: GoogleAuthRequest)` function
   - Sends Google ID token to backend at `POST /api/v1/auth/google`

5. **UI Implementation** (`app/features/auth/presentation/unified-auth-form.tsx`):
   - Using `GoogleLogin` component (NOT `useGoogleLogin` hook)
   - Properly extracts ID token from `credentialResponse.credential`
   - Sends correct ID token to backend for verification
   - Handles loading states and errors
   - Supports referral codes in signup mode

---

## ⚠️ BACKEND VERIFICATION REQUIRED

### Critical Questions for Backend Team:

1. **Does the endpoint `POST /api/v1/auth/google` exist?**
   - If not, what is the correct endpoint path?
   
2. **What should we send to the backend?**
   - Current implementation sends: `{ idToken: string, referralCode?: string }`
   - Should we send Google ID token or access token?
   - Should we send raw token or user info?

3. **What does the backend return?**
   - Current implementation expects same shape as login: `{ accessToken, tokenType, expiresInMinutes, profile }`
   - Does backend create new user accounts automatically if user doesn't exist?
   - Does backend handle email verification for Google sign-ins?

4. **Backend Token Verification**:
   - Backend MUST verify the Google token with Google's servers
   - Backend MUST NOT trust client-provided user info without verification
   - Recommended: Use Google's token verification libraries

---

## 🔧 Current Implementation Details

### Frontend Flow:

1. User clicks Google Sign-In button
2. Google OAuth popup opens (handled by `GoogleLogin` component)
3. User authenticates with Google
4. Google returns **ID token (JWT)** to frontend via `credentialResponse.credential`
5. Frontend sends ID token + optional referral code to backend at `POST /api/v1/auth/google`
6. Backend verifies ID token with Google and returns NollyWin access token + profile
7. Frontend stores session and redirects to `/home`

### Key Difference (ID Token vs Access Token):

- **ID Token (JWT)**: Contains user identity claims, signed by Google, can be verified by backend ✅ (What we use now)
- **Access Token**: Used to call Google APIs, cannot be used for authentication ❌ (What we used before - caused the error)

### Request Payload:
```typescript
interface GoogleAuthRequest {
  idToken: string;        // Google ID token (JWT) - now correct!
  referralCode?: string;  // Optional referral code if signing up
}
```

### Expected Response:
```typescript
interface GoogleAuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresInMinutes: number;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    alias: string | null;
    role: "PLAYER" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
    lastPasswordChangedAt: string;
    avatarUrl: string | null;
    totalPoints: number;
    gamesPlayed: number;
    bestScore: number;
  };
}
```

---

## 🔐 Security Notes

### Frontend:
- ✅ Google Client ID is public (safe in frontend)
- ✅ Client Secret is in `.env.local` (server-side only, not exposed to browser)
- ✅ Using official Google OAuth library (handles security properly)
- ✅ Using implicit flow (appropriate for client-side apps)

### Backend (TO VERIFY):
- ⚠️ Backend MUST verify Google token using Google's verification API
- ⚠️ Backend MUST NOT trust any user info sent from frontend without verification
- ⚠️ Backend should use Google's official libraries for token verification
- ⚠️ Backend should handle cases where email is already registered with password

---

## 📝 Recommended Backend Implementation

### Using Google's Official Library (Java example):

```java
// Verify token with Google
GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
    .setAudience(Collections.singletonList(CLIENT_ID))
    .build();

GoogleIdToken idToken = verifier.verify(tokenString);
if (idToken != null) {
  GoogleIdToken.Payload payload = idToken.getPayload();
  String email = payload.getEmail();
  String name = (String) payload.get("name");
  String pictureUrl = (String) payload.get("picture");
  
  // Create or login user
  // Return NollyWin access token
} else {
  // Invalid token
  throw new UnauthorizedException("Invalid Google token");
}
```

---

## 🧪 Testing Instructions

### Prerequisites:
1. Backend endpoint must be implemented and deployed
2. Backend must be configured with same Google Client ID and Secret
3. Environment variable must be set (already done)

### Test Steps:
1. Start dev server: `npm run dev`
2. Navigate to auth page: `http://localhost:3000/auth`
3. Click "Continue with Google" button
4. Sign in with Google account
5. Verify redirect to `/home` with proper session

### Expected Behavior:
- Google popup opens without errors
- After authentication, user is logged in
- Session is stored with `accessToken` and `profile`
- User is redirected to `/home`

### Common Issues:
- **"popup_closed_by_user"**: User closed popup before completing auth
- **"access_denied"**: User clicked "Cancel" in Google popup
- **Backend error**: Endpoint doesn't exist or token verification failed
- **CORS error**: Backend not allowing requests from `http://localhost:3000`

---

## 🚀 Production Checklist

Before deploying to production, ensure:

- [ ] Backend endpoint `POST /api/v1/auth/google` is implemented
- [ ] Backend verifies Google tokens securely
- [ ] Google OAuth consent screen is configured in Google Cloud Console
- [ ] Authorized JavaScript origins includes production domain
- [ ] Authorized redirect URIs includes production domain
- [ ] Environment variables are set in production
- [ ] CORS is properly configured on backend
- [ ] Error handling is tested for all failure scenarios
- [ ] Analytics/logging is set up for OAuth events

---

## 📞 Contact

If backend endpoint differs from assumption, update:
1. `lib/api/auth.ts` - Update `googleAuth()` function endpoint path
2. Request/response types if they differ from login endpoint shape

Current assumptions can be found in the code comments.
