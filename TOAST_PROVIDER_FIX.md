# ToastProvider Fix - Payment Callback Crash

## Problem
The payment callback page (`app/payments/callback/page.tsx`) was crashing with:
```
Error: useToast must be used within ToastProvider
```

**Root Cause:**
- Payment callback page calls `useToast()` on line 17 to show success toast
- But this page is at `/payments/callback`, outside the `(authenticated)` route group
- `ToastProvider` was only wrapped around `app/(authenticated)/layout.tsx`
- When Paystack redirects to `/payments/callback?reference=...`, the page renders outside that provider tree → crash

## Solution
Moved `ToastProvider` to root layout (`app/layout.tsx`), wrapping the entire app.

**Why root layout?**
Same reasoning as `QueryProvider` - any route (authenticated or not) might need to show a toast. Payment callbacks, error pages, and public routes should all be able to use toast notifications.

## Files Modified

### 1. `app/layout.tsx`
**Added:**
```typescript
import { ToastProvider } from "@/components/ui/toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${geistMono.variable}`}>
      <body>
        <QueryProvider>
          <ToastProvider>
            <GoogleAuthProvider>{children}</GoogleAuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 2. `app/(authenticated)/layout.tsx`
**Removed:**
- Import statement: `import { ToastProvider } from "@/components/ui/toast";`
- Wrapper: `<ToastProvider>...</ToastProvider>` around AuthenticatedShell

**Added note:**
```typescript
/**
 * NOTE: ToastProvider is now in root layout (app/layout.tsx) so it works on ALL routes,
 * including /payments/callback which is outside the (authenticated) group.
 */
```

## Provider Hierarchy (After Fix)
```
<html>
  <body>
    <QueryProvider>           ← React Query for data fetching
      <ToastProvider>         ← Toast notifications (ALL routes)
        <GoogleAuthProvider>  ← Google OAuth
          {children}
        </GoogleAuthProvider>
      </ToastProvider>
    </QueryProvider>
  </body>
</html>
```

## Payment Flow
1. User initiates payment (subscription/token top-up) from `/store`
2. Backend returns Paystack authorization URL
3. User redirected to Paystack checkout
4. User completes payment
5. Paystack redirects to `http://localhost:3000/payments/callback?reference=...&trxref=...`
6. Callback page verifies payment with backend
7. **Success toast shows** (now works because ToastProvider is in root)
8. User redirected to `/home` dashboard

## Routes That Can Now Use Toasts
✅ `/payments/callback` - Payment verification  
✅ `/auth` - Login/register (public)  
✅ `/forgot-password` - Password reset (public)  
✅ `/reset-password` - Password reset form (public)  
✅ All authenticated routes (already worked before)  
✅ Any future error pages or public routes  

## Testing Checklist
- [x] Build compiles successfully
- [ ] Payment flow: Store → Paystack → Callback → Dashboard
- [ ] Success toast shows on payment completion
- [ ] No "useToast must be used within ToastProvider" crash
- [ ] Wallet balance updates after payment
- [ ] Dashboard shows new subscription after purchase

## Related Files
- `app/payments/callback/page.tsx` - Uses `useToast()` to show success message
- `components/ui/toast.tsx` - Toast context provider and hook
- `lib/api/payments.ts` - `verifyPayment()` API function

## Benefits
1. ✅ Payment callback page no longer crashes
2. ✅ Any route can now show toast notifications
3. ✅ Consistent provider setup (same pattern as QueryProvider)
4. ✅ No duplicate providers (removed from authenticated layout)
5. ✅ Better user experience - success feedback after payment
