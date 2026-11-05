# Verifications → Approvals Rename Summary

## Changes Made

All user-facing instances of "Verification(s)" referring to the change requests/approvals page have been renamed to "Approval(s)".

### Files Changed (5 total)

1. **`components/layout/admin-sidebar.tsx`**
   - Sidebar menu item: `"Verifications"` → `"Approvals"`
   - Comment: `// For checkers, show only Verifications` → `// For checkers, show only Approvals`

2. **`components/layout/admin-auth-guard.tsx`**
   - Comment: `// Redirect checker to verifications if accessing unauthorized page` → `// Redirect checker to approvals if accessing unauthorized page`

3. **`app/admin/change-requests/page.tsx`**
   - Page title (2 instances): `title="Verifications"` → `title="Approvals"`
   - Browser tab title: Added `useEffect` to set `document.title = "Approvals | NollyWin Admin"`
   - Empty state: `No ${statusFilter.toLowerCase()} change requests` → `No ${statusFilter.toLowerCase()} approvals`

4. **`components/admin/value-renderer.tsx`**
   - **Alignment fix:** Changed `sm:items-start` to `sm:items-baseline` in DetailValue component
   - Added `leading-relaxed` to labels and values for consistent line height
   - This ensures labels (Prize, Schedule, etc.) sit on the same baseline as their values

### What Was NOT Changed

**Left unchanged (different context):**
- `app/admin/auth/magic-link/page.tsx`:
  - `"No verification token provided"` - refers to magic link token verification
  - `"Magic link verification response"` - technical logging
  - `"Magic link verification error"` - technical logging  
  - `"Verification Failed"` - magic link verification UI
  - `"Could not verify magic link"` - magic link verification error
  - **Reason:** These refer to email/magic link verification, not the approvals page

**API and Routes:**
- Route path remains `/admin/change-requests` (not renamed)
- No API calls or query keys changed
- No file/folder names changed
- Checker's post-login landing stays as-is

### Text Replacements Summary

| Location | Before | After |
|----------|--------|-------|
| Sidebar | Verifications | Approvals |
| Page header | Verifications | Approvals |
| Browser tab | (default) | Approvals \| NollyWin Admin |
| Empty state | No pending change requests | No pending approvals |
| Empty state | No approved change requests | No approved approvals |
| Empty state | No rejected change requests | No rejected approvals |
| Comment | show only Verifications | show only Approvals |
| Comment | Redirect...to verifications | Redirect...to approvals |

### Alignment Fix Detail

**Problem:** In "Request details" section, labels (Prize, Schedule, Start Date, etc.) appeared slightly higher than their values.

**Solution:**
- Changed flex container from `items-start` to `items-baseline`
- Added `leading-relaxed` (line-height: 1.625) to both labels and values
- This ensures text sits on the same baseline regardless of font weight differences

**Before:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
  <span className="text-xs text-muted-foreground sm:min-w-[140px] font-medium">
    {label}:
  </span>
  <div className="flex-1 min-w-0">{renderValue(value, 0, compact)}</div>
</div>
```

**After:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
  <span className="text-xs text-muted-foreground sm:min-w-[140px] font-medium leading-relaxed">
    {label}:
  </span>
  <div className="flex-1 min-w-0 leading-relaxed">{renderValue(value, 0, compact)}</div>
</div>
```

## Build Status

✅ **Build:** Passing (Exit Code: 0)  
✅ **TypeScript:** Clean (8.6s)  
✅ **Lint:** No errors  
✅ **Pages:** 35/35 generated successfully

## Verification Checklist

- [x] Sidebar shows "Approvals" for both maker and checker
- [x] Page header reads "Approvals"
- [x] Browser tab title shows "Approvals | NollyWin Admin"
- [x] Empty states say "No pending approvals" etc.
- [x] Magic link verification text unchanged (different context)
- [x] Route path still `/admin/change-requests`
- [x] API calls unchanged
- [x] Request details labels align with values
- [x] Build passes with no errors

## Screenshots Needed

1. **Sidebar (Maker role) - 1440px**: Shows full navigation with "Approvals" item
2. **Sidebar (Maker role) - 390px**: Shows mobile sidebar with "Approvals"
3. **Sidebar (Checker role) - 1440px**: Shows only "Approvals" item
4. **Sidebar (Checker role) - 390px**: Shows mobile sidebar with only "Approvals"
5. **Page header - 1440px**: Shows "Approvals" title and description
6. **Page header - 390px**: Shows responsive "Approvals" header
7. **Request details alignment - 1440px**: Labels and values on same baseline
8. **Empty state - 1440px**: Shows "No pending approvals" text

