# NollyWin - Complete Navigation Flows & Links

## 🔗 All Application Routes

### Public Routes
- `/` - Landing page with "Play Now" button → `/auth`
- `/auth` - Unified auth form (dark theme)
- `/admin/login` - Admin login page

### Authenticated Routes (Protected by AuthenticatedShell)
- `/home` - Main dashboard
- `/game` - Trivia gameplay
- `/store` - Subscription plans & token top-up
- `/leaderboard` - Competition rankings
- `/refer-earn` - Referral program
- `/notifications` - Inbox
- `/profile` - User profile with inline editing
- `/profile/change-password` - Password update
- `/profile/notification-preferences` - Toggle notifications
- `/stats` - User statistics

### Admin Routes (Red theme)
- `/admin/overview` - Admin dashboard
- `/admin/users` - User management
- `/admin/users/[userId]` - Individual user details
- `/admin/packages` - Subscription packages
- `/admin/trivia-setup` - Question management
- `/admin/reports` - Analytics & reports
- `/admin/rewards` - Raffle draw management

---

## 🎯 Authentication Flow (Dark Theme)

### Starting Point: Landing Page (`/`)
1. User lands on `/`
2. Sees hero section with "Play Now →" button
3. Clicks "Play Now" → Routes to `/auth`

### Auth Page: 4 Mode Combinations

#### 1. Login + Phone
**Fields:** Phone number only
**Button:** "Send OTP" (pink gradient)
**Flow:**
- User enters phone number
- Clicks "Send OTP"
- Mock backend call: `simulateRequest({ ok: true }, 800ms)`
- Routes to OTP screen
- User enters 4-digit code
- Clicks "Verify & Continue"
- Session created with token + user data
- Routes to `/home`

#### 2. Login + Email
**Fields:** Email + Password
**Button:** "Login" (pink gradient)
**Flow:**
- User enters email + password
- Clicks "Login"
- Mock backend call: `simulateRequest({ token, user }, 1200ms)`
- Session created immediately
- Routes to `/home`

#### 3. Sign Up + Phone
**Fields:** Phone number only
**Button:** "Send OTP" (pink gradient)
**Flow:**
- User enters phone number
- Clicks "Send OTP"
- Mock backend call: `simulateRequest({ ok: true }, 800ms)`
- Routes to OTP screen
- User enters 4-digit code
- Clicks "Verify & Continue"
- Session created with auto-generated name: `Player XXXX`
- Routes to `/home`

#### 4. Sign Up + Email
**Fields:** Full Name + Email + Password
**Button:** "Create Account" (pink gradient)
**Flow:**
- User enters full name, email, password
- Password strength indicator shows real-time feedback
- Clicks "Create Account"
- Mock backend call: `simulateRequest({ token, user }, 1200ms)`
- Session created immediately
- Routes to `/home`

### Guest Mode
**Available:** Always visible at bottom of auth form
**Button:** "Continue as Guest" (outlined, white text)
**Flow:**
- User clicks "Continue as Guest"
- Guest session created:
  ```typescript
  {
    token: "guest-session-token",
    user: { email: "guest@nollywin.local", fullName: "Guest User" }
  }
  ```
- Routes to `/home`

### OTP Screen Features
- **4-digit input boxes** with auto-focus progression
- **Active box** highlighted with pink border + shadow
- **Countdown timer** (60 seconds)
- **Resend OTP** link appears after countdown
- **Back arrow** to return to form
- **Error messages** for invalid codes
- **Dark theme** with black background

---

## 🏠 Dashboard Navigation (`/home`)

### Layout Components
- **Sidebar** (Desktop) - Full navigation menu
- **MobileNav** (Mobile) - Hamburger menu with same links
- **TopBar** - User avatar, token balance, notification bell

### Available Navigation Links (Sidebar/MobileNav)
1. **Home** → `/home`
2. **Play Trivia** → `/game`
3. **Store** → `/store`
4. **Leaderboard** → `/leaderboard`
5. **Refer & Earn** → `/refer-earn`
6. **Profile** → `/profile`
7. **Stats** → `/stats`

### TopBar Actions
- **Notification Bell** → `/notifications` (shows badge count)
- **Avatar Dropdown** → Opens menu with:
  - View Profile → `/profile`
  - Sign Out → Clears session, redirects to `/`

### Dashboard Quick Actions
- **Play Now Card** → `/game`
- **Buy Tokens** → `/store` (scrolls to Token Top-Up section)
- **Active Subscription Card** → `/store`

---

## 🎮 Trivia Game Flow (`/game`)

### Game Details Screen
- Shows selected stage info
- Displays token cost
- "Start Game" button → Begins trivia
- "Insufficient Tokens" modal → Redirects to `/store`

### Question Screen
- **Progress bar:** 3 stages (Stage 1: 1-5, Stage 2: 6-10, Stage 3: 11-15)
- **5 options:** A, B, C, D, E (letter badges)
- **Timer:** Real-time countdown
- **Submit Answer** → Next question or end game
- **Stage Cleared** → Confetti animation + "Next Stage" button

### Post-Game
- Results summary
- Points earned
- "Play Again" → Restart game
- "View Leaderboard" → `/leaderboard`

---

## 🛒 Store Page (`/store`)

### Subscription Plans Section
- **3 tiers:** Daily (₦100), Weekly (₦200 - "Best value"), Monthly (₦500)
- Each card shows:
  - Price
  - Game attempts included
  - Token bonus
  - "Choose Plan" button → Opens checkout modal

### Token Top-Up Section
- **4 packages:**
  1. **Starter:** 500 tokens - ₦1,000
  2. **Standard:** 1,200 tokens - ₦2,000 (+20% bonus)
  3. **Value:** 3,000 tokens - ₦5,000 (+50% bonus)
  4. **Pro:** 6,500 tokens - ₦10,000 (+85% bonus)
- Each card shows:
  - Token amount
  - Bonus percentage (if applicable)
  - Price
  - "Buy Tokens" button → Opens checkout modal

### Checkout Modal
- **3 Payment Methods:**
  1. **Airtime Transfer:**
     - Instructions: Dial *460*Amount*RECEIVER_CODE#
     - Receiver code displayed
     - Manual verification info
  2. **USSD Code:**
     - Generated code: `*737*000*Amount*RECEIVER_ACCOUNT#`
     - Copy button
     - Network instructions
  3. **Bank Card:**
     - Card number input (16 digits with spacing)
     - Expiry date (MM/YY format)
     - CVV (3 digits)
     - "Pay Now" button
- All methods use `simulateRequest()` for mock processing
- Success → Updates wallet store, shows confirmation

---

## 👤 Profile Page (`/profile`)

### Profile Sections
1. **Header:** Avatar (2-letter initials) + Full Name + Email
2. **Stats Cards:** Rank, Points, Tokens (with trophy/star/coin icons)
3. **Personal Information:** Inline editing (pencil icon → edit mode)
4. **Refer & Earn:** Embedded with invite link + share buttons
5. **Action Buttons:**
   - Change Password → `/profile/change-password`
   - Notification Preferences → `/profile/notification-preferences`
   - Sign Out → Clears session, redirects to `/`

### Change Password (`/profile/change-password`)
- Back arrow → `/profile`
- New Password field (eye toggle)
- Confirm Password field (eye toggle)
- Password requirements checklist (live validation)
- Dynamic button label based on validation
- Submit → `simulateRequest()` → Success message → Back to profile

### Notification Preferences (`/profile/notification-preferences`)
- Back arrow → `/profile`
- **6 toggle switches:**
  - Games & Raffles:
    1. Raffle Draw Results
    2. Game Session Results
    3. Leaderboard Changes
  - Account & Updates:
    4. Subscription Reminders
    5. New Features
    6. Weekly Digest
- **Push Notifications** row with "Allow" button
- All changes persist via `notification-preferences-store.ts`

---

## 🏆 Leaderboard Page (`/leaderboard`)

### Features
- **Weekly competition** countdown timer
- **Prize pool breakdown:**
  - 🥇 1st Place: ₦50,000 (gold badge + crown)
  - 🥈 2nd Place: ₦30,000 (silver badge + crown)
  - 🥉 3rd Place: ₦10,000 (bronze badge + crown)
- **Leaderboard table:**
  - Rank column (numbered badges 1-3 for top 3)
  - Player name
  - Points
  - Prize column (for top 3)
- **Current user highlighting** (subtle pink background)
- **Mock data:** 10 players seeded

---

## 🔔 Notifications Page (`/notifications`)

### Layout
- Back arrow → Previous page
- Heading: "Notifications" + Pink badge showing "X new"

### Notification Types
1. **Game Result** (Blue icon, game controller)
2. **Raffle Entry** (Purple icon, ticket)
3. **Subscription Active** (Green icon, check)
4. **Leaderboard Update** (Yellow icon, trophy)
5. **New Feature** (Pink icon, star)

### Notification Card
- Colored icon circle (type-specific)
- Title (bold)
- Description text
- Relative timestamp ("Just now", "5 min ago", etc.)
- **Unread:** Pink dot + primary border
- **Read:** No dot, normal border

### Empty State
- Centered icon
- "All caught up!"
- "No new notifications right now"

---

## 💰 Refer & Earn (Embedded in Profile)

### Features
- **Invite Link Card:**
  - Your unique referral link
  - Copy button
  - Stats: Successful Invites + Tokens Earned
- **Share Buttons:**
  - WhatsApp (green #25D366)
  - X/Twitter (blue #1DA1F2)
  - More (gray)
- All buttons functional with `simulateRequest()` mock

---

## 🔴 Admin Section

### Admin Login (`/admin/login`)
- Separate login form with red theme
- Email + Password only
- Mock admin credentials accepted
- Routes to `/admin/overview`

### Admin Navigation
- Red gradient theme (overrides pink)
- All admin routes use `AdminShell` layout
- Sidebar with admin-specific links

### Admin Rewards Page (`/admin/rewards`)
1. **Active Raffle Draw Card:**
   - Prize name
   - Total entries
   - Draw date/time
   - Ticket cost
   - "Manage Draw" button → Edit modal
2. **Create New Draw Card:**
   - Prize name input
   - Ticket cost input
   - "Create Draw" button → Creates new raffle
- All actions use `raffle-draw-store.ts` + `simulateRequest()`

### Admin Trivia Setup (`/admin/trivia-setup`)
- **Question count by stage** (Stage 1/2/3: 5 questions each)
- **Bulk CSV upload:**
  - Template with 5 option columns (A, B, C, D, E)
  - Parse and validate
  - Bulk import
- **Manual question form:**
  - Question text
  - 5 answer options
  - Correct answer dropdown
  - Stage selection
  - Difficulty level
- All data saved to `mock-questions.ts`

---

## 🔐 Session Management

### Auth Store (Zustand + Persist)
```typescript
{
  token: string | null,
  user: { email: string, fullName?: string } | null,
  setSession: (token, user) => void,
  logout: () => void
}
```

### Storage
- Persisted to `localStorage` key: `nollywin-auth`
- Survives page refresh
- Cleared on logout

### Protected Routes
- All `/home`, `/game`, `/store`, etc. check for session
- If no session → Redirect to `/auth`
- Guest sessions are valid sessions

---

## 🧪 Mock Backend System

### All API Calls Use `simulateRequest()`
```typescript
// Location: lib/api/simulate.ts
export function simulateRequest<T>(result: T, delayMs = 600): Promise<T> {
  return new Promise((resolve) => 
    setTimeout(() => resolve(result), delayMs)
  );
}
```

### Usage Examples

**Auth Login:**
```typescript
const res = await simulateRequest({ 
  token: "dev-session-token", 
  user: { email, fullName } 
}, 1200);
```

**Send OTP:**
```typescript
await simulateRequest({ ok: true }, 800);
```

**Checkout Payment:**
```typescript
const result = await simulateRequest({ 
  success: true, 
  orderId: "ORD-12345" 
}, 2000);
```

**Create Raffle Draw:**
```typescript
const newDraw = await simulateRequest({
  id: Date.now(),
  prize,
  ticketCost,
  entries: 0
}, 1000);
```

### Zustand Stores with Persist
All state uses Zustand stores that persist to localStorage:

1. **auth-store.ts** - Session data
2. **wallet-store.ts** - Tokens & points
3. **packages-store.ts** - Subscription plans
4. **token-packages-store.ts** - Token top-up packages
5. **subscription-store.ts** - Active subscription
6. **raffle-draw-store.ts** - Admin raffle management
7. **leaderboard-store.ts** - Competition data
8. **notification-preferences-store.ts** - User notification toggles

---

## ✅ Complete Integration Checklist

### ✓ Auth System
- [x] 4 mode combinations (Login/Signup × Phone/Email)
- [x] Dark theme with black background
- [x] Pink gradient buttons for primary actions
- [x] Pink outline toggles for Phone/Email
- [x] 4-digit OTP with auto-focus
- [x] Guest mode with session creation
- [x] All routes use `simulateRequest()`

### ✓ Navigation
- [x] Landing page → Auth page
- [x] Auth page → Home dashboard
- [x] Sidebar/MobileNav with all routes
- [x] TopBar with notifications/profile
- [x] All links functional

### ✓ Store & Payments
- [x] 3 subscription tiers (Daily/Weekly/Monthly)
- [x] 4 token top-up packages
- [x] 3 payment methods (Airtime/USSD/Card)
- [x] Checkout modal with validation
- [x] Wallet store integration

### ✓ Trivia Game
- [x] Game details pre-game screen
- [x] Question screen with 5 options (A-E)
- [x] 3-stage progress system
- [x] Token deduction + insufficient tokens modal
- [x] Stage cleared animation
- [x] Results summary

### ✓ Profile
- [x] Inline editing for personal info
- [x] Change password route
- [x] Notification preferences route
- [x] Refer & earn embedded
- [x] Sign out functionality

### ✓ Additional Pages
- [x] Notifications inbox with 5 types
- [x] Leaderboard with mock data
- [x] Admin rewards page
- [x] All using mock backend

---

## 🚀 Ready for Backend Integration

### When Real APIs Are Available

1. **Replace `simulateRequest()` with real API client:**
   ```typescript
   // From: lib/api/simulate.ts
   simulateRequest({ token, user })
   
   // To: lib/api/client.ts
   apiClient.post('/auth/login', { email, password })
   ```

2. **Update auth-store.ts to call real endpoints:**
   - POST `/auth/login`
   - POST `/auth/register`
   - POST `/auth/send-otp`
   - POST `/auth/verify-otp`

3. **Update wallet-store.ts:**
   - GET `/users/wallet`
   - POST `/payments/checkout`

4. **Update game flow:**
   - GET `/trivia/questions?stage=1`
   - POST `/trivia/submit-answer`
   - POST `/trivia/complete-game`

5. **All Zustand stores remain unchanged** - just swap data sources

---

## 📱 Responsive Design

- **Desktop:** Sidebar + TopBar layout
- **Mobile:** MobileNav hamburger menu
- **Tablet:** Responsive grid layouts
- **All screens:** Touch-friendly 44px minimum tap targets

---

## 🎨 Design System

### Colors
- **Background:** Black (`#000000` for auth, `oklch(0.147 0.005 308)` for dashboard)
- **Primary:** Pink (`oklch(0.628 0.25 3)`)
- **Gradient:** `linear-gradient(135deg, #F50B7A 0%, #FC0D28 100%)`
- **Text:** White (`oklch(1 0 0)`)
- **Muted:** White/50% opacity

### Typography
- **Headings:** Bold, large sizes
- **Body:** Medium weight
- **Labels:** 70% opacity white

### Components
- **Buttons:** Rounded-xl, gradient or outline
- **Inputs:** Dark background, pink focus border
- **Cards:** Black/dark gray with subtle borders
- **Badges:** Colored backgrounds with icons

---

## 🔧 Technical Stack

- **Framework:** Next.js 15+ (App Router)
- **State:** Zustand + Persist middleware
- **Forms:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS + Custom gradients
- **Icons:** Lucide React
- **Mock Backend:** Custom `simulateRequest()` helper

---

## 📄 Summary

**Everything is properly linked and navigable end-to-end.** The entire application flow works with mock/dummy functionality, and the structure is realistic for easy backend integration. No real API endpoints are used - all data is simulated with realistic delays and stored in Zustand persist stores.

The authentication system now matches the exact dark theme design with:
- Black background
- Pink gradient buttons for Login/Sign Up toggles
- Pink outline for Phone/Email toggles
- Proper field layouts for all 4 mode combinations
- "Continue as Guest" always visible
- Complete OTP flow with countdown + resend

All routes are connected and functional with simulated backend calls.
