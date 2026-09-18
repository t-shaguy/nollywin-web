# NollyWin API Integration Testing Checklist

## Overview
This document outlines comprehensive testing steps for the NollyWin frontend API integration once the backend service (`nollywin-core`) is available.

**Backend Status**: Currently down for testing  
**Admin Credentials**: Not yet available  
**Last Updated**: Phase 12 Complete

---

## Prerequisites

1. **Backend Service Running**
   - [ ] nollywin-core service is running at `http://localhost:8081` (or update `.env.local`)
   - [ ] All database migrations applied
   - [ ] Paycraft auth proxy configured correctly

2. **Environment Setup**
   - [ ] `.env.local` file exists with correct `NEXT_PUBLIC_API_URL`
   - [ ] Frontend dev server running (`npm run dev`)
   - [ ] Browser DevTools open for network inspection

---

## Phase 1: Authentication & User Management

### Registration Flow
- [ ] Navigate to `/auth` or `/register`
- [ ] Fill out registration form with:
  - First Name
  - Last Name
  - Phone Number (Nigerian format)
  - Email
  - Alias/Username
  - Password (with strength indicator)
  - Optional: Referral Code
- [ ] Submit and verify:
  - ✅ POST `/api/v1/auth/register` succeeds
  - ✅ Appropriate response (may redirect to OTP or auto-login)
  - ✅ Error handling for duplicate email/phone/alias

**Expected Request Shape**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "email": "string",
  "alias": "string",
  "referralCode": "string?",
  "password": "string",
  "confirmPassword": "string"
}
```

### Login Flow
- [ ] Navigate to `/login`
- [ ] Enter email and password
- [ ] Click "Login with Password"
- [ ] Verify:
  - ✅ POST `/api/v1/auth/login` succeeds
  - ✅ Response contains `accessToken` and `user` object
  - ✅ Token stored in auth-store (check localStorage/sessionStorage)
  - ✅ User redirected to `/home`
  - ✅ Authorization header includes `Bearer {token}` in subsequent requests

**Expected Response Shape**:
```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "alias": "string"
  }
}
```

### OTP Verification
- [ ] **Phone OTP Request**: POST `/api/v1/auth/otp/phone/request`
- [ ] **Phone OTP Verify**: POST `/api/v1/auth/otp/phone/verify`
- [ ] **Email OTP Verify**: POST `/api/v1/auth/otp/verify`
- [ ] **Resend OTP**: POST `/api/v1/auth/otp/resend`
- [ ] Verify OTP input component accepts 6-digit code
- [ ] Verify resend countdown timer works
- [ ] Test invalid OTP error handling

### Password Reset Flow
- [ ] Navigate to `/forgot-password`
- [ ] Enter email address
- [ ] Submit and verify POST `/api/v1/auth/forgot-password` succeeds
- [ ] Check email for OTP code (if applicable)
- [ ] Navigate to `/reset-password` (or redirected)
- [ ] Enter email, OTP code, new password, confirm password
- [ ] Submit and verify POST `/api/v1/auth/reset-password` succeeds
- [ ] Verify redirect to login page

---

## Phase 2: Profile Management

### View Profile
- [ ] Navigate to `/profile` while authenticated
- [ ] Verify:
  - ✅ GET `/api/v1/profile` succeeds
  - ✅ User details displayed correctly (firstName, lastName, phoneNumber, alias)
  - ✅ Avatar loads (or shows placeholder if not set)

### Update Profile
- [ ] Edit firstName, lastName, phoneNumber, or alias
- [ ] Click "Save Changes"
- [ ] Verify:
  - ✅ PUT `/api/v1/profile` succeeds
  - ✅ User object in auth-store updates
  - ✅ UI reflects new values immediately
  - ✅ Success toast appears

**Expected Request Shape**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "alias": "string"
}
```

### Avatar Upload
- [ ] Click "Upload Avatar" button
- [ ] Select image file (PNG/JPG/JPEG/GIF, max 5MB)
- [ ] Verify:
  - ✅ File validation works (size/type)
  - ✅ POST `/api/v1/profile/avatar` with `multipart/form-data` succeeds
  - ✅ Avatar preview updates immediately
  - ✅ GET `/api/v1/profile/avatar` returns image correctly

### Change Password
- [ ] Enter current password, new password, confirm password
- [ ] Click "Change Password"
- [ ] Verify:
  - ✅ POST `/api/v1/auth/change-password` succeeds (⚠️ **PATH TBD** - may differ)
  - ✅ Success message shown
  - ✅ Can log in with new password

**⚠️ BACKEND CLARIFICATION NEEDED**: Confirm change password endpoint path

---

## Phase 3: Wallet & Balance

### Wallet Sync
- [ ] Log in and navigate to `/home`
- [ ] Verify:
  - ✅ GET `/api/v1/wallet/balance` called automatically on mount
  - ✅ Balance (tokens + points) displayed in top bar and dashboard
  - ✅ Wallet store updates correctly

### Transaction History
- [ ] Navigate to transaction history view (if exists)
- [ ] Verify:
  - ✅ GET `/api/v1/wallet/transactions?limit=50` succeeds
  - ✅ Transactions displayed correctly
  - ✅ Pagination works (if implemented)

### Top Up Wallet
- [ ] Initiate a wallet top-up (if UI exists)
- [ ] Verify:
  - ✅ POST `/api/v1/wallet/topup` succeeds
  - ✅ Redirects to payment gateway or returns payment URL
  - ✅ Balance updates after successful payment

---

## Phase 4: Referral System

### Referral Link
- [ ] Navigate to `/refer-earn`
- [ ] Verify:
  - ✅ GET `/api/v1/referral/link` succeeds
  - ✅ Referral link displayed correctly
  - ✅ Copy button works
  - ✅ Share buttons functional

### Referral Stats
- [ ] On same page, verify:
  - ✅ GET `/api/v1/referral/stats` succeeds
  - ✅ Total referrals count shown
  - ✅ Rewards earned displayed
  - ✅ Active referrals vs inactive (if backend provides)

---

## Phase 5: Subscriptions & Payments

### View Subscription Packages
- [ ] Navigate to `/store`
- [ ] Verify:
  - ✅ Available subscription packages displayed
  - ✅ Package details (name, price, duration, attempts) correct

### Purchase Subscription
- [ ] Click "Subscribe" on a package
- [ ] Verify:
  - ✅ POST `/api/v1/payments/subscriptions` succeeds
  - ✅ Response contains `authorizationUrl` for Paystack
  - ✅ User redirected to Paystack payment page
  - ✅ After payment, user redirected back to app
  - ✅ GET `/api/v1/payments/subscriptions/me` called to fetch subscription status
  - ✅ Subscription stored in subscription-store
  - ✅ Subscription card shows active plan

**Expected Response Shape** (Paystack):
```json
{
  "authorizationUrl": "https://paystack.com/pay/...",
  "reference": "string"
}
```

### Verify Payment
- [ ] After Paystack redirect back with `reference` query param
- [ ] Verify:
  - ✅ POST `/api/v1/payments/verify` called with reference
  - ✅ Payment verification succeeds
  - ✅ Subscription status updates

⚠️ **NOTE**: Card form in `checkout-modal.tsx` is deprecated placeholder - real flow uses Paystack redirect

---

## Phase 6: Gameplay

### Start Game Attempt
- [ ] Navigate to `/game` or click "Play Now"
- [ ] Select a stage
- [ ] Click "Start Game"
- [ ] Verify:
  - ✅ POST `/api/v1/game/attempt/start` with `{ stage: 1 }` succeeds
  - ✅ Response contains `attemptId` and first question
  - ✅ Wallet balance updates (1 token deducted)
  - ✅ GET `/api/v1/wallet/balance` called after game start

**Expected Response Shape**:
```json
{
  "attemptId": "string",
  "stage": 1,
  "currentQuestion": {
    "id": "string",
    "text": "string",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correctAnswer": "A",
    "difficulty": "EASY",
    "stage": 1
  },
  "score": 0
}
```

### Submit Answer
- [ ] Select an answer option
- [ ] Click "Submit Answer"
- [ ] Verify:
  - ✅ POST `/api/v1/game/attempt/{attemptId}/answer` with `{ questionId, selectedAnswer }` succeeds
  - ✅ Response shows `isCorrect`, `points`, and `nextQuestion` (or `completed: true`)
  - ✅ UI shows correct/incorrect feedback
  - ✅ Score updates

**Expected Request Shape**:
```json
{
  "questionId": "string",
  "selectedAnswer": "A"
}
```

**Expected Response Shape**:
```json
{
  "isCorrect": true,
  "points": 10,
  "nextQuestion": { /* same shape as currentQuestion */ },
  "completed": false
}
```

### Complete Game
- [ ] Answer all questions in stage
- [ ] Verify:
  - ✅ Final answer response has `completed: true`
  - ✅ Wallet balance updates (points added)
  - ✅ GET `/api/v1/wallet/balance` called after completion
  - ✅ Stage cleared modal appears
  - ✅ Can start next stage

### Question Adapter
- [ ] Verify that 4-option API format (A-D) converts to 5-option UI format
- [ ] "Skip" option should always be 5th option
- [ ] Correct answer index maps correctly (A=0, B=1, C=2, D=3)

---

## Phase 7: Leaderboard & Raffles

### View Leaderboard
- [ ] Navigate to `/leaderboard`
- [ ] Verify:
  - ✅ GET `/api/v1/leaderboard?period=weekly` succeeds (period optional)
  - ✅ Top players displayed with rank, name, score
  - ✅ Current user's position highlighted (if in top 50)
  - ✅ Loading states work correctly

**Expected Response Shape**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "string",
      "userName": "string",
      "score": 1000
    }
  ],
  "period": "weekly"
}
```

### View Active Raffles
- [ ] On `/home` or `/raffles`, view active raffles section
- [ ] Verify:
  - ✅ GET `/api/v1/rewards/draws` succeeds
  - ✅ Active draws displayed with prize, cost per ticket, draw date
  - ✅ User's ticket count for each draw shown (`userTicketCount`)

**Expected Response Shape**:
```json
{
  "draws": [
    {
      "id": "string",
      "prizeName": "string",
      "prizeValue": "string",
      "drawDate": "2024-12-31T23:59:59Z",
      "ticketsSold": 100,
      "maxTickets": 1000,
      "costPerTicket": 50,
      "status": "active",
      "userTicketCount": 3
    }
  ]
}
```

### Purchase Raffle Ticket
- [ ] Click "Buy Ticket" on a raffle draw
- [ ] Confirm purchase
- [ ] Verify:
  - ✅ POST `/api/v1/rewards/draws/{id}/buy` succeeds
  - ✅ Wallet balance updates (points deducted)
  - ✅ GET `/api/v1/wallet/balance` called after purchase
  - ✅ User ticket count increments
  - ✅ Success modal/toast appears

---

## Phase 8: Admin Panel (UNTESTED - Pending Credentials)

⚠️ **All admin endpoints marked as UNTESTED** - requires `admin_email` and `admin_password` credentials from backend team.

### Admin Login
- [ ] Navigate to `/admin/login`
- [ ] Enter admin email and password
- [ ] Verify:
  - ✅ POST `/api/v1/admin/auth/login` succeeds
  - ✅ Response contains `admin_token` and `admin` object
  - ✅ Admin token used for all subsequent admin requests
  - ✅ Redirected to `/admin/overview`

### Dashboard Overview
- [ ] Navigate to `/admin/overview`
- [ ] Verify:
  - ✅ GET `/api/v1/admin/dashboard` succeeds
  - ✅ Stats displayed: totalUsers, activeUsers, totalGames, totalRevenue

### Package Management
- [ ] Navigate to `/admin/packages`
- [ ] Verify GET `/api/v1/admin/packages` succeeds
- [ ] Test Create: POST `/api/v1/admin/packages` with package data
- [ ] Test Update: PUT `/api/v1/admin/packages/{id}` with updated data
- [ ] Test Delete: DELETE `/api/v1/admin/packages/{id}`

### Trivia Question Management
- [ ] Navigate to `/admin/trivia-setup`
- [ ] Verify GET `/api/v1/admin/trivia/questions?stage=1&difficulty=EASY` succeeds
- [ ] Test Create: POST `/api/v1/admin/trivia/questions` with question data
- [ ] Test Update: PUT `/api/v1/admin/trivia/questions/{id}`
- [ ] Test Delete: DELETE `/api/v1/admin/trivia/questions/{id}`
- [ ] Test Bulk Upload: POST `/api/v1/admin/trivia/questions/bulk` with CSV file

### User Management
- [ ] Navigate to `/admin/users`
- [ ] Verify GET `/api/v1/admin/users?page=1&limit=50` succeeds
- [ ] Click on a user to view details
- [ ] Verify GET `/api/v1/admin/users/{id}` succeeds
- [ ] Test suspend/ban: PUT `/api/v1/admin/users/{id}/status` with `{ status: "SUSPENDED" }`

### Reports
- [ ] Navigate to `/admin/reports`
- [ ] Test Revenue Report: GET `/api/v1/admin/reports/revenue?startDate=...&endDate=...`
- [ ] Test User Activity Report: GET `/api/v1/admin/reports/users`
- [ ] Test Game Activity Report: GET `/api/v1/admin/reports/games`

### Settings
- [ ] Test Get Exchange Rate: GET `/api/v1/admin/settings/exchange-rate`
- [ ] Test Update Exchange Rate: PUT `/api/v1/admin/settings/exchange-rate` with `{ rate: 100 }`

### Reward Draws Management
- [ ] Test Get Draws: GET `/api/v1/admin/rewards/draws`
- [ ] Test Create Draw: POST `/api/v1/admin/rewards/draws` with draw data
- [ ] Test Update Draw: PUT `/api/v1/admin/rewards/draws/{id}`

### Audit Logs
- [ ] Test GET `/api/v1/admin/audit-log?page=1&limit=50`

---

## Phase 9: Error Handling & Edge Cases

### Network Errors
- [ ] Stop backend server
- [ ] Attempt any API call
- [ ] Verify:
  - ✅ Timeout after 15 seconds
  - ✅ User-friendly error message shown
  - ✅ No app crash

### 401 Unauthorized
- [ ] Clear auth token from localStorage/sessionStorage
- [ ] Attempt authenticated API call
- [ ] Verify:
  - ✅ 401 error caught
  - ✅ User redirected to login
  - ✅ Session cleared

### 400/422 Validation Errors
- [ ] Submit form with invalid data (e.g., duplicate email)
- [ ] Verify:
  - ✅ Error message from backend displayed
  - ✅ Field-level errors shown (if backend provides)

### 500 Server Errors
- [ ] Trigger server error (if possible)
- [ ] Verify:
  - ✅ Generic error message shown
  - ✅ User can retry action

### Rate Limiting (if implemented)
- [ ] Make many rapid API calls
- [ ] Verify:
  - ✅ 429 error handled gracefully
  - ✅ Retry-after message shown

---

## Phase 10: Performance & UX

### Loading States
- [ ] Verify all API calls show loading indicators
- [ ] Verify skeleton loaders where appropriate
- [ ] Verify no UI flicker during data fetching

### Optimistic Updates
- [ ] Profile update should feel instant (UI updates before server response)
- [ ] Wallet balance should update after game/purchase

### Auto-Sync on Mount
- [ ] AuthenticatedShell should auto-fetch wallet balance and subscription status
- [ ] Verify no duplicate API calls on same mount

---

## Known Issues & Assumptions to Verify

### 1. Change Password Endpoint Path
**Assumption**: `/api/v1/auth/change-password`  
**Action**: Confirm with backend team if path is correct

### 2. Paystack Response Shape
**Assumption**: Paystack returns `authorizationUrl` in payment initiation response  
**Action**: Verify actual response structure from backend

### 3. Question Format Conversion
**Assumption**: API returns 4 options (A-D), UI needs 5 options (A-D + Skip)  
**Action**: Verify with backend if "Skip" should be a real option or UI-only

### 4. Referral Link Construction
**Assumption**: If backend doesn't return full link, frontend constructs it  
**Action**: Confirm referral link format with backend

### 5. Admin Token Storage
**Assumption**: Admin token stored separately from user token  
**Action**: Confirm admin auth flow and token management

---

## Fallback & Mock Data

### lib/api/simulate.ts
- File should remain in codebase as fallback for demo/testing
- Can be toggled via environment variable if needed
- NOT used in production

---

## Testing Tools & Tips

### Browser DevTools
- Network tab: Monitor all API calls, inspect request/response
- Console: Check for errors or warnings
- Application tab: Inspect localStorage/sessionStorage for auth tokens

### Postman/Insomnia
- Import backend API spec if available
- Test endpoints independently before frontend integration
- Verify expected request/response shapes

### Backend Logs
- Monitor backend logs for errors during frontend testing
- Verify CORS headers configured correctly
- Check auth proxy forwarding to paycraft-auth-service-v4

---

## Sign-Off Checklist

- [ ] All Phase 1-8 user-facing features tested
- [ ] All error scenarios handled gracefully
- [ ] Performance acceptable (no long waits, no UI jank)
- [ ] Mobile responsive (if applicable)
- [ ] Admin panel tested (pending credentials)
- [ ] Documentation updated with any API changes
- [ ] Backend team notified of any issues/clarifications needed

---

## Contact & Support

For backend issues or questions:
- Backend Team: [Contact Info]
- API Documentation: [Link if available]
- Issue Tracker: [Link if available]

---

**End of Testing Checklist**
