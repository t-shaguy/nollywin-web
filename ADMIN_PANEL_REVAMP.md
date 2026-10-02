# Admin Panel Revamp - Comprehensive Fix List

## Immediate Errors to Fix

### 1. AdminApiError "Error invoking subclass method"
**Status:** Should be fixed, but might need dev server restart
**Fix Applied:** Changed from `new AdminApiError()` class to `createAdminApiError()` factory function that returns plain objects
**Action Needed:** Restart Next.js dev server to clear cached builds

### 2. CSV Template Download Failing
**Error:** "Failed to download CSV template"
**Endpoint:** `/api/v1/admin/trivia/questions/csv-template`
**Issue:** Backend endpoint returning error
**Frontend Fix:** Add better error handling with try-catch and user-friendly message

### 3. Backend "Error invoking subclass method" Errors
**Affected Endpoints:**
- ~~`/api/v1/admin/dashboard/overview`~~ ✅ Fixed (returns 200)
- `/api/v1/admin/dashboard/revenue-trend` - Backend Java error
- `/api/v1/admin/dashboard/recent-activity` - Backend Java error

**Frontend Fix Applied:** Used `Promise.allSettled()` to load dashboard partially even if some endpoints fail

**Backend Action Required:** Taysay needs to fix Java "Error invoking subclass method" on these endpoints

---

## UI/UX Improvements Needed

### 1. Maker-Checker Banner - Too Prominent
**Current:** Large green banner taking up too much space
**Requested:** More subtle, compact notification

**Proposed Changes:**
```tsx
// Current (too large):
<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
  <CheckCircle2 className="h-5 w-5" />
  <div>
    <p className="font-semibold">This action requires...</p>
    <p className="text-sm text-muted-foreground">Changes will take effect...</p>
  </div>
</div>

// New (compact):
<div className="bg-green-500/5 border border-green-500/20 rounded px-3 py-2 text-sm">
  <CheckCircle2 className="h-4 w-4" />
  <span className="text-green-600">Requires AUTH role approval</span>
</div>
```

### 2. Make All Admin Pages Match Overview Density

**Reference:** `/app/admin/overview/page.tsx` - This has good compact styling

**Pages to Update:**
1. `/app/admin/packages/page.tsx`
2. `/app/admin/trivia-setup/page.tsx`
3. `/app/admin/users/page.tsx`
4. `/app/admin/rewards/page.tsx`
5. `/app/admin/reports/page.tsx`

**Styling Changes Needed:**

#### Typography:
```css
/* Current (too large) */
h1: text-2xl font-bold
h2: text-xl font-bold
p: text-base

/* New (compact like overview) */
h1: text-xl font-bold
h2: text-lg font-semibold  
p: text-sm
```

#### Spacing:
```css
/* Current (too spacious) */
space-y-6
p-6
gap-4

/* New (compact) */
space-y-4
p-4
gap-3
```

#### Cards:
```css
/* Current */
className="bg-card border border-border rounded-2xl p-6"

/* New */
className="bg-card border border-border rounded-xl p-4"
```

#### Buttons:
```css
/* Current */
className="px-4 py-2 text-base"

/* New */
className="px-3 py-1.5 text-sm"
```

---

## Specific File Changes

### File: `lib/api/admin.ts`
**Function:** `downloadTriviaQuestionsCsvTemplate()`

**Add Better Error Handling:**
```typescript
export async function downloadTriviaQuestionsCsvTemplate(): Promise<void> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://3.211.19.155/nollywin/core";
    const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_accessToken") : null;
    
    const clientTokenRes = await fetch("/api/client-token");
    if (!clientTokenRes.ok) {
      throw new Error("Failed to get client token");
    }
    const { clientToken } = await clientTokenRes.json();
    
    const headers: HeadersInit = {
      "X-Client-Token": clientToken,
    };
    
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/trivia/questions/csv-template`, {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("CSV template download failed:", response.status, errorText);
      throw new Error(`Failed to download CSV template: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const blob = new Blob([csvText], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trivia-questions-template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV template:", error);
    throw error; // Re-throw so UI can show error message
  }
}
```

---

### File: `app/admin/trivia-setup/page.tsx`
**Function:** `downloadCSVTemplate()`

**Add User-Friendly Error Toast:**
```typescript
const downloadCSVTemplate = async () => {
  try {
    await downloadTriviaQuestionsCsvTemplate();
    // Optional: Show success toast
  } catch (error) {
    console.error("Failed to download CSV template:", error);
    alert("Failed to download CSV template. Please try again or contact support.");
  }
};
```

---

## Implementation Priority

### High Priority (Do First):
1. ✅ Fix `Promise.allSettled` for dashboard partial loading - DONE
2. ⏳ Restart dev server to clear AdminApiError cache
3. ⏳ Add error handling to CSV download
4. ⏳ Make maker-checker banner more subtle

### Medium Priority (UI Polish):
5. Update font sizes across all admin pages to match overview
6. Reduce padding/spacing to match overview density
7. Standardize card styling (rounded-xl, p-4)
8. Make buttons more compact (text-sm, smaller padding)

### Low Priority (Nice to Have):
9. Add loading skeletons for better UX
10. Add empty state illustrations
11. Improve error messages with actionable suggestions

---

## Testing Checklist

After implementing changes, test:

- [ ] Admin overview page loads with partial data even if some endpoints fail
- [ ] CSV template downloads successfully
- [ ] Maker-checker banner is subtle and doesn't dominate the page
- [ ] All admin pages have consistent, compact styling like overview
- [ ] Font sizes are readable but not oversized
- [ ] Spacing feels tight but not cramped
- [ ] No "Error invoking subclass method" in console
- [ ] Error messages are user-friendly and actionable

---

## Backend Issues (For Taysay)

**Java "Error invoking subclass method" on:**
1. `/api/v1/admin/dashboard/revenue-trend` 
2. `/api/v1/admin/dashboard/recent-activity`
3. `/api/v1/admin/trivia/questions/csv-template`

These are backend Java/Spring Boot errors that need fixing on the backend side.

---

## Quick Reference: Overview Page Styling

Use these classes as reference for other admin pages:

```tsx
// Page container
<div className="space-y-6">

// Section header
<h2 className="text-lg font-semibold mb-3">

// Stat cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-card border border-border rounded-xl p-4">
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
</div>

// Data cards
<div className="bg-card border border-border rounded-xl p-4">
  <h3 className="text-base font-semibold mb-3">Title</h3>
  <div className="space-y-2">
    {/* Content */}
  </div>
</div>

// Buttons
<Button size="sm" className="text-sm">Action</Button>

// Maker-checker banner (NEW COMPACT STYLE)
<div className="bg-green-500/5 border border-green-500/20 rounded px-3 py-2 flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  <span className="text-sm text-green-600">Requires AUTH role approval</span>
</div>
```
