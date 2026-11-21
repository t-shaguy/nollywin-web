# Wording Fixes Summary

## ✅ All Changes Complete

### 1. Winner Detail Drawer Button Labels

**File:** `components/admin/winner-detail-drawer.tsx`

Updated "Next step" button labels based on `requires` value:
- `REDEEM_CASH` → **"Record bank details"** (was "Redeem (CASH)")
- `REDEEM_ITEM` → **"Record delivery details"** (was "Redeem (ITEM)")
- `FULFIL_CASH` → **"Record payout"** (was "Fulfil (CASH)")
- `FULFIL_ITEM` → **"Record handover"** (was "Fulfil (ITEM)")

---

### 2. Modal Titles & Disclaimer

**File:** `components/admin/winner-action-modals.tsx`

Updated all 4 modal titles to match button labels:
- **"Record bank details"** (Redeem CASH)
- **"Record delivery details"** (Redeem ITEM)
- **"Record payout"** (Fulfil CASH)
- **"Record handover"** (Fulfil ITEM)

Added disclaimer text under each title:
```
"This goes to a checker for approval. No money is sent from this app."
```
- Font size: `text-[11px]`
- Color: `text-muted-foreground`
- Spacing: `mb-3`

---

### 3. Cash Redeem Form Wording

**File:** `components/admin/winner-action-modals.tsx`

#### Proofs Section:
- **Label:** "Account-name check screenshot *" (was "Proofs *")
- **Helper text:** "Run an account-name enquiry first and attach the screenshot." (was "Upload account enquiry screenshot or ID verification")

#### Bank Name Field:
- Marked as **required** with red asterisk (was optional)
- Added `required` attribute to input

---

### 4. Placeholder Styling

**Files:** 
- `components/ui/input.tsx` (already had correct styling)
- `components/admin/winner-action-modals.tsx` (textareas updated)

All placeholders now use `placeholder:text-muted-foreground` which renders as lighter gray text:
- Inputs: ✅ Already correct
- Textareas: ✅ Updated with `placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors`

Placeholders will look like empty fields, not filled values.

---

### 5. Modal Scrollbar Dark Theme

**File:** `components/ui/modal.tsx`

Added dark-themed scrollbar styling to modal content area:
```
[&::-webkit-scrollbar]:w-2 
[&::-webkit-scrollbar-track]:bg-secondary/50 
[&::-webkit-scrollbar-thumb]:bg-border 
[&::-webkit-scrollbar-thumb]:rounded-full 
[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50
```

Scrollbar now matches dark theme:
- Track: dark secondary background
- Thumb: border color (dark gray)
- Hover: lighter gray
- Width: 8px (thin)
- Rounded: pill shape

---

## Build Status

✅ **Build successful** - Exit Code 0  
✅ **TypeScript clean**  
✅ **Dev server running** - http://localhost:3000

---

## Testing Checklist

1. **Winner Detail Drawer:**
   - Open any winner with a pending action
   - Verify button shows:
     - "Record bank details" for REDEEM_CASH
     - "Record delivery details" for REDEEM_ITEM
     - "Record payout" for FULFIL_CASH
     - "Record handover" for FULFIL_ITEM

2. **Modal Titles:**
   - Click each button above
   - Verify modal title matches button text
   - Verify disclaimer appears under title:
     "This goes to a checker for approval. No money is sent from this app."

3. **Cash Redeem Form:**
   - Open "Record bank details" modal
   - Verify "Account-name check screenshot *" label
   - Verify helper: "Run an account-name enquiry first and attach the screenshot."
   - Verify "Bank Name" has red asterisk (required)
   - Try submitting without bank name → should show validation error

4. **Placeholder Styling:**
   - All input fields show gray placeholder text (not white/filled-looking)
   - Examples: "0123456789", "Guaranty Trust Bank", "John Doe"
   - Should clearly look like placeholder hints, not typed values

5. **Scrollbar:**
   - Open any modal
   - Scroll the content area
   - Verify scrollbar is dark gray (matches theme)
   - Verify scrollbar is thin and rounded
   - Not the white Windows default scrollbar

---

## Files Modified (3 files)

1. `components/admin/winner-detail-drawer.tsx` - button labels
2. `components/admin/winner-action-modals.tsx` - modal titles, disclaimer, cash form wording, textarea placeholders
3. `components/ui/modal.tsx` - dark scrollbar styling

---

## Screenshots Needed (4 screenshots)

1. Winner detail drawer showing "Record bank details" button
2. "Record bank details" modal with disclaimer and new labels
3. "Record bank details" modal showing placeholder text (not filled-looking)
4. Modal with dark scrollbar visible (scroll to show scrollbar)
