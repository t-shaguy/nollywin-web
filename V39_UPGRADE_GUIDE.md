# V39 Upgrade Guide

## 🔄 Upgrading to v39

This guide helps developers and admins understand what changed in v39 and how to use the new features.

---

## 📦 What's New in v39

### For Developers

#### New Dependencies
No new npm packages required. All features use existing dependencies.

#### New API Endpoints
```typescript
// Winners Management
GET    /api/v1/admin/rewards/winners
GET    /api/v1/admin/rewards/winners/{id}
POST   /api/v1/admin/rewards/winners/{id}/redeem
POST   /api/v1/admin/rewards/winners/{id}/fulfil
GET    /api/v1/admin/rewards/winners/{winnerId}/proofs/{proofId}
GET    /api/v1/admin/rewards/redemptions

// Updated Endpoints
GET    /api/v1/admin/reports/subscriptions (now accepts filters)
GET    /api/v1/admin/change-requests (now accepts resourceType param)
GET    /api/v1/admin/change-requests/{id}/file (new)
```

#### New Types
```typescript
// In lib/api/admin.ts
interface CreateDrawRequest {
  prizeType?: "CASH" | "ITEM";  // NEW
  cashAmount?: number;           // NEW
  // ... existing fields
}

// New file: lib/api/admin-winners.ts
interface WinnerRow { /* ... */ }
interface WinnerDetail { /* ... */ }
interface Redemption { /* ... */ }
interface Proof { /* ... */ }
interface RedemptionRow { /* ... */ }
```

### For Admins

#### New Features Available
1. **Prize Types on Draws**
   - Select CASH or ITEM when creating draws
   - Enter cash amount for CASH prizes
   - Shows in draw listings with colored badges

2. **Enhanced Subscription Reports**
   - Filter by date range (Lagos timezone)
   - Search by email or phone
   - Filter by package
   - Filter by status (ACTIVE, EXPIRED, PENDING_PAYMENT)

3. **Winners Management** (NEW)
   - View all draw winners in one place
   - Track redemption status
   - Submit redemption requests
   - Upload proof documents
   - View full winner history

---

## 🚀 Getting Started with Winners Management

### For Admins (ADMIN Role)

#### Accessing Winners
1. Log in to admin panel
2. Look for "Winners" in the sidebar (Award icon)
3. Click to view winners list

#### Viewing Winner Details
1. Find winner in list
2. Click "View" button
3. Detail drawer opens from right (desktop) or full-screen (mobile)
4. Review all sections: Winner info, Draw info, Prize, Status, History, Proofs

#### Redeeming a Winner (Collecting Winner Information)

**For CASH Prizes:**
1. Open winner detail
2. Click "Redeem (CASH)" button
3. Fill in bank details:
   - Account number (10 digits)
   - Bank code (3 digits, e.g., 058 for GTBank)
   - Bank name (optional)
   - Account name (required)
4. Upload proof:
   - Drag-drop or click to browse
   - Upload account enquiry screenshot or ID
   - Select proof kind from dropdown
5. Add optional note
6. Click "Submit for Approval"
7. Wait for checker approval

**For ITEM Prizes:**
1. Open winner detail
2. Click "Redeem (ITEM)" button
3. Fill in delivery details:
   - Delivery address (full address)
   - Contact phone number
4. Upload proof:
   - Collection photo
   - ID verification
5. Add optional note
6. Submit

#### Fulfilling a Winner (Confirming Payout/Handover)

**For CASH Prizes:**
1. Open winner detail (status must be REDEEMED)
2. Click "Fulfil (CASH)" button
3. Fill in payout details:
   - Payout reference (transaction ID)
   - Fulfilled on date (when transfer was made)
4. Upload proof:
   - Transfer receipt (required)
   - Payment confirmation
5. Add optional note
6. Submit

**For ITEM Prizes:**
1. Open winner detail (status must be REDEEMED)
2. Click "Fulfil (ITEM)" button
3. Fill in handover details:
   - Fulfilled on date (when item was given)
4. Upload proof:
   - Collection photo
   - Handover photo
   - Delivery proof
5. Add optional note
6. Submit

### For Checkers (AUTH Role)

#### Approving Redemptions/Fulfilments
1. Go to "Approvals" page
2. Filter by resource type: "Winner"
3. Review the change request:
   - Winner information
   - Action type (REDEEM or FULFIL)
   - Submitted details
   - Uploaded proofs
4. Download and verify proofs
5. Either:
   - Click "Approve" with optional note
   - Click "Reject" with reason

---

## 🔧 Technical Upgrade Steps

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Build Application
```bash
npm run build
```

Should see:
```
✓ Compiled successfully
✓ TypeScript: 0 errors
✓ All routes generated
```

### 4. Update Environment Variables
Ensure `.env.local` has:
```env
NEXT_PUBLIC_CORE_API_BASE_URL=your_api_url
```

### 5. Test Locally
```bash
npm run dev
```

Navigate to:
- `/admin/rewards` - Check prize type field
- `/admin/reports` - Test subscription filters
- `/admin/winners` - Test winners management

---

## 🔍 Troubleshooting

### Build Errors

**Error: Cannot find module 'admin-winners'**
```bash
# Solution: Clean and rebuild
rm -rf .next
npm run build
```

**Error: Type error in admin.ts**
```bash
# Solution: Check you pulled all changes
git status
git pull origin main
```

### Runtime Errors

**Winners page shows 404**
```
Problem: Route not generated
Solution: 
1. Check file exists: app/admin/winners/page.tsx
2. Rebuild: npm run build
3. Restart dev server
```

**File upload fails**
```
Problem: File too large or wrong type
Solution:
1. Check file is <10MB
2. Verify type is image/* or application/pdf
3. Try different file
```

**403 error on submit**
```
Problem: User doesn't have ADMIN role
Solution:
1. Check user's JWT token groups claim
2. Verify "admin" group is present
3. Re-login if needed
```

**409 error on submit**
```
Problem: Change request already pending
Solution:
1. Go to Approvals page
2. Find pending request for this winner
3. Either approve/reject it first
4. Or wait for checker to process
```

---

## 📋 Migration Checklist

### For Development Team

- [ ] Pull latest code from main branch
- [ ] Run `npm install` (no new packages, but verify)
- [ ] Run `npm run build` - should pass with 0 errors
- [ ] Test locally with dev backend
- [ ] Review new types in `lib/api/admin-winners.ts`
- [ ] Update any custom admin scripts that interact with draws
- [ ] Test responsive design on multiple devices
- [ ] Verify file uploads work in your environment

### For QA Team

- [ ] Test prize type selection on draw creation
- [ ] Verify subscription report filters work
- [ ] Test winners list with various filters
- [ ] Test winner detail drawer on desktop and mobile
- [ ] Test file upload (drag-drop and click)
- [ ] Test redeem flow for CASH and ITEM
- [ ] Test fulfil flow for CASH and ITEM
- [ ] Verify proof viewer works for images and PDFs
- [ ] Test with multiple browsers (Chrome, Safari, Firefox)
- [ ] Test error scenarios (large files, wrong types, etc.)
- [ ] Verify role permissions (ADMIN can submit, AUTH can approve)
- [ ] Test complete workflow: redeem → approve → fulfil → approve

### For DevOps Team

- [ ] Update staging environment variables
- [ ] Deploy to staging
- [ ] Verify build artifacts are correct
- [ ] Test staging with real-ish data
- [ ] Check logs for any errors
- [ ] Monitor file upload to S3/storage
- [ ] Verify CORS settings for multipart uploads
- [ ] Update production environment variables
- [ ] Schedule production deployment
- [ ] Prepare rollback plan (if needed)

---

## 🆘 Getting Help

### Documentation
1. **V39_COMPLETION_REPORT.md** - Full feature documentation
2. **V39_QUICK_REFERENCE.md** - Quick lookup guide
3. **V39_FINAL_SUMMARY.md** - Executive summary
4. **This file** - Upgrade and troubleshooting

### Code Examples

**Creating a draw with CASH prize:**
```typescript
const drawData = {
  // ... existing fields
  prizeType: "CASH",
  cashAmount: 50000, // ₦50,000
};
```

**Filtering winners list:**
```typescript
const filters = {
  drawId: "some-draw-id",
  status: "SELECTED",
  prizeType: "CASH",
  search: "john@example.com",
  from: "2024-01-01",
  to: "2024-12-31",
  page: 0,
  size: 50,
};
```

**Submitting redeem request:**
```typescript
const formData = new FormData();
formData.append("accountNumber", "0123456789");
formData.append("bankCode", "058");
formData.append("accountName", "John Doe");
formData.append("proofs", file1);
formData.append("proofs", file2);
formData.append("proofKinds", "ACCOUNT_ENQUIRY");
formData.append("proofKinds", "ID_VERIFICATION");

await redeemWinner(winnerId, formData);
```

### Common Questions

**Q: Can I edit a submitted redeem/fulfil request?**  
A: No, you must wait for it to be rejected, then submit a new one.

**Q: Can I redeem multiple winners at once?**  
A: No, each winner must be redeemed individually.

**Q: What if I upload the wrong file?**  
A: Click the trash icon to remove it before submitting.

**Q: Can checkers propose changes?**  
A: No, only ADMIN role can propose. AUTH role can only approve/reject.

**Q: What happens if a file is too large?**  
A: You'll see an error. Compress the image or use a smaller file.

**Q: Do I need to fulfil immediately after redeeming?**  
A: No, you can fulfil later after the payout/handover is complete.

---

## 🎯 Success Indicators

After upgrading, you should see:

✅ "Winners" appears in admin sidebar (for ADMIN role)  
✅ Can create draws with CASH or ITEM prize type  
✅ Can filter subscription reports by date/status/package  
✅ Can view list of winners with filters  
✅ Can open winner detail drawer  
✅ Can upload files via drag-drop  
✅ Can submit redeem/fulfil requests  
✅ Can view uploaded proofs  
✅ Checkers can see winner change requests in approvals  

---

## 📈 Monitoring Post-Upgrade

### Metrics to Watch

1. **Error Rates**
   - 409 errors (already pending) - should be low
   - 403 errors (permission denied) - should be zero for ADMIN
   - File upload failures - should be <1%

2. **Performance**
   - Winners list load time: <2s
   - Detail drawer open time: <1s
   - File upload time: <5s (depends on size/connection)
   - Proof viewer load: <2s

3. **Usage**
   - Winners page views (should increase)
   - Redeem submissions per day
   - Fulfil submissions per day
   - Average time from SELECTED → DISBURSED

### Alerts to Set Up

- API 500 errors on winners endpoints
- File upload failures >5%
- Change request approval SLA >24h
- Proof download failures

---

## 🔄 Rollback Plan (If Needed)

### If Critical Issues Found

1. **Revert Code**
   ```bash
   git revert <v39-commit-hash>
   git push origin main
   ```

2. **Rebuild**
   ```bash
   npm run build
   ```

3. **Redeploy**
   - Deploy reverted version
   - Notify team of rollback
   - Document issues found

### Database Rollback (If Schema Changed)
⚠️ **Note**: v39 doesn't change database schema. Backend changes are separate.

If backend rolled back:
- Winners data remains in database
- New API endpoints return 404
- Frontend shows error messages
- No data loss

---

## ✅ Upgrade Complete Checklist

After completing all steps, verify:

- [ ] Build passes with 0 errors
- [ ] All tests pass (if applicable)
- [ ] Winners page loads correctly
- [ ] Can view winner details
- [ ] Can upload files
- [ ] Can submit requests
- [ ] Checkers can approve
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Works in all supported browsers
- [ ] Documentation reviewed by team
- [ ] Deployment runbook updated
- [ ] Monitoring configured
- [ ] Team trained on new features

---

**Upgrade Status:** ⏳ In Progress  
**Target Completion:** [Your Date]  
**Contact:** [Your Team]  

**Good luck with the upgrade! 🚀**
