# V39 Quick Reference Guide

## 🚀 What Was Built

### Part A: Foundation
1. **Prize Types** - CASH/ITEM selection on draws with amount
2. **Subscription Filters** - Date range, search, package, status filters
3. **Approvals Enhanced** - Resource type filter, humanized names, file viewer

### Part B: Winners Management
1. **Winners Page** - List + Redemptions tabs with filters
2. **Detail Drawer** - Full winner info with proofs viewer
3. **Redeem Forms** - CASH (bank details) + ITEM (delivery)
4. **Fulfil Forms** - CASH (payout) + ITEM (handover)
5. **File Upload** - Drag-drop with previews (max 5 files, 10MB each)

## 📁 Files Created (3)

```
lib/api/admin-winners.ts              (463 lines)
app/admin/winners/page.tsx            (847 lines)
components/admin/winner-detail-drawer.tsx    (657 lines)
components/admin/winner-action-modals.tsx    (1,074 lines)
```

## 📝 Files Modified (5)

```
lib/api/admin.ts                      (+Prize types, +Filters)
app/admin/rewards/page.tsx            (+Prize type UI)
lib/utils/change-request-summary.ts   (+REDEEM/FULFIL)
app/admin/change-requests/page.tsx    (Null handling)
components/layout/admin-sidebar.tsx   (+Winners nav)
lib/export/report-config.ts           (+Winners/Redemptions)
```

## 🎨 Key UI Components

### Winners Page
```
/admin/winners
├─ Winners Tab
│  ├─ Filters (6): Draw ID, Status, Prize Type, Search, From, To
│  ├─ Table: 10 columns, 50 rows/page
│  └─ View button → Detail Drawer
└─ Redemptions Tab
   ├─ Summary tiles (3): Total ₦, Cash count, Item count
   ├─ Filters (6): Draw ID, Type, Status, Search, From, To
   └─ Table: 8 columns, 50 rows/page
```

### Winner Detail Drawer
```
Sections:
├─ Winner (name, email, phone, plan)
├─ Draw (name, code, dates, period)
├─ Prize (name, tier, type, amount, rank, points)
├─ Status (badge + pending action + next step button)
├─ Redemption Details (bank or delivery info)
├─ Steps History (Selected → Redeemed → Fulfilled)
└─ Proofs (list with view buttons → viewer modal)
```

### Action Modals (4)
```
1. Redeem CASH
   ├─ Account number, bank code, bank name, account name
   ├─ Proofs: Account Enquiry, ID Verification, Other
   └─ Optional note

2. Redeem ITEM
   ├─ Delivery address, contact phone
   ├─ Proofs: Collection Photo, ID Verification, Other
   └─ Optional note

3. Fulfil CASH
   ├─ Payout reference, fulfilled on date
   ├─ Proofs: Transfer Receipt, Payment Confirmation, Other
   └─ Optional note

4. Fulfil ITEM
   ├─ Fulfilled on date
   ├─ Proofs: Collection Photo, Handover Photo, Delivery Proof, Other
   └─ Optional note
```

## 🔐 Permissions

| Role | Can View | Can Redeem/Fulfil | Can Approve |
|------|----------|-------------------|-------------|
| ADMIN (Maker) | ✅ | ✅ | ❌ |
| AUTH (Checker) | ❌ | ❌ | ✅ |

## 🎯 API Endpoints

```typescript
// Winners
GET    /api/v1/admin/rewards/winners?filters
GET    /api/v1/admin/rewards/winners/{id}
POST   /api/v1/admin/rewards/winners/{id}/redeem   (multipart)
POST   /api/v1/admin/rewards/winners/{id}/fulfil   (multipart)
GET    /api/v1/admin/rewards/winners/{winnerId}/proofs/{proofId}

// Redemptions Report
GET    /api/v1/admin/rewards/redemptions?filters
```

## 📊 Key Types

```typescript
// Winner status flow
"SELECTED" → "REDEEMED" → "DISBURSED"

// Prize types
"CASH" | "ITEM"

// Actions requiring approval
"REDEEM_CASH" | "REDEEM_ITEM" | "FULFIL_CASH" | "FULFIL_ITEM"

// Proof kinds
CASH:
  - ACCOUNT_ENQUIRY (redeem)
  - TRANSFER_RECEIPT (fulfil)
  - PAYMENT_CONFIRMATION (fulfil)

ITEM:
  - COLLECTION_PHOTO (redeem/fulfil)
  - ID_VERIFICATION (redeem)
  - HANDOVER_PHOTO (fulfil)
  - DELIVERY_PROOF (fulfil)
```

## 🎨 Design Tokens

```css
/* Status colors */
SELECTED:  #3b82f6 (blue)
REDEEMED:  #f59e0b (amber)
DISBURSED: #22c55e (green)

/* Prize type colors */
CASH: #22c55e (green)
ITEM: #3b82f6 (blue)

/* Touch targets */
Minimum: 44px × 44px

/* Responsive breakpoints */
Mobile:  320px - 767px
Tablet:  768px - 1023px
Desktop: 1024px+
Max:     1440px
```

## 🧪 Test Winner IDs (Dev Backend)

```
fa9353a8-b0d1-417d-b5c8-89ee406a4016  (DISBURSED with proof)
ad8b2d02-e5fd-4c8f-b46c-a4158277735c  (Check status)
fc18fe80-d4f3-4305-84fc-45e96e2bc80a  (SELECTED)
```

## ✅ Validation Rules

### Files
- Max size: 10MB per file
- Max count: 5 files per submission
- Types: image/*, application/pdf

### Forms
- Required fields marked with red asterisk (*)
- Bank code: 3 digits
- Account number: 10 digits
- Date pickers: max = today
- Notes: Optional, 3 rows

### Error Messages
- 409: "Already has a [ACTION] waiting for approval"
- 403: "You don't have permission to do this."
- Generic: "Failed to submit [action] request"

## 📱 Responsive Behavior

| Component | Mobile (<768px) | Desktop (≥1024px) |
|-----------|-----------------|-------------------|
| Winners Table | Horizontal scroll | Full width |
| Detail Drawer | Full screen | 600px side drawer |
| Modals | Bottom sheet (90vh) | Centered (28rem) |
| Forms | Single column | 2-3 column grid |

## 🚦 Workflow Example

```
1. Admin logs in → sees Winners in sidebar
2. Clicks Winners → sees list of SELECTED winners
3. Clicks "View" on winner → detail drawer opens
4. Sees "Redeem (CASH)" button → clicks
5. Fills bank details + uploads account enquiry screenshot
6. Submits → creates change request (202 response)
7. Checker approves → winner status = REDEEMED
8. Admin views winner again → sees "Fulfil (CASH)" button
9. Fills payout reference + uploads transfer receipt
10. Submits → creates change request
11. Checker approves → winner status = DISBURSED
12. Admin views winner → sees complete history + all proofs
```

## 🐛 Known Issues & Workarounds

| Issue | Workaround |
|-------|------------|
| Safari <16 drag-drop | Use click to browse |
| PDF no preview | Click download button |
| Max 5 files | Combine into PDF if more needed |
| Export limit 10k rows | Use date filters to narrow |

## 📦 Build Info

```bash
# Build command
npm run build

# Output
✓ Compiled successfully
✓ TypeScript: 0 errors
✓ All routes generated

# Test locally
npm run dev
# Navigate to: http://localhost:3000/admin/winners
```

## 🔧 Environment Setup

```env
# Required
NEXT_PUBLIC_CORE_API_BASE_URL=https://api.nollywin.com

# Dev
NEXT_PUBLIC_CORE_API_BASE_URL=http://localhost:8080
```

## 📚 Related Documentation

- Full Report: `V39_COMPLETION_REPORT.md`
- API Types: `lib/api/admin-winners.ts` (JSDoc comments)
- Components: Inline JSDoc in each file

## 🎯 Next Steps

1. **QA Testing**: Test with dev backend winner IDs
2. **Staging Deploy**: Verify on staging environment
3. **Production Deploy**: After QA sign-off
4. **Monitor**: Check error logs for first week

## 💡 Tips for Developers

- **Finding code**: Search for "admin-winners" or "WinnerDetail"
- **Adding proof kind**: Update proofKinds arrays in modals
- **Changing validation**: Update form submit handlers
- **Modifying columns**: Edit table thead/tbody in winners page
- **Styling tweaks**: All use Tailwind classes (no CSS files)

---

**Quick Questions?**

**Q: How to add a new proof kind?**  
A: Add to `proofKinds` array in relevant modal component

**Q: How to change file size limit?**  
A: Update validation in FileUpload component (line ~89)

**Q: How to add a new filter?**  
A: Add state + input + API param in winners page

**Q: How to test without backend?**  
A: Can't test API calls, but UI renders with mock data

**Q: Where are types defined?**  
A: `lib/api/admin-winners.ts` (verified from backend)

---

*Last updated: December 2024*
