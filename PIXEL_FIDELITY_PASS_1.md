# Visual Fidelity Pass #1 — Complete

## Changes Made

### 1. Homepage — "Login / Sign Up" Button Border ✅

**File:** `components/layout/navbar.tsx`

**Change:** Added subtle pink border to match Figma
- Added `border border-primary/30` to the button
- Creates a ~1px pink-tinted outline without heavy glow/shadow
- Border uses 30% opacity of primary color for subtlety

### 2a. Auth Page — Exact Color: Flat #F40289 ✅

**Files:** 
- `app/globals.css` (added new utility classes)
- `app/features/auth/presentation/unified-auth-form.tsx`

**Changes:**
1. **Added new CSS utilities in globals.css:**
   ```css
   .bg-auth-accent { background-color: #F40289; }
   .text-auth-accent { color: #F40289; }
   .border-auth-accent { border-color: #F40289; }
   ```

2. **Login/Sign Up Toggle:**
   - Changed from `bg-brand-gradient` to `bg-auth-accent`
   - Now uses flat solid `#F40289` when active (not gradient)
   - Removed shadow effect (`shadow-lg shadow-primary/20`)

3. **Phone/Email Toggle:**
   - Changed from `border-2 border-primary bg-primary/10 text-primary` to:
   - `border border-auth-accent bg-[#2A0814] text-auth-accent`
   - Now uses single border (not border-2) with `#F40289`
   - Background is dark maroon tint `#2A0814` (not bright glow)
   - Text/icon color is `#F40289`
   - Removed any glow/shadow effects

4. **Primary CTA Button (Send OTP, etc.):**
   - Kept `bg-brand-gradient` — Figma shows gradient on main CTA button
   - Only toggles use flat `#F40289`, not all pink elements

### 2b. Auth Page — Sizing and Spacing ✅

**File:** `app/features/auth/presentation/unified-auth-form.tsx`

**Changes to match Figma proportions:**

1. **Card Container:**
   - Changed padding: `p-8` → `px-10 py-10`
   - Changed spacing: `space-y-6` → `space-y-7`
   - Added `max-w-md mx-auto` for consistent width

2. **Logo Section:**
   - Reduced padding: `py-4` → `py-2`
   - More compact vertical spacing

3. **Mode Toggle (Login/Sign Up):**
   - Increased button height: `py-3` → `py-3.5`
   - Added top padding: `pt-2` to the container
   - Better proportion relative to card width

4. **Method Toggle (Phone/Email):**
   - Increased button height: `py-3` → `py-3.5`
   - Consistent with mode toggle sizing

5. **Form Section:**
   - Changed spacing: `space-y-4` → `space-y-5`
   - Added `pt-2` to form container
   - Labels now use `mb-2` (was `mb-1.5`)
   - Labels now have `font-medium` weight

6. **Input Fields:**
   - Added explicit `py-3` to all inputs for consistent height
   - Phone prefix box: `py-4` → `py-3` to match input height

7. **Submit Button:**
   - Added explicit `py-3.5` for proper height
   - Maintained `mt-6` for spacing above button

8. **Divider:**
   - Increased spacing: `py-3` → `py-4`
   - More breathing room around "or" text

9. **Guest Button:**
   - Consistent `py-3.5` with other buttons

### 2c. Auth Page — Logo Shape ✅

**File:** `app/features/auth/presentation/unified-auth-form.tsx`

**Changes to logo badge:**
- Changed border-radius: `rounded-2xl` → `rounded-lg`
- Applied to both form step and OTP step
- Logo is now a **rounded square** (not near-circular)
- Matches Figma's squircle shape exactly

**Note:** Only changed logo on auth page as specified. Did not touch:
- Sidebar logo
- Mobile nav logo
- Public navbar logo
- Any other instances not confirmed wrong

## Verification Results

### TypeScript Compilation ✅
```bash
npx tsc --noEmit
Exit Code: 0
```

### ESLint ✅
```bash
npx eslint . --max-warnings=10
9 warnings (all pre-existing, unrelated to changes)
Exit Code: 0
```

## Summary

All three specified fixes have been implemented exactly as requested:

1. ✅ Homepage "Login / Sign Up" button now has subtle 1px pink border
2. ✅ Auth toggles use flat `#F40289` (not gradient), with proper border treatment
3. ✅ Auth card spacing/sizing adjusted to match Figma proportions
4. ✅ Auth logo badge changed to rounded square (not circular)

**No other changes were made** — this was strictly a pixel-fidelity correction pass based on side-by-side Figma comparison.

The implementation is ready for visual verification against the Figma reference screenshots.
