# Audit Log Filter Fix

**Date:** January 2026
**Issues:** 
1. Filter not applying when clicking breakdown cards
2. Duplicate key error in Admin dropdown
3. Expandable rows showing blank content
4. Pagination not working correctly

---

## Issues Fixed

### 1. Duplicate Key Error in Admin Dropdown

**Problem:**
- Console error: "Encountered two children with the same key"
- The `byActor` array from API contained multiple entries with null or empty `actorEmail` values
- This created duplicate `""` keys in the select options

**Root Cause:**
```typescript
// Old code - creates duplicate empty keys
...(summary?.byActor.map((a) => ({
  value: a.actorEmail || "",  // Multiple entries with "" value
  label: a.actorEmail || "System",
})) || [])
```

**Fix:**
```typescript
// New code - filters out empty/null emails
...(summary?.byActor
  .filter((a) => a.actorEmail && a.actorEmail.trim() !== "")
  .map((a) => ({
    value: a.actorEmail,
    label: a.actorEmail,
  })) || [])
```

**Result:** Only admins with valid email addresses appear in the dropdown. System actions are excluded from the filter (they can still be viewed in the table).

---

### 2. Filters Not Applying from Breakdown Cards

**Problem:**
- Clicking "Referral setting" card sets filter state but doesn't reload data
- Table remains empty even though summary shows "3 entries"
- Filter state updates but API call uses stale filter values

**Root Cause:**
```typescript
// Old code - uses setTimeout with closure issue
const handleResourceTypeClick = (resourceType: string) => {
  setFilters((prev) => ({ ...prev, resourceType }));
  setTimeout(() => loadEntries(true), 0);  // loadEntries reads old `filters` state
};
```

React batches state updates, so even with `setTimeout`, the `loadEntries` function was reading the old `filters` state before the update was committed.

**Fix:**
```typescript
// New approach - pass filter values directly
const handleResourceTypeClick = (resourceType: string) => {
  const newFilters = { ...filters, resourceType };
  setFilters(newFilters);
  loadEntriesWithFilters(newFilters, true);  // Use new values directly
};

// New helper function that accepts filter overrides
async function loadEntriesWithFilters(filterOverrides: typeof filters, resetPage = false) {
  const currentPage = resetPage ? 1 : page;
  return loadEntriesDirectly(filterOverrides, currentPage, size);
}
```

**Result:** Clicking breakdown cards immediately applies the filter and reloads the table with correct results.

---

### 3. Blank Expandable Content

**Problem:**
- Clicking expand arrow on table rows showed blank content
- Old code only displayed `requestDetails` and `errorMessage` fields
- If both fields were missing/null, the expanded area was completely empty

**Root Cause:**
```typescript
// Old code - only shows 2 specific fields
renderExpanded={(entry) => (
  <div>
    {entry.requestDetails && <div>...</div>}
    {entry.errorMessage && <div>...</div>}
  </div>
)}
```

**Fix:**
```typescript
// New code - shows all additional fields not in the table
renderExpanded={(entry) => {
  const visibleKeys = ['id', 'timestamp', 'actorEmail', 'action', 'description', 'resourceType', 'resourceId', 'success'];
  const additionalFields = Object.entries(entry).filter(
    ([key]) => !visibleKeys.includes(key) && entry[key] != null
  );
  
  if (additionalFields.length === 0) {
    return <div>No additional details available</div>;
  }
  
  return (
    <div className="grid">
      {additionalFields.map(([key, value]) => (
        <div key={key}>
          <div>{humanizeResourceType(key)}</div>
          <div>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
        </div>
      ))}
    </div>
  );
}}
```

**Result:** 
- All additional API fields are shown in expanded view
- Objects are formatted as JSON
- Shows "No additional details available" if no extra fields exist
- Field names are humanized (e.g., "error_message" → "Error Message")

---

### 4. Pagination Not Working

**Problem:**
- Clicking "Next" or "Previous" didn't load new data
- Changing page size (25/50/100) didn't reload
- Same state closure issue as filters

**Root Cause:**
```typescript
// Old code - updates state, then reads old state
onPageChange: (newPage) => {
  setPage(newPage);  // Update state
  setTimeout(() => loadEntries(), 0);  // Reads old `page` value
}
```

**Fix:**
```typescript
// New code - passes values directly to API call
onPageChange: (newPage) => {
  setPage(newPage);
  loadEntriesDirectly(filters, newPage, size);  // Use newPage directly
}

onSizeChange: (newSize) => {
  setSize(newSize);
  setPage(1);
  loadEntriesDirectly(filters, 1, newSize);  // Use newSize directly
}

// New helper that accepts explicit page/size values
async function loadEntriesDirectly(filterOverrides, targetPage, targetSize) {
  const data = await getAuditLog({
    ...filterOverrides,
    page: targetPage,  // Use passed value, not state
    size: targetSize,  // Use passed value, not state
  });
  setEntries(data.entries);
  setTotal(data.total);
  if (targetPage !== page) setPage(targetPage);
  if (targetSize !== size) setSize(targetSize);
}
```

**Result:** Pagination works correctly - clicking Next/Previous/size selector loads the right page immediately.

---

## Files Changed

- `app/admin/audit-log/page.tsx`
  - Added `loadEntriesDirectly()` helper function (accepts explicit page/size)
  - Added `loadEntriesWithFilters()` wrapper (uses current page/size)
  - Updated `handleResourceTypeClick()` to pass filters directly
  - Updated `handleAdminClick()` to pass filters directly
  - Updated `handleResetFilters()` to pass filters directly
  - Fixed Admin dropdown to filter out empty emails
  - Fixed pagination callbacks to pass new page/size directly
  - Fixed expandable content to show all additional fields

---

## Testing

**Verified:**
- ✅ No duplicate key errors in console
- ✅ Clicking "Referral setting" card filters table correctly
- ✅ Clicking admin name in breakdown card filters table correctly
- ✅ "Clear all" resets filters and reloads table
- ✅ Manual filter selection + "Apply Filters" works
- ✅ Expandable rows show additional fields (or "No additional details")
- ✅ Pagination "Next"/"Previous" buttons work
- ✅ Page size selector (25/50/100) works
- ✅ Entry count matches actual displayed rows
- ✅ Build passes without errors

**Expected Behavior:**
1. Click "Referral setting" in breakdown → Table shows only referral_setting entries, correct count displayed
2. Click an admin email in breakdown → Table shows only that admin's actions
3. Use dropdown filters + "Apply Filters" → Table updates with selected filters
4. Click "Clear all" → All filters reset, table shows all entries
5. Click expand arrow on row → Shows all additional API fields, or "No additional details available"
6. Click "Next" → Loads next page of results
7. Change page size to 50 → Reloads with 50 items per page

---

## Technical Notes

**State Update Timing:**
React's `setState` is asynchronous and batched. When you need to perform an action based on new state:
- ❌ Don't rely on closure capturing old state
- ❌ Don't use setTimeout to "wait" for state update
- ✅ Pass new values directly to functions that need them
- ✅ Use React 18+ `useEffect` with dependencies if you need reactive behavior

**Key Uniqueness:**
When rendering lists, ensure keys are truly unique:
- ❌ Don't use indices as keys for dynamic lists
- ❌ Don't allow null/empty/duplicate values as keys
- ✅ Filter data to ensure unique identifiers
- ✅ Use compound keys (e.g., `${id}-${index}`) if needed

**Dynamic API Fields:**
When API returns `Record<string, unknown>`, show all available fields dynamically:
- ❌ Don't hardcode specific field names that might not exist
- ✅ Filter out fields already shown in the table
- ✅ Show remaining fields in expanded view
- ✅ Handle objects vs primitives appropriately

---

**Build Status:** ✅ Passing
**TypeScript:** ✅ No errors
**Console Errors:** ✅ Resolved
**Pagination:** ✅ Working
**Expandable Content:** ✅ Fixed
