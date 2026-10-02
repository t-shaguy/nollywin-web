# Responsive Design Implementation Plan

## ✅ Completed
1. **Modal Component** (`components/ui/modal.tsx`)
   - Made responsive with mobile-first approach
   - Reduced padding on mobile: `p-4 sm:p-6`
   - Smaller title on mobile: `text-lg sm:text-xl`
   - Max width adjusted: `max-w-[95vw] sm:max-w-md`
   - Added max-height and scroll: `max-h-[90vh] overflow-y-auto`

2. **Trivia Setup Page** (`app/admin/trivia-setup/page.tsx`)
   - All sections now responsive
   - Buttons stack on mobile, inline on desktop
   - Reduced padding on cards for mobile
   - Smaller text on mobile
   - Action buttons become full-width on mobile

## 🔄 In Progress - Admin Pages

### High Priority Admin Pages
1. **Admin Overview** (`app/admin/overview/page.tsx`)
   - Make stat cards responsive (currently grid-cols-4)
   - Stack charts vertically on mobile
   - Reduce padding in cards for mobile

2. **Admin Users** (`app/admin/users/page.tsx`)
   - Make table responsive (horizontal scroll or card layout on mobile)
   - Stack filters vertically on mobile

3. **Admin Packages** (`app/admin/packages/page.tsx`)
   - Card grid should be responsive
   - Forms should stack on mobile

4. **Admin Rewards** (`app/admin/rewards/page.tsx`)
   - Similar to packages

5. **Admin Reports** (`app/admin/reports/page.tsx`)
   - Charts need mobile optimization
   - Export buttons should stack

## 📱 User-Facing Pages to Make Responsive

### Authentication Pages
1. **Login/Register** (`app/auth/page.tsx`, `app/features/auth/presentation/unified-auth-form.tsx`)
   - ✅ Admin login already responsive
   - User auth form needs same treatment

2. **Forgot Password** (`app/forgot-password/page.tsx`)
   - Form container sizing
   - Button sizing on mobile

3. **Reset Password** (`app/reset-password/page.tsx`)
   - Similar to forgot password

### Dashboard & Home
1. **Home/Dashboard** (`app/home/page.tsx` or root)
   - Stats cards grid (currently may be fixed columns)
   - Quick actions should stack
   - Charts need mobile sizing

2. **Game Page** (`app/game/page.tsx`)
   - Question cards
   - Answer buttons
   - Stage selector

3. **Leaderboard** (`app/leaderboard/page.tsx`)
   - Table or list responsiveness

4. **Store/Packages** (`app/store/page.tsx` or similar)
   - Package cards grid

5. **Profile** (`app/profile/page.tsx`)
   - Form sections
   - Avatar upload
   - Settings cards

6. **Raffles** (`app/raffles/page.tsx`)
   - Raffle cards
   - Purchase modals

7. **Refer & Earn** (`app/refer-earn/page.tsx`)
   - Share buttons
   - Stats display

## 🎨 Component Library - Make All Responsive

### UI Components
1. **Button** (`components/ui/button.tsx`)
   - Add size variants: `xs`, `sm`, `md`, `lg`
   - Text should scale: `text-xs sm:text-sm` etc.

2. **Input** (`components/ui/input.tsx`)
   - Height variants for mobile
   - Font size adjustments

3. **Card** (if exists, or create)
   - Padding variants for mobile

4. **Table** (if exists)
   - Horizontal scroll wrapper on mobile
   - Or convert to card layout

5. **Dialog/Sheet** (if different from Modal)
   - Same responsive treatment as Modal

### Layout Components
1. **Navbar** (`components/layout/navbar.tsx`)
   - Hamburger menu on mobile
   - Logo sizing

2. **Sidebar** (`components/layout/sidebar.tsx`)
   - Drawer/sheet on mobile
   - Fixed on desktop

3. **Top Bar** (`components/layout/top-bar.tsx`)
   - Stack items on mobile
   - Reduce padding

4. **Mobile Nav** (`components/layout/mobile-nav.tsx`)
   - Already mobile-focused, verify

5. **Authenticated Shell** (`components/layout/authenticated-shell.tsx`)
   - Main layout wrapper
   - Padding adjustments for mobile

### Feature Components
1. **Home Components** (`app/features/home/presentation/*`)
   - Active raffles card
   - Dashboard stats
   - Performance chart
   - Play now card
   - Quick actions
   - Subscription card

2. **Game Components** (`app/features/game/presentation/*`)
   - Question view
   - Stage select
   - Stage cleared modal

3. **Profile Components** (`app/features/profile/presentation/*`)
   - Avatar upload
   - Profile details form
   - Change password form
   - Notification preferences

4. **Store Components** (`app/features/store/presentation/*`)
   - Plan cards
   - Checkout modal
   - Payment methods

5. **Raffles Components** (`app/features/raffles/presentation/*`)
   - Active draw card
   - Purchase ticket modal

6. **Refer & Earn Components** (`app/features/refer-earn/presentation/*`)
   - Invite link card
   - Referral stats
   - Share row

7. **Leaderboard Components** (`app/features/leaderboard/presentation/*`)
   - Leaderboard table
   - Countdown

## 📐 Responsive Design Patterns to Use

### Breakpoints (Tailwind defaults)
```
sm: 640px   - Mobile landscape
md: 768px   - Tablet
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Extra large
```

### Spacing Pattern
```css
/* Mobile first, then scale up */
space-y-4 sm:space-y-6 lg:space-y-8
p-3 sm:p-4 md:p-6
gap-2 sm:gap-3 lg:gap-4
```

### Typography Pattern
```css
text-sm sm:text-base lg:text-lg
text-lg sm:text-xl lg:text-2xl
text-2xl sm:text-3xl lg:text-4xl
```

### Grid Pattern
```css
/* 1 col mobile, 2 on tablet, 3+ on desktop */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

### Button Pattern
```css
/* Full width on mobile, auto on desktop */
w-full sm:w-auto
/* Or stack buttons */
flex flex-col sm:flex-row gap-2
```

### Form Pattern
```css
/* Stack labels/inputs on mobile, side-by-side on desktop */
flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4
```

### Card Pattern
```css
rounded-lg sm:rounded-xl lg:rounded-2xl
p-3 sm:p-4 lg:p-6
```

## 🚀 Implementation Order

### Phase 1: Critical Admin Pages (Today)
1. ✅ Modal component
2. ✅ Trivia Setup page
3. Admin Overview page
4. Admin Users page

### Phase 2: User Authentication (Next)
5. User login/register forms
6. Forgot/reset password pages

### Phase 3: Core User Features
7. Home/Dashboard
8. Game page
9. Profile page

### Phase 4: Secondary Features
10. Store/Packages
11. Leaderboard
12. Raffles
13. Refer & Earn

### Phase 5: Polish
14. All remaining components
15. Testing on actual mobile devices
16. Fix any edge cases

## 🧪 Testing Checklist

Test each page at these breakpoints:
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13)
- [ ] 414px (iPhone 12 Pro Max)
- [ ] 640px (Small tablet)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop)
- [ ] 1920px (Large desktop)

## 📝 Notes
- Use Chrome DevTools responsive mode
- Test both portrait and landscape on mobile
- Ensure touch targets are at least 44x44px
- Check that text is readable (not too small)
- Verify that forms are easy to fill on mobile
- Make sure modals don't overflow on small screens
