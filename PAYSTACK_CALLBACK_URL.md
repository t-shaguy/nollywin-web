# Paystack Callback URL Configuration

**Date:** December 2024  
**For:** Paystack Dashboard Configuration

---

## Callback URL

### Production URL:
```
https://nollywin.com/payments/callback
```

### Staging/Development URL:
```
https://staging.nollywin.com/payments/callback
```

### Local Testing URL:
```
http://localhost:3000/payments/callback
```

---

## How It Works

1. User selects a subscription plan or token package on `/store`
2. User clicks "Confirm Payment"
3. Backend initiates Paystack payment and returns `authorizationUrl`
4. User is redirected to Paystack checkout page
5. User completes payment on Paystack
6. **Paystack redirects back to** `/payments/callback?reference=xxx`
7. Callback page verifies payment with backend
8. User sees success/failure message
9. User redirected to appropriate page (home or store)

---

## Configuration Steps in Paystack Dashboard

### 1. Login to Paystack Dashboard
- Go to https://dashboard.paystack.com
- Login with your Paystack account

### 2. Navigate to Settings → API Keys & Webhooks
- Click on **Settings** in the sidebar
- Select **API Keys & Webhooks**

### 3. Set Callback URL
- Find the **Callback URL** field
- Enter: `https://nollywin.com/payment/callback`
- Click **Save**

### 4. Test Mode (Optional)
If you want to test with the staging environment:
- Switch to **Test Mode** (toggle in top right)
- Set callback URL to: `https://staging.nollywin.com/payment/callback`
- Use test API keys for development

---

## URL Parameters Received from Paystack

The callback page expects these query parameters from Paystack:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `reference` | Unique payment reference | `T1234567890` |
| `trxref` | Alternative reference parameter | `T1234567890` |
| `cancelled` | If payment was cancelled | `true` |

**Example callback URL:**
```
https://nollywin.com/payments/callback?reference=T1234567890&trxref=T1234567890
```

---

## Verification Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Paystack  │────→│   Callback   │────→│   Backend   │
│   Payment   │     │     Page     │     │   Verify    │
└─────────────┘     └──────────────┘     └─────────────┘
      ↓                     ↓                     ↓
   Reference           Extract Ref          Check Status
   Generated           from URL             Return Result
```

1. Paystack redirects to callback URL with `reference` parameter
2. Callback page extracts reference from URL
3. Frontend calls `GET /api/v1/payments/verify/{reference}`
4. Backend verifies payment with Paystack
5. Backend updates user's subscription/wallet
6. Frontend shows success/failure message
7. User redirected to appropriate page

---

## Important Notes

### Security
- ✅ Payment verification happens on **backend** (server-to-server with Paystack)
- ✅ Frontend only displays result, doesn't trust URL parameters alone
- ✅ Backend validates payment status before activating subscription/tokens

### User Experience
- Loading state shown while verifying payment
- Clear success/failure messaging
- Automatic redirect after verification
- User can retry payment if failed

### Error Handling
- Missing reference: Shows "No payment reference found"
- Cancelled payment: Shows "Payment was cancelled"
- Failed payment: Shows "Payment verification failed"
- Network error: Shows "Failed to verify payment"

---

## Testing

### Test in Paystack Sandbox
1. Switch Paystack dashboard to **Test Mode**
2. Use test callback URL: `http://localhost:3000/payments/callback`
3. Use test card: `4084084084084081` (Successful payment)
4. Verify callback is triggered and verification works

### Test Scenarios
- ✅ Successful payment
- ✅ Failed payment
- ✅ Cancelled payment
- ✅ Missing reference
- ✅ Network error during verification

---

## File Locations

**Callback Page:**
```
app/payments/callback/page.tsx
```

**Payment API:**
```
lib/api/payments.ts
```

**Store/Checkout Page:**
```
app/store/page.tsx
```

---

## Backend Requirements

The backend must have these endpoints:

### 1. Initiate Payment
```
POST /api/v1/payments/initiate
Body: { amount: number, purpose: string }
Response: { authorizationUrl: string, reference: string }
```

### 2. Verify Payment
```
GET /api/v1/payments/verify/{reference}
Response: {
  status: "success" | "failed" | "pending",
  verified: boolean,
  message: string,
  amount: number,
  currency: string
}
```

### 3. Purchase Subscription
```
POST /api/v1/payments/subscriptions/purchase
Body: { packageId: string }
Response: {
  payment?: { authorizationUrl: string },
  subscription?: { ... }
}
```

---

## Deployment Checklist

Before going live:

- [ ] Set production callback URL in Paystack dashboard
- [ ] Ensure backend verification endpoint is secure (HTTPS only)
- [ ] Test with Paystack test mode first
- [ ] Verify webhook configuration (if using webhooks)
- [ ] Test all payment scenarios (success, failure, cancellation)
- [ ] Confirm redirect URLs work in production
- [ ] Monitor callback page logs for errors

---

## Support

**Paystack Documentation:**
- https://paystack.com/docs/payments/accept-payments
- https://paystack.com/docs/payments/verify-payments

**Paystack Support:**
- Email: support@paystack.com
- Dashboard: https://dashboard.paystack.com

---

**Status:** ✅ Callback page implemented and ready for configuration  
**Last Updated:** December 2024
