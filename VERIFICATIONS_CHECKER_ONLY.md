# Verifications Page - Checker-Only Approval Rule

## New Rule: Only CHECKER Can Approve/Reject

**Previous rule**: Admins could not approve/reject their own requests  
**New rule**: Only CHECKER (role AUTH) can approve/reject ANY request

### Implementation

**File**: `app/admin/change-requests/page.tsx`

## 1. Role Detection

```typescript
const adminSession = useAdminAuthStore((s) => s.session);
const isChecker = adminSession?.role === 'AUTH';
const canApproveReject = isChecker;
```

Role comes from JWT `groups` claim via `getAdminRole()` in admin-auth-store.

---

## 2. Button State Logic

### For MAKER (ADMIN role) or Unknown Role:

**Buttons disabled on ALL cards**:
- `disabled={!canApproveReject || ...}`
- `aria-disabled={!canApproveReject || ...}`
- CSS: `disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50`
- Tooltip: "Only a checker can approve or reject this request."
- Helper text below buttons: "Only a checker can approve or reject this request."

**No hover or focus effects when disabled**:
- Approve button: `disabled:hover:opacity-50` (stays at 50%, no hover change)
- Reject button: `disabled:hover:bg-transparent disabled:hover:border-destructive/50` (no hover effect)

### For CHECKER (AUTH role):

**Buttons enabled for others' requests**:
- Normal functionality
- Hover effects work
- Click opens modal or submits

**Buttons disabled for own requests** (old rule still applies):
- `isOwnRequest(request)` checks if checker's email equals `proposedByEmail`
- Same disabled styling
- Tooltip: "You proposed this request. A different admin must review it."
- Helper text: "You proposed this request. A different admin must review it."

---

## 3. Handler Functions - Early Return

All handler functions check role before proceeding:

### handleApprove()
```typescript
const handleApprove = async (request: ChangeRequest) => {
  // Only checker can approve
  if (!canApproveReject) return;
  
  // ... rest of logic
}
```

### handleApprovalSubmit()
```typescript
const handleApprovalSubmit = async () => {
  // Only checker can approve
  if (!canApproveReject) return;
  
  // ... rest of logic
}
```

### handleRejectClick()
```typescript
const handleRejectClick = (request: ChangeRequest) => {
  // Only checker can reject
  if (!canApproveReject) return;
  
  // ... opens modal
}
```

### handleRejectSubmit()
```typescript
const handleRejectSubmit = async () => {
  // Only checker can reject
  if (!canApproveReject) return;
  
  // ... rest of logic
}
```

**Result**: Even if someone bypasses the UI (devtools, etc.), the functions do nothing for makers.

---

## 4. Modal Behavior

### Reject Modal:
- **Maker**: Modal never opens (handleRejectClick returns early)
- **Checker**: Opens normally for others' requests

### Approval Modal (financial requests):
- **Maker**: Modal never opens (handleApprove returns early)
- **Checker**: Opens normally for others' requests

---

## 5. Status Filter Tabs

**Both roles can use**:
- Pending
- Approved
- Rejected
- All

Makers can view the list, they just can't act on requests.

---

## 6. Helper Text Display Logic

```typescript
{!canApproveReject && (
  <p className="text-xs text-muted-foreground italic text-center">
    Only a checker can approve or reject this request.
  </p>
)}
{canApproveReject && isOwnRequest(request) && (
  <p className="text-xs text-muted-foreground italic text-center">
    You proposed this request. A different admin must review it.
  </p>
)}
```

**Shows**:
- For maker: "Only a checker..." on every PENDING card
- For checker on own request: "You proposed this..."
- For checker on others' requests: No helper text (buttons active)

---

## Expected Behavior by Role

### Maker (ADMIN Role)

**Visual**:
- Every PENDING card shows greyed-out Approve/Reject buttons
- Buttons are faded (50% opacity)
- Helper text: "Only a checker can approve or reject this request."
- Hover over button shows tooltip with same text
- No hover effect (opacity stays at 50%, no visual change)
- cursor-not-allowed on hover

**Interaction**:
- Clicking buttons: Nothing happens (early return in handlers)
- No network requests sent
- No modals open
- Can still view requests and use status filter tabs

### Checker (AUTH Role) - Others' Requests

**Visual**:
- Approve/Reject buttons fully enabled and styled
- Hover effects work (opacity change, background change)
- No helper text

**Interaction**:
- Clicking Approve: Opens modal (financial) or approves directly (non-financial)
- Clicking Reject: Opens rejection modal
- Network requests sent
- Actions complete normally

### Checker (AUTH Role) - Own Requests

**Visual**:
- Approve/Reject buttons greyed out (50% opacity)
- Helper text: "You proposed this request. A different admin must review it."
- Hover shows tooltip
- cursor-not-allowed

**Interaction**:
- Clicking buttons: Nothing happens (isOwnRequest check in handlers)
- No network requests
- No modals open

---

## Testing Checklist

### As Maker (admin.qa@nollywin.test - Normal Window):

1. ✅ Build passes
2. ⏳ Login redirects to `/admin/overview`
3. ⏳ Navigate to Verifications (`/admin/change-requests`)
4. ⏳ Every PENDING card shows:
   - Greyed out Approve button (faded, 50% opacity)
   - Greyed out Reject button (faded, 50% opacity)
   - Helper text: "Only a checker can approve or reject this request."
5. ⏳ Hover over buttons:
   - Shows tooltip with same message
   - No visual change (stays greyed out)
   - cursor-not-allowed
6. ⏳ Click Approve button:
   - Nothing happens
   - No network request in DevTools Network tab
   - No error message
7. ⏳ Click Reject button:
   - Nothing happens
   - No modal opens
   - No network request
8. ⏳ Status tabs still work (can switch between Pending/Approved/Rejected/All)

### As Checker (checker.qa@nollywin.test - Incognito Window):

1. ✅ Build passes
2. ⏳ Login redirects to `/admin/change-requests`
3. ⏳ For requests NOT proposed by checker:
   - Approve/Reject buttons fully enabled (normal styling)
   - Hover shows normal hover effect (not greyed out)
   - No helper text
4. ⏳ Click Approve on non-financial request:
   - Sends network request
   - Shows success message
   - Request removed from list
5. ⏳ Click Reject:
   - Opens rejection modal
   - Can submit rejection
   - Works normally
6. ⏳ For requests proposed by checker (create one first):
   - Buttons greyed out
   - Helper text: "You proposed this request..."
   - Clicking does nothing

---

## Files Modified

1. **`app/admin/change-requests/page.tsx`**:
   - Added `isChecker` and `canApproveReject` computed from session role
   - Updated all handler functions with early return if `!canApproveReject`
   - Updated button disabled logic: `!canApproveReject || (canApproveReject && isOwnRequest(request))`
   - Added conditional helper text for makers vs checkers' own requests
   - Added tooltips for both cases
   - Updated CSS to prevent hover effects when disabled

---

## Build Status

✅ `npm run build` passed successfully

---

## Security Notes

- **UI-only restriction**: Backend still enforces permissions
- **Double-gated**: Visual disabled state + handler early returns
- **No fake security claims**: Comments don't claim this provides security
- **Role from JWT**: Uses actual role from token `groups` claim

---

## Role Detection Source

Role determined by `getAdminRole()` in `store/admin-auth-store.ts`:
- **Primary**: JWT payload `groups` array
  - `groups.includes("auth")` → AUTH (checker)
  - `groups.includes("admin")` → ADMIN (maker)
- **Fallback**: Other role fields in response or JWT
- **Temp fallback**: `loginPath === "fallback"` → AUTH

---

## Summary

| User | Can Approve/Reject? | Button State | Helper Text | Click Behavior |
|------|---------------------|--------------|-------------|----------------|
| Maker (ADMIN) | ❌ Never | Disabled (all cards) | "Only a checker can approve..." | Nothing happens |
| Checker (AUTH) - Others | ✅ Yes | Enabled | None | Opens modal / Approves |
| Checker (AUTH) - Own | ❌ No | Disabled | "You proposed this..." | Nothing happens |

**Makers can view but not act. Checkers can act on others' requests only.**
