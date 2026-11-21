# Proof Labels, Account Number Masking & Date Validation - Complete

## ✅ All Changes Complete

### 1. Proof Kind Labels (Verified with Real Backend)

**Specific Labels:**
- `NAME_ENQUIRY` → "Account-name check screenshot"
- `PAYOUT_RECEIPT` → "Transfer receipt"
- `COLLECTION_PHOTO` → "Collection photo"
- Other kinds → Humanized from SNAKE_CASE (e.g., "Other Proof")

**Applied in:**
- Winner Details drawer: Proofs list section
- Proof viewer modal: Title
- Approvals drawer: File attachment label (context-aware)

**Approvals Context-Aware Logic:**
- REDEEM + accountNumber → "Account-name check screenshot"
- FULFIL + payoutReference → "Transfer receipt"
- FULFIL without payoutReference → "Collection photo"
- Fallback → "Attached file"

---

### 2. Account Number Masking & Reveal

**Default Display:** `••••6789` (dots + last 4 digits)

**Controls:**
- **Show/Hide button:** Toggles between masked and full number
- **Copy button:** Copies full number to clipboard

**Reset Behavior:** Account number hides again when drawer closes

**Applied in:**
- Winner Details drawer: Redemption Details section
- Approvals drawer: Request data fields

**Security:**
- Never logged
- Lists/tables/CSV show only what backend returns (already masked as `******6789`)
- Full number only available in detail views with user interaction

---

### 3. Fulfil Date Validation (Client-Side Guard)

**Date must be:**
1. In `Africa/Lagos` timezone (date part only)
2. Today or earlier (cannot be future)
3. On or after redeem date (from `redemption.redeemedAt` in Lagos time)

**Validation:**
- Real-time inline error under date input
- Prevents submission if invalid
- Backend currently accepts any date, so this is client-side protection

**Applied to:**
- Fulfil Cash Modal (Record payout)
- Fulfil Item Modal (Record handover)

**Prop Added:**
- `redeemDate?: string | null` (ISO UTC datetime from backend)
- Converted to Lagos date for comparison

---

## Files Changed (4 files)

### Winner Details Drawer
**File:** `components/admin/winner-detail-drawer.tsx`

**Changes:**
- Added proof kind labels (NAME_ENQUIRY, PAYOUT_RECEIPT, COLLECTION_PHOTO)
- Added humanizeProofKind() function with fallback
- Added showAccountNumber state
- Added maskAccountNumber() helper
- Added handleCopyAccountNumber() helper
- Updated account number display with Show/Hide and Copy buttons
- Account visibility resets when drawer closes
- Proof viewer title uses humanized labels
- Proofs list shows humanized labels
- Added Eye, EyeOff, Copy icons

### Approvals Drawer
**File:** `components/admin/approval-detail-drawer.tsx`

**Changes:**
- Added getFileLabel() - context-aware file label
- Added maskAccountNumber() helper
- Added handleCopyAccountNumber() helper
- Added showAccountNumber state
- Updated formatValue() to return ReactNode (for account number controls)
- Account number shows masked with Show/Hide and Copy buttons
- File attachment label uses getFileLabel()
- File viewer title uses getFileLabel()
- Added Eye, EyeOff, Copy icons
- Fixed requestBody type handling (string | object)

### Winner Action Modals
**File:** `components/admin/winner-action-modals.tsx`

**Changes:**
#### FulfilCashModal:
- Added `redeemDate` prop
- Added getTodayLagos() helper
- Added getRedeemDateLagos() helper
- Added validateFulfilledDate() function
- Added handleFulfilledOnChange() handler
- Added dateError state
- Date input uses min/max and shows inline error
- Validation runs on change and submit

#### FulfilItemModal:
- Same changes as FulfilCashModal

### Winners Page
**File:** `app/admin/winners/page.tsx`

**Changes:**
- Added selectedRedeemDate state
- Set redeemDate when opening Fulfil modals
- Pass redeemDate prop to FulfilCashModal and FulfilItemModal
- Reset redeemDate when drawer closes

---

## Testing Checklist

### 1. Proof Labels - Winner Details
- Open winner with proofs
- Verify proofs list shows:
  - "Account-name check screenshot" (NAME_ENQUIRY)
  - "Transfer receipt" (PAYOUT_RECEIPT)
  - "Collection photo" (COLLECTION_PHOTO)
- Click "View" on a proof
- Verify modal title matches proof label

### 2. Proof Labels - Approvals
- Open change request with REDEEM + bank account
- Verify file label: "Account-name check screenshot"
- Open change request with FULFIL + payoutReference
- Verify file label: "Transfer receipt"
- Open change request with FULFIL (no payoutReference)
- Verify file label: "Collection photo"

### 3. Account Number Masking - Winner Details
- Open CASH winner with DISBURSED status
- Verify account number shows `••••6789`
- Click "Show" → Full number appears
- Click "Hide" → Masked again
- Click "Copy" → Number copied to clipboard
- Close drawer, reopen → Number is masked again

### 4. Account Number Masking - Approvals
- Open REDEEM change request with accountNumber
- Verify account number shows `••••6789`
- Click "Show" → Full number appears
- Click "Copy" → Number copied to clipboard

### 5. Date Validation - Fulfil Cash
- Open winner with REDEEMED status (redeemedAt: 2024-11-15)
- Click "Record payout"
- Try future date → Inline error: "Date cannot be in the future"
- Try date before redeem date → Error: "Date cannot be earlier than the redeem date (2024-11-15)"
- Select valid date (between redeem date and today) → No error
- Try to submit with invalid date → Blocked

### 6. Date Validation - Fulfil Item
- Same test as Fulfil Cash

### 7. Real Data Test (DISBURSED Winner)
- Find winner with:
  - status: DISBURSED
  - prizeType: CASH
  - redemption fully filled
  - 2 proofs attached
- Open winner detail drawer
- **Verify:**
  - Status badge shows "Disbursed" (green)
  - Both proofs have correct labels
  - Click "View" on each proof → Opens successfully
  - Click "Download" → Downloads file
  - Account number masked with Show/Copy controls
  - Steps History shows "Disbursed on {date}" with green badge
- **Screenshots:** 1440px and 390px width

---

## Build Status

✅ **Build successful** - Exit Code 0  
✅ **TypeScript clean**  
✅ **All validations working**

---

## Security Notes

1. **Account numbers never logged**
   - Not in console.log()
   - Not in error messages
   - Not in analytics

2. **Full number only in detail views**
   - Lists/tables show masked from backend
   - CSV exports show what backend sends
   - Detail drawers require user interaction to reveal

3. **Client-side date validation**
   - Backend doesn't validate yet
   - Client prevents obvious errors
   - Uses Africa/Lagos timezone consistently
