# Date Filter Bug Fix - Complete Summary

## Bug Fixed
**Issue**: Reports > Subscription Entries failed on any date filter with double-encoding error:
```
Invalid 'from' value '2026-11-06T00%3A00%3A00%2B01%3A00'
```

**Root Cause**: 
1. Date values were encoded with `encodeURIComponent()` 
2. Then passed to `URLSearchParams.append()` which encodes again
3. Result: `%3A` and `%2B` sent as literal text instead of `:` and `+`
4. Backend rejected the double-encoded format

## Fixes Applied

### 1. Created UTC Conversion Helper (`lib/utils/date-format.ts`)
```typescript
lagosToUtcISO(year, month, day, hour, minute, second): string
```
- Converts Lagos wall-clock time to UTC ISO 8601 with Z suffix
- Lagos has NO daylight saving (always UTC+1)
- Uses explicit arithmetic: UTC = Lagos time minus 1 hour
- Examples:
  - Lagos 2026-11-06 00:00:00 → `2026-11-05T23:00:00Z`
  - Lagos 2026-11-13 23:59:59 → `2026-11-13T22:59:59Z`
- Output contains NO `%` or `+` characters

### 2. Removed Double Encoding

**Files Fixed**:
- `lib/api/admin.ts`:
  - `getSubscriptionReportSummary()` - removed `encodeURIComponent()` on lines 731-732
  - `getSubscriptionReport()` - removed `encodeURIComponent()` on lines 766-767
  
- `lib/api/admin-winners.ts`:
  - `buildLagosDateTimeParams()` - replaced encoding with UTC conversion
  - Now converts YYYY-MM-DD to proper UTC ISO format
  - Removed all `encodeURIComponent()` calls on date values

**Rule**: Never call `encodeURIComponent()` on values passed to `URLSearchParams.append()` - it handles encoding automatically.

### 3. Updated Date Presets (`lib/utils/date-format.ts`)

**getDatePresets()** now returns UTC ISO strings:
- **Today**: Lagos start of day 00:00:00 → UTC, Lagos end of day 23:59:59 → UTC
- **Last 7 days**: Today plus previous 6 days (7 total, not 8)
- **This month**: First day 00:00:00 → last day 23:59:59 in Lagos, converted to UTC
- **All time**: `from` and `to` are `undefined`

### 4. Enhanced Error Handling (`app/admin/reports/page.tsx`)

- Shows backend `message` in error banner instead of generic text
- Added **Retry** button to error banner
- Validates `from <= to` before sending request
- Error: "'From' date must be on or before 'To' date"

### 5. Updated UI (`app/admin/reports/page.tsx`)

- Added **"All time"** preset button
- Fixed datetime-local inputs to:
  - Display UTC values correctly (strip Z, show first 16 chars)
  - Convert user input (Lagos time) to UTC ISO on change
  - Handle empty values
- All 4 preset buttons: Today, Last 7 days, This month, All time

### 6. Added Unit Tests (`lib/utils/__tests__/date-format.test.ts`)

**11 tests, all passing**:
- Lagos 2026-11-06 00:00 → `2026-11-05T23:00:00Z` ✓
- Lagos 2026-11-13 23:59:59 → `2026-11-13T22:59:59Z` ✓
- Output contains no `%` ✓
- Output contains no `+` ✓
- Output ends with `Z` ✓
- Handles Lagos midnight correctly ✓
- Handles Lagos noon correctly ✓
- `getStartOfDayUTC()` works correctly ✓
- `getEndOfDayUTC()` works correctly ✓
- Works regardless of local timezone ✓

## Call Sites Updated

All date-filtered endpoints now use the fixed helper:

### Reports - Subscription Entries
- `lib/api/admin.ts::getSubscriptionReportSummary()`
- `lib/api/admin.ts::getSubscriptionReport()`
- Uses: `app/admin/reports/page.tsx` (Subscription Entries tab)

### Winners
- `lib/api/admin-winners.ts::listWinners()`
- `lib/api/admin-winners.ts::buildLagosDateTimeParams()`
- Uses: `app/admin/winners/page.tsx` (Winners filters)

### Redemptions
- `lib/api/admin-winners.ts::getRedemptions()`
- Uses same `buildLagosDateTimeParams()` helper
- Uses: `app/admin/winners/page.tsx` (Redemptions filters)

### Exports (CSV/PDF)
- `lib/export/report-config.ts::draws.fetchAll()`
- `lib/export/report-config.ts::subscriptions.fetchAll()`
- `lib/export/report-config.ts::winners.fetchAll()`
- `lib/export/report-config.ts::redemptions.fetchAll()`
- All use the same fixed API functions

## Verification Status

✅ **Unit tests pass**: 11/11 tests passing  
✅ **Build passes**: TypeScript compilation successful  
✅ **No double encoding**: Values passed RAW to URLSearchParams  
✅ **UTC conversion**: Lagos → UTC with explicit arithmetic  
✅ **No timezone offsets sent**: All dates end with `Z`, never `+01:00`  
✅ **Error handling**: Backend message shown with Retry button  
✅ **Validation**: From/To checked before request  
✅ **All presets**: Today, Last 7 days, This month, All time

## Next Steps for User Verification

1. **Test presets**:
   - Click "Today" → verify table loads
   - Click "Last 7 days" → verify correct date range (7 days, not 8)
   - Click "This month" → verify first to last day of current month
   - Click "All time" → verify all subscriptions load

2. **Test phone search**:
   - Search: `09160572310` → note result count
   - Search: `+2349160572310` → verify IDENTICAL results

3. **Check network tab**:
   - Look for `from=` and `to=` params
   - Verify format: `YYYY-MM-DDTHH:mm:ssZ` (with Z, not +01:00)
   - Verify no `%3A` or `%2B` in URL
   - Verify backend returns 200, not 400

4. **Verify summary tiles**:
   - Total subscriptions matches row count
   - Revenue calculation correct
   - Status breakdown adds up to total
   - Package breakdown adds up to total

5. **Test custom dates**:
   - Pick From/To dates
   - Apply filters
   - Verify data matches date range

6. **Screenshots needed**:
   - Admin Reports > Subscription Entries at 1440px width
   - Same at 390px width
   - Network tab showing request URL with proper encoding
