# Visual Draw Flow Diagram

## 🎯 Complete Draw Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     DRAW LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   CREATION   │  Admin creates draw with:
│   (Admin)    │  • Prize type (CASH/ITEM)
│              │  • Tiers (optional)
│  PENDING     │  • Subscription filter
└──────┬───────┘  • Dates (start, end, draw)
       │
       │ Goes to Change Requests
       ↓
┌──────────────┐
│   APPROVAL   │  Checker reviews:
│  (Checker)   │  • All details
│              │  • Prize config
│              │  • Dates logic
└──────┬───────┘
       │
       ├─→ REJECTED → Back to pending (maker sees reason)
       │
       ↓ APPROVED
┌──────────────┐
│   SCHEDULED  │  Draw is approved
│   or ACTIVE  │  Waiting for start date
│              │
└──────┬───────┘
       │
       │ Start date arrives
       ↓
┌──────────────┐
│    ACTIVE    │  Users can enter:
│  (User Side) │  • Entry button visible
│              │  • Subscription filter checks
│  Entry       │  • One entry per subscription
│  Period      │
└──────┬───────┘
       │
       │ End date arrives
       ↓
┌──────────────┐
│  DRAW DATE   │  Automatic selection:
│ (Backend)    │  • Random selection
│              │  • Tier distribution
│  Winners     │  • Notifications sent
│  Selected    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   SELECTED   │  Winners appear in:
│  (Winners)   │  • Winners page
│              │  • Status: SELECTED
│  Awaiting    │  • View button active
│  Redemption  │
└──────┬───────┘
       │
       │ Admin clicks Redeem
       ↓
┌──────────────┐
│  REDEMPTION  │  Two paths:
│   (Admin +   │
│   Checker)   │  ┌─────────────┬─────────────┐
│              │  │   CASH      │    ITEM     │
│  Files       │  ├─────────────┼─────────────┤
│  Uploaded    │  │ Bank details│   Address   │
│              │  │ Account proof│  Agreement  │
└──────┬───────┘  └─────────────┴─────────────┘
       │
       │ Maker submits → Checker approves
       ↓
┌──────────────┐
│   REDEEMED   │  Prize info collected
│              │  Bank verified (CASH)
│  Awaiting    │  Address confirmed (ITEM)
│  Fulfillment │
└──────┬───────┘
       │
       │ Admin clicks Fulfil
       ↓
┌──────────────┐
│ FULFILLMENT  │  Two paths:
│   (Admin +   │
│   Checker)   │  ┌─────────────┬─────────────┐
│              │  │   CASH      │    ITEM     │
│  Proof       │  ├─────────────┼─────────────┤
│  Required    │  │Transfer receipt│  Photo   │
│              │  │ Payout ref  │  Delivery   │
└──────┬───────┘  └─────────────┴─────────────┘
       │
       │ Maker submits → Checker approves
       ↓
┌──────────────┐
│  DISBURSED   │  ✅ COMPLETE!
│    (Final)   │  • Payment sent (CASH)
│              │  • Item delivered (ITEM)
│   Journey    │  • Proofs stored
│   Complete   │  • Winner satisfied
└──────────────┘
```

---

## 🎭 Role Interactions

```
┌────────────────────────────────────────────────────────────┐
│                    WHO DOES WHAT                            │
└────────────────────────────────────────────────────────────┘

ADMIN (Maker)                    CHECKER (Auth)
─────────────                    ──────────────

1️⃣ Create Draw                   Review Details
   ↓                             ↓
   Propose                       Approve/Reject
   ↓                             ↓
   ┌─────────────────────────────┐
   │   DRAW IS NOW ACTIVE        │
   └─────────────────────────────┘

                   USER
                   ────
                   View in Store
                   ↓
                   Click "Enter Draw"
                   ↓
                   Entry Recorded

   ┌─────────────────────────────┐
   │  BACKEND AUTO-SELECTS       │
   │       WINNERS               │
   └─────────────────────────────┘

2️⃣ View Winner                   (Monitor)
   ↓
   Click "Redeem"
   ↓
   Fill Form + Upload
   ↓                             Review Redemption
   Propose                       ↓
   ↓                             Approve/Reject
   ┌─────────────────────────────┐
   │   STATUS: REDEEMED          │
   └─────────────────────────────┘

3️⃣ Click "Fulfil"                (Monitor)
   ↓
   Fill Form + Upload
   ↓                             Review Fulfillment
   Propose                       ↓
   ↓                             Approve/Reject
   ┌─────────────────────────────┐
   │   STATUS: DISBURSED ✅      │
   └─────────────────────────────┘

4️⃣ Download Reports              Access Reports
   • Winners CSV                 • View Audit Log
   • Redemptions Report          • Review Actions
   • Print for records           • Monitor System
```

---

## 📋 Status Badge Colors

```
┌─────────────────────────────────────────────────┐
│              WINNER STATUSES                     │
└─────────────────────────────────────────────────┘

🔵 SELECTED          Winner chosen, awaiting redemption
   (Blue)            Action: Admin must redeem

🟡 REDEEMED          Redemption approved, awaiting fulfillment
   (Amber/Yellow)    Action: Admin must fulfil

🟢 DISBURSED         Fully completed (payment/delivery done)
   (Green)           Action: None (complete) ✅

⚠️  REDEEM pending   Redemption submitted, awaiting approval
   (Yellow badge)    Action: Checker must approve

⚠️  FULFIL pending   Fulfillment submitted, awaiting approval
   (Yellow badge)    Action: Checker must approve
```

---

## 🗂️ File Upload Requirements

```
┌────────────────────────────────────────────────────────┐
│                  PROOF FILES                            │
└────────────────────────────────────────────────────────┘

REDEMPTION PHASE
────────────────

CASH Prize:
  Required:
    ✅ Account Enquiry (screenshot of bank verification)
       • Shows account name matches winner
       • Proves account is valid and active

ITEM Prize:
  Optional:
    ⭕ Collection Agreement (signed consent form)
       • Winner acknowledges prize details
       • Signature/consent captured


FULFILLMENT PHASE
─────────────────

CASH Prize:
  Required:
    ✅ Transfer Receipt (bank confirmation)
       • Shows amount, date, recipient
       • Bank reference number visible
       • Proves payment was sent

ITEM Prize:
  Required:
    ✅ Collection Photo (delivery evidence)
       • Winner holding/receiving prize
       • Clear photo showing item and person
       • Proves successful delivery


File Formats: JPG, PNG, PDF
Max Size: 5MB per file
```

---

## 🔄 Change Request Flow

```
┌────────────────────────────────────────────────┐
│          MAKER-CHECKER PATTERN                  │
└────────────────────────────────────────────────┘

Every financial action follows this pattern:

Step 1: MAKER PROPOSES
        ↓
   ┌─────────────────┐
   │ Change Request  │  Created automatically
   │    Created      │  Status: PENDING
   └────────┬────────┘
            ↓
Step 2: CHECKER REVIEWS
        ↓
   ┌─────────────────────┐
   │   Two Options:      │
   │                     │
   │  1. APPROVE         │ → Action executed
   │     (with note)     │   Status updated
   │                     │   Timestamp recorded
   │  2. REJECT          │ → Action cancelled
   │     (with reason)   │   Maker sees rejection
   └─────────────────────┘

All changes tracked in:
• Change Requests page (for checker)
• Audit Log (permanent record)
```

---

## 📥 Download Options Visual

```
┌────────────────────────────────────────────────────┐
│              WINNERS PAGE                           │
│                                                     │
│  Winners                    [↓ Download]           │
│  ────────                    ├─ 🖨️  Print Report   │
│                              ├─ 📄 Download CSV    │
│  [Filters...]                └─ 📦 Download JSON   │
│                                                     │
│  [Table with winners...]                           │
│                                                     │
└────────────────────────────────────────────────────┘

What Gets Downloaded:
✅ All filtered data (not just current page)
✅ Up to 10,000 rows
✅ All columns with proper formatting
✅ Dates in Africa/Lagos timezone
✅ CSV opens in Excel/Sheets
✅ JSON for integrations
✅ Print view for physical records
```

---

## 🎯 Quick Navigation Guide

```
┌────────────────────────────────────────────────────┐
│           WHERE TO FIND EVERYTHING                  │
└────────────────────────────────────────────────────┘

CREATE DRAW
→ Admin → Rewards → "+ New Draw" button

APPROVE DRAW
→ Admin → Change Requests → Find draw creation request

VIEW ACTIVE DRAWS (User)
→ User Dashboard → Store page → Active Draws section

SEE WINNERS
→ Admin → Winners tab → Winners list

VIEW WINNER DETAILS
→ Admin → Winners → Click "View" on any winner

REDEEM PRIZE
→ Winners → View winner → "Redeem (CASH/ITEM)" button

FULFIL PRIZE
→ Winners → View winner → "Fulfil (CASH/ITEM)" button

APPROVE REDEMPTION/FULFILLMENT
→ Admin → Change Requests → Find pending request

VIEW REDEMPTIONS REPORT
→ Admin → Winners → "Redemptions" tab

DOWNLOAD REPORTS
→ Winners or Redemptions tab → "Download" button (top-right)

CHECK AUDIT TRAIL
→ Admin → Audit Log → Filter by resource type "RAFFLE"
```

---

## 📊 Data Flow Summary

```
Draw Created
    ↓
Change Request (CREATE_RAFFLE)
    ↓
Approved → Draw Active
    ↓
Users Enter
    ↓
Backend Selects Winners
    ↓
Winners List (STATUS: SELECTED)
    ↓
Admin Redeems → Change Request (REDEEM_*)
    ↓
Approved → STATUS: REDEEMED
    ↓
Admin Fulfils → Change Request (FULFIL_*)
    ↓
Approved → STATUS: DISBURSED ✅
    ↓
Download Reports for Records
```

---

## 💡 Remember

1. **Every financial action needs approval** (maker-checker)
2. **All file uploads are tracked** (who, when, what)
3. **Downloads respect filters** (apply filters first)
4. **Status badges show current state** (SELECTED → REDEEMED → DISBURSED)
5. **Winner detail shows everything** (7 sections of info)
6. **Proof viewing is 404** (backend issue, uploads still work)

---

**This visual guide complements the detailed guide in DRAW_FLOW_COMPLETE_GUIDE.md**
