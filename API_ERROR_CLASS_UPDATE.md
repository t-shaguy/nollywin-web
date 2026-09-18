# ApiError Class Update - Error Overlay Fix ✅

**Date:** December 2024  
**Status:** Complete - ApiError converted from interface to Error subclass  
**Issue Fixed:** Next.js dev error overlay now displays API errors properly (was showing `{}` before)

---

## Problem

Previously, `ApiError` was a plain interface, and `apiClient`/`apiClientMultipart` threw plain objects:

```typescript
// OLD - Interface
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path?: string;
  data?: any;
}

// OLD - Throwing plain objects
const apiError: ApiError = {
  status: res.status,
  error: errorData.error || res.statusText,
  message: errorData.message || `Request failed with status ${res.status}`,
  path: errorData.path,
  data: errorData,
};
throw apiError; // ❌ Not a real Error instance
```

**Result:** Next.js dev error overlay couldn't display these properly - just showed `{}` with no details, making debugging difficult.

---

## Solution

Converted `ApiError` to a class extending `Error`:

```typescript
// NEW - Class extending Error
export class ApiError extends Error {
  status: number;
  error: string;
  path?: string;
  data?: any;

  constructor(params: { status: number; error: string; message: string; path?: string; data?: any }) {
    super(params.message);  // Pass message to Error constructor
    this.name = "ApiError";
    this.status = params.status;
    this.error = params.error;
    this.path = params.path;
    this.data = params.data;
  }
}

// NEW - Throwing real Error instances
throw new ApiError({
  status: res.status,
  error: errorData.error || res.statusText,
  message: errorData.message || `Request failed with status ${res.status}`,
  path: errorData.path,
  data: errorData,
}); // ✅ Real Error instance with proper stack trace
```

---

## Changes Made

### 1. ✅ Converted ApiError to Class

**File:** `lib/api/client.ts`

**Changed from interface to class:**
- Extends `Error` for proper error handling
- Sets `this.name = "ApiError"` for error type identification
- Calls `super(params.message)` to set error message
- Maintains all original fields: `status`, `error`, `path`, `data`

### 2. ✅ Updated All Throw Statements in `apiClient`

**4 throw locations updated:**

1. **HTTP error responses** (non-2xx status codes)
   ```typescript
   throw new ApiError({
     status: res.status,
     error: errorData.error || res.statusText,
     message: errorData.message || `Request failed with status ${res.status}`,
     path: errorData.path,
     data: errorData,
   });
   ```

2. **Timeout errors** (15 second timeout)
   ```typescript
   throw new ApiError({
     status: 408,
     error: "Request Timeout",
     message: "Request timed out after 15 seconds",
   });
   ```

3. **Network errors** (connection failures)
   ```typescript
   throw new ApiError({
     status: 0,
     error: "Network Error",
     message: "Network error - please check your connection",
   });
   ```

4. **Unknown errors** (catch-all)
   ```typescript
   throw new ApiError({
     status: 500,
     error: "Unknown Error",
     message: error.message || "An unknown error occurred",
   });
   ```

### 3. ✅ Updated All Throw Statements in `apiClientMultipart`

**4 throw locations updated** (same pattern as `apiClient`):

1. **HTTP error responses** (upload failures)
   ```typescript
   throw new ApiError({
     status: res.status,
     error: errorData.error || res.statusText,
     message: errorData.message || `Upload failed with status ${res.status}`,
     path: errorData.path,
     data: errorData,
   });
   ```

2. **Timeout errors** (upload timeout)
   ```typescript
   throw new ApiError({
     status: 408,
     error: "Request Timeout",
     message: "Upload timed out after 15 seconds",
   });
   ```

3. **Network errors** (upload connection failure)
   ```typescript
   throw new ApiError({
     status: 0,
     error: "Network Error",
     message: "Network error - please check your connection",
   });
   ```

4. **Unknown errors** (upload catch-all)
   ```typescript
   throw new ApiError({
     status: 500,
     error: "Unknown Error",
     message: error.message || "Upload failed",
   });
   ```

---

## Backward Compatibility ✅

### Existing Code Still Works

All existing code using `error as ApiError` continues to work without changes:

```typescript
// Still works - no changes needed
try {
  await someApiCall();
} catch (error) {
  const apiError = error as ApiError;  // ✅ Still valid - class is still a type
  console.error(apiError.message);
  console.error(apiError.status);
  console.error(apiError.error);
}
```

**Found 7 files using `as ApiError` cast:**
- `app/features/game/presentation/trivia-flow.tsx` (2 locations)
- `app/features/profile/presentation/avatar-upload.tsx` (1 location)
- `app/features/profile/presentation/profile-details-form.tsx` (1 location)
- `app/features/profile/presentation/change-password-form.tsx` (1 location)
- `app/features/auth/presentation/unified-auth-form.tsx` (3 locations)
- `app/features/auth/presentation/reset-password-form.tsx` (1 location)
- `app/features/auth/presentation/forgot-password-form.tsx` (1 location)

**All continue to work unchanged** ✅

---

## Benefits

### 1. **Proper Error Display in Next.js Dev Overlay**

**Before:**
```
Error: {}
  (no details visible)
```

**After:**
```
ApiError: Request failed with status 401
  at apiClient (lib/api/client.ts:135)
  at login (lib/api/auth.ts:181)
  at onSubmit (unified-auth-form.tsx:145)
  ...stack trace...

Properties:
  status: 401
  error: "Unauthorized"
  message: "Invalid credentials"
  path: "/api/v1/auth/login"
```

### 2. **Proper instanceof Checks**

```typescript
try {
  await someApiCall();
} catch (error) {
  if (error instanceof ApiError) {  // ✅ Now works correctly
    console.log(`API Error ${error.status}: ${error.message}`);
  }
}
```

### 3. **Proper Stack Traces**

```typescript
const error = new ApiError({
  status: 404,
  error: "Not Found",
  message: "Resource not found"
});

console.log(error.stack);  // ✅ Full stack trace available
console.log(error.name);   // "ApiError"
console.log(error.message); // "Resource not found"
```

### 4. **Better Error Logging**

```typescript
// Errors now log as proper Error objects
console.error(error);
// ApiError: Request timed out after 15 seconds
//   at apiClient (client.ts:159)
//   ...

// Instead of:
// { status: 408, error: "Request Timeout", message: "..." }
```

---

## Type Safety ✅

**TypeScript Check:** PASSING  
```bash
npx tsc --noEmit
# Exit Code: 0
```

**Key Points:**
- `ApiError` is now both a class and a type
- All existing type casts (`as ApiError`) still work
- `instanceof ApiError` now works correctly
- Constructor enforces required fields via TypeScript

---

## Testing

### Manual Test in Dev Environment

1. **Trigger an API error** (e.g., invalid login)
2. **Check browser console** - should see proper Error object with stack trace
3. **Check Next.js error overlay** - should see full error details, not `{}`

### Test Different Error Types

```typescript
// 1. Test HTTP error
try {
  await login({ email: "bad@email.com", password: "wrong" });
} catch (error) {
  console.log(error instanceof ApiError);  // true
  console.log(error instanceof Error);      // true
  console.log((error as ApiError).status);  // 401
}

// 2. Test timeout
// (Wait 15+ seconds for request)
catch (error) {
  console.log((error as ApiError).status);  // 408
  console.log((error as ApiError).error);   // "Request Timeout"
}

// 3. Test network error
// (Disconnect internet, try request)
catch (error) {
  console.log((error as ApiError).status);  // 0
  console.log((error as ApiError).error);   // "Network Error"
}
```

---

## Implementation Details

### Constructor Pattern

Uses object parameter for clean, named arguments:

```typescript
// Good - named parameters, self-documenting
throw new ApiError({
  status: 401,
  error: "Unauthorized",
  message: "Invalid credentials",
  path: "/api/v1/auth/login",
  data: { details: "..." }
});

// vs. positional parameters (harder to read):
throw new ApiError(401, "Unauthorized", "Invalid credentials", "/api/v1/auth/login", {...});
```

### Error Name

Sets `this.name = "ApiError"` for proper error type identification:

```typescript
console.log(error.name);  // "ApiError" (not "Error")
console.log(error.toString());  // "ApiError: Request failed with status 401"
```

### Message Inheritance

Calls `super(params.message)` to properly set `error.message`:

```typescript
const err = new ApiError({
  status: 404,
  error: "Not Found",
  message: "User not found"
});

console.log(err.message);  // "User not found" (inherited from Error)
```

---

## Files Modified (1 total)

1. `lib/api/client.ts` - Converted ApiError to class, updated all throw statements

---

## Related

- All API client functions (`auth.ts`, `profile.ts`, `wallet.ts`, etc.) automatically benefit from this change
- No changes needed in consuming code - fully backward compatible
- Error handling in components works exactly as before, just with better debugging

---

**Status:** ✅ COMPLETE  
**Type Safety:** ✅ PASSING  
**Backward Compatibility:** ✅ 100%  
**Last Updated:** December 2024
