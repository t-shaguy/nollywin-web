# Complete Draw Flow Guide

## Overview
This document explains the **complete lifecycle** of a draw (raffle) in NollyWin, from creation to winner fulfillment, including all maker-checker approvals.

---

## 🎯 Draw Lifecycle Stages

```
CREATE → APPROVE → ACTIVE → PLAY → DRAW → WINNERS → REDEEM → FULFIL → COMPLETE
```

---

## 1️⃣ DRAW CREATION

### Who Can Create
- **Admin (Maker)** only

### Location
- **Admin → Rewards** page

### What You Configure

#### Basic Details
- **Prize Name**: What the winner gets (e.g., "iPhone 15 Pro Max", "₦50,000 Cash")
- **Draw Code**: Auto-generated unique code (e.g., `NW-202609-0001`)
- **Schedule**: Daily, Weekly, Monthly, or Custom
- **Start Date**: When users can start entering
- **End Date**: When entries close
- **Draw Date**: When winners are selected

#### Prize Configuration (V39 - NEW)
- **Prize Type**: CASH or ITEM
  - **CASH**: Must specify amount (e.g., ₦50,000)
  - **ITEM**: Physical prize (e.g., iPhone, TV)
- **Tiers**: Optional multi-tier prizes
  - Add multiple tiers (1st place, 2nd place, etc.)
  - Each tier has: name, position, description
  - Specify winners per tier

#### Entry Rules
- **Max Winners**: Total number of winners to select
- **Subscription Filter** (V39 - NEW):
  - **All Plans**: Any subscriber can enter
  - **Daily Only**: Only Daily subscribers
  - **Weekly Only**: Only Weekly subscribers
  - **Monthly Only**: Only Monthly subscribers
  - **Weekly or Monthly**: Weekly + Monthly only

### After Creation
- Draw status: **PENDING**
- Goes to **Change Requests** for approval
- **Change Request Type**: `CREATE_RAFFLE`

---

## 2️⃣ DRAW APPROVAL

### Who Reviews
- **Auth (Checker)** role

### Location
- **Admin → Change Requests** page

### Checker Actions

#### Review Information
- Check all draw details
- Verify prize configuration
- Confirm dates are logical (start < end < draw date)
- Ensure tier configuration is correct
- Verify subscription filters match business rules

#### Approve
- Click **Approve** button
- Optionally add approval note
- Draw status becomes: **SCHEDULED** or **ACTIVE** (depending on start date)

#### Reject
- Click **Reject** button
- **Must provide rejection reason** (required field)
- Draw remains in **PENDING** state
- Maker can view rejection reason and create new draw

---

## 3️⃣ ACTIVE DRAW PERIOD

### Status: ACTIVE

### When Active
- Current date/time is between **Start Date** and **End Date**
- Users can enter the draw

### User Side (Store Page)
- Active draws appear in "Active Draws" section
- Users click **"Enter Draw"** button
- Entry is recorded with:
  - User's subscription package (Daily/Weekly/Monthly)
  - User's current subscription status (ACTIVE/EXPIRED)
  - Timestamp of entry

### Subscription Filters Apply
- System validates user's subscription matches draw requirements
- If user doesn't have required subscription:
  - Entry button is disabled
  - Message shows: "Requires [package] subscription"

### Multiple Entries
- Users can enter **once per active subscription**
- If subscription renews, they can enter again

---

## 4️⃣ DRAW EXECUTION

### Status: COMPLETED

### When Draw Happens
- **Draw Date** arrives (usually midnight server time)
- Backend runs automated winner selection

### Selection Algorithm
1. Fetch all valid entries for the draw
2. Apply subscription filter (if set)
3. Check subscription was ACTIVE when they entered
4. Randomly select winners up to **Max Winners**
5. If tiers configured:
   - Select winners for Tier 1 (e.g., 1 winner)
   - Select winners for Tier 2 (e.g., 3 winners)
   - Continue for all tiers

### Result
- Winners are marked: **SELECTED**
- Draw status: **COMPLETED**
- Winner notifications sent (if configured)

---

## 5️⃣ WINNERS MANAGEMENT

### Location
- **Admin → Winners** page

### Winners Table Shows
- Winner name, email, phone
- Draw details (name, code, date)
- Prize info (name, tier, subscription)
- Prize type & amount
- Status badges
- Selected timestamp

### Winner Statuses
- **SELECTED**: Winner chosen, awaiting redemption
- **REDEEMED**: Redemption approved, awaiting fulfillment
- **DISBURSED**: Fully completed (cash sent or item delivered)

---

## 6️⃣ REDEMPTION PROCESS (Step 1)

### Status: SELECTED → REDEEMED

### Who Initiates
- **Admin (Maker)** only

### Two Redemption Types

#### 6A. CASH Redemption

**Location**: Winners page → View winner → Redeem (CASH)

**Maker Fills Form**:
- **Bank Name**: Winner's bank (select from list)
- **Account Number**: 10-digit account number
- **Account Name**: Beneficiary name (auto-verified via backend)
- **Redeem Note**: Optional internal note

**Files to Upload**:
- **Account Enquiry Proof** (REQUIRED):
  - Screenshot of bank account verification
  - Shows account name matches winner
  - Proves account is valid

**After Submission**:
- Status: Still **SELECTED** 
- **REDEEM pending** badge appears
- Change request created
- Goes to Checker for approval

#### 6B. ITEM Redemption

**Location**: Winners page → View winner → Redeem (ITEM)

**Maker Fills Form**:
- **Contact Phone**: Winner's phone for delivery
- **Delivery Address**: Full address with landmarks
- **Redeem Note**: Optional internal note

**Files to Upload**:
- **Collection Agreement** (OPTIONAL):
  - Signed agreement from winner
  - Confirms prize details
  - Winner's signature/consent

**After Submission**:
- Status: Still **SELECTED**
- **REDEEM pending** badge appears
- Change request created
- Goes to Checker for approval

### Redemption Approval (Checker)

**Location**: Change Requests page

**Checker Reviews**:
- Winner details match draw
- Bank details are correct (CASH) or address is complete (ITEM)
- Uploaded proofs are valid
- No fraud indicators

**Approve**:
- Click **Approve**
- Optional approval note
- Status changes to: **REDEEMED**
- Timestamp recorded: `redeemedAt`
- Now ready for fulfillment

**Reject**:
- Click **Reject**
- Provide rejection reason
- Stays in **SELECTED** status
- Maker can submit new redemption with corrections

---

## 7️⃣ FULFILLMENT PROCESS (Step 2)

### Status: REDEEMED → DISBURSED

### Who Initiates
- **Admin (Maker)** only

### Two Fulfillment Types

#### 7A. CASH Fulfillment

**Location**: Winners page → View winner → Fulfil (CASH)

**Maker Fills Form**:
- **Fulfilled On**: Date payment was made (date picker)
- **Payout Reference**: Bank transfer reference number
- **Fulfil Note**: Optional internal note

**Files to Upload**:
- **Transfer Receipt** (REQUIRED):
  - Bank transfer confirmation
  - Shows amount, date, recipient
  - Proves payment was sent

**After Submission**:
- Status: Still **REDEEMED**
- **FULFIL pending** badge appears
- Change request created
- Goes to Checker for approval

#### 7B. ITEM Fulfillment

**Location**: Winners page → View winner → Fulfil (ITEM)

**Maker Fills Form**:
- **Fulfilled On**: Date item was delivered
- **Fulfil Note**: Optional delivery notes

**Files to Upload**:
- **Collection Photo** (REQUIRED):
  - Photo of winner receiving item
  - Shows winner with prize
  - Proof of successful delivery

**After Submission**:
- Status: Still **REDEEMED**
- **FULFIL pending** badge appears
- Change request created
- Goes to Checker for approval

### Fulfillment Approval (Checker)

**Location**: Change Requests page

**Checker Reviews**:
- Payment reference is valid (CASH) or photo shows delivery (ITEM)
- Uploaded proofs are legitimate
- Dates are logical
- No discrepancies

**Approve**:
- Click **Approve**
- Optional approval note
- Status changes to: **DISBURSED** ✅
- Timestamp recorded: `fulfilledAt`
- **Winner journey COMPLETE**

**Reject**:
- Click **Reject**
- Provide rejection reason
- Stays in **REDEEMED** status
- Maker can submit new fulfillment with corrections

---

## 8️⃣ WINNER DETAIL VIEW

### Location
- Winners page → Click **View** on any winner

### Drawer Shows

#### 1. Winner Information
- Name, email, phone
- Subscription package + status

#### 2. Draw Details
- Draw name, code, date
- Start/end dates

#### 3. Prize Information
- Prize name, type (CASH/ITEM)
- Tier (if multi-tier draw)
- Cash amount (if CASH prize)

#### 4. Status Card
- Current status badge
- Pending action badge (if awaiting approval)
- **Action button** (if action required):
  - "Redeem (CASH)" or "Redeem (ITEM)"
  - "Fulfil (CASH)" or "Fulfil (ITEM)"

#### 5. Redemption Details (if redeemed)
- **CASH**: Bank name, account number (masked), account name, payout reference
- **ITEM**: Contact phone, delivery address

#### 6. Steps History
- **Selected**: Date/time winner was chosen
- **Redeemed**: Date/time, approved by, proposed by
- **Fulfilled**: Date/time, fulfilled on, approved by, proposed by

#### 7. Proofs (if uploaded)
- Lists all uploaded files:
  - Account Enquiry
  - Collection Agreement
  - Transfer Receipt
  - Collection Photo
- Shows: filename, size, uploaded by, date
- **View** button to open proof (currently 404 - backend issue)

---

## 9️⃣ REDEMPTIONS TAB

### Location
- **Winners page → Redemptions tab**

### Shows
- Only winners with **REDEEMED** or **DISBURSED** status
- Summary stats:
  - **Total Cash Disbursed**: Sum of all cash prizes paid
  - **Cash Redemptions**: Count of CASH prizes
  - **Item Redemptions**: Count of ITEM prizes

### Table Columns
- Winner name, email, phone
- Draw details
- Prize name, type
- Cash amount (if CASH)
- Status (REDEEMED or DISBURSED)
- Redeemed date, fulfilled date

### Use Case
- Track all prize redemptions in one place
- Monitor cash disbursements
- Generate redemption reports

---

## 🔟 DOWNLOADS & REPORTS

### Download Button
- Located: Top-right of Winners/Redemptions tabs
- Only appears when data exists

### Download Options

#### 1. Print Report
- Opens print-friendly view
- Shows applied filters
- Formatted table ready for printing
- Click browser Print button (Ctrl+P)

#### 2. Download CSV
- Exports all filtered data to CSV file
- Includes all columns
- Date formatted for Africa/Lagos timezone
- Opens in Excel/Google Sheets

#### 3. Download JSON
- Raw data export
- Machine-readable format
- Useful for integrations

### What Gets Downloaded
- **Current filters applied**
- **All pages** (not just current page)
- **Maximum 10,000 rows**

### Available Reports
- ✅ **Winners Report**: All winner records
- ✅ **Redemptions Report**: All redemption records
- ✅ Audit Log
- ✅ Change Requests
- ✅ Users
- ✅ Draws
- ✅ Notifications

---

## 🎯 KEY CONCEPTS

### Maker-Checker System
- **Every financial action requires approval**
- Maker (admin) proposes
- Checker (auth) approves or rejects
- Prevents fraud and errors
- Full audit trail

### Status Progression
```
Draw:    PENDING → SCHEDULED → ACTIVE → COMPLETED
Winner:  SELECTED → REDEEMED → DISBURSED
```

### Prize Types (V39)
- **CASH**: Monetary prize (requires bank details)
- **ITEM**: Physical prize (requires delivery address)

### Tiers (V39)
- Optional multi-tier draws
- Different prizes for different ranks
- Example: 1st place (iPhone), 2nd place (AirPods), 3rd place (Power Bank)

### Subscription Filters (V39)
- Control which subscribers can enter
- Ensures prize value matches subscription tier
- Example: Monthly subscribers only for high-value prizes

### Proof Types
- **ACCOUNT_ENQUIRY**: Bank verification for CASH
- **COLLECTION_AGREEMENT**: Winner consent for ITEM
- **TRANSFER_RECEIPT**: Payment proof for CASH
- **COLLECTION_PHOTO**: Delivery proof for ITEM

---

## 📋 TESTING CHECKLIST

### Create & Approve Draw
- [ ] Admin creates new draw with prize type and tiers
- [ ] Subscription filter is set correctly
- [ ] Change request appears in Checker's list
- [ ] Checker can approve/reject with notes
- [ ] Approved draw becomes ACTIVE on start date

### User Entry
- [ ] Users see active draws in their store page
- [ ] Entry button respects subscription filter
- [ ] Entry is recorded with subscription details
- [ ] User can't enter twice with same subscription

### Winner Selection
- [ ] Winners selected automatically on draw date
- [ ] Tier distribution is correct
- [ ] Winners appear in Winners page
- [ ] Status is SELECTED

### Redemption
- [ ] Maker can redeem CASH with bank details + proof
- [ ] Maker can redeem ITEM with address + proof
- [ ] File upload works
- [ ] Change request created
- [ ] Checker can approve/reject
- [ ] Status changes to REDEEMED after approval

### Fulfillment
- [ ] Maker can fulfil CASH with transfer proof
- [ ] Maker can fulfil ITEM with delivery photo
- [ ] File upload works
- [ ] Change request created
- [ ] Checker can approve/reject
- [ ] Status changes to DISBURSED after approval

### Winner Detail View
- [ ] All 7 sections display correctly
- [ ] Action buttons appear when needed
- [ ] Proofs list shows uploaded files
- [ ] Status badges show current state

### Downloads
- [ ] Download button appears with data
- [ ] CSV export works
- [ ] JSON export works
- [ ] Print view is formatted
- [ ] All filters apply to download

---

## 🚨 KNOWN ISSUES

### Proof Viewing 404
- **Issue**: Clicking "View" on uploaded proof returns 404
- **Cause**: Backend endpoint `/api/v1/admin/rewards/winners/{winnerId}/proofs/{proofId}` not implemented
- **Status**: Backend team needs to implement file serving endpoint
- **Workaround**: Files are uploaded successfully, just can't view them in admin panel yet

### Proof Download
- **Status**: Not implemented yet
- **Needed**: Backend endpoint for downloading proof files

---

## 💡 TIPS

### For Admins (Makers)
- Always upload clear, readable proofs
- Double-check bank details before submitting
- Use redeem/fulfil notes for internal tracking
- Review winner details before taking action

### For Checkers (Auth)
- Verify all uploaded proofs are legitimate
- Check bank account names match winner names
- Look for inconsistencies in dates/amounts
- Provide clear rejection reasons

### For Testing
- Create test draws with short date ranges
- Use small winner counts for easy verification
- Test both CASH and ITEM prize flows
- Try all subscription filter combinations
- Verify downloads work with filters applied

---

## 📞 SUPPORT

If you encounter issues:
1. Check console for error messages
2. Verify your role permissions (admin vs auth)
3. Confirm dates are in correct format
4. Review this guide for correct flow
5. Contact backend team for API issues

---

**Last Updated**: Current session (V39 Complete)
**Version**: V39 with Prize Types, Tiers, Subscription Filters
