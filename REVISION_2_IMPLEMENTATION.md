# Revision 2 Implementation Tracker

## Status: IN PROGRESS

### ✅ Completed

1. **Colors Reverted**
   - [x] globals.css: Restored `.theme-admin { --primary: var(--destructive); }`
   - [x] globals.css: Changed brand gradient to `#FF3B3B → #CC0000`
   - [x] globals.css: Added custom thin scrollbars for admin
   - [x] status-badge.tsx: Rebuilt with proper neutral mapping
   - [x] Created CountPill component for neutral grey count badges

2. **Button Component Enhanced**
   - [x] Added sizes: sm (28px), md (32px), lg (56px unchanged)
   - [x] Added danger variant
   - [x] Added loading state with spinner
   - [x] Added icon support
   - [x] Active state: scale-[0.98]

3. **Foundation Files Created**
   - [x] components/admin/icon.tsx - Standardized icon wrapper (16px, strokeWidth 1.5)
   - [x] components/admin/admin-field.tsx - Rebuilt with 32px height, tighter spacing
   - [x] components/admin/confirm-dialog.tsx - Replaces window.confirm
   - [x] lib/utils/draw-actions.ts - Centralized draw action logic

4. **Documentation**
   - [x] ADMIN_DESIGN_PROGRESS.md updated with Revision 2 section
   - [x] Created this implementation tracker

### 🚧 In Progress

5. **Modal System Rebuild** - NEXT PRIORITY
   - [ ] components/admin/admin-modal.tsx with all requirements:
     - [ ] Structure: header (title 16px/600, 32x32 close button, hairline), scrollable body, sticky footer
     - [ ] Sizes: sm 440px, md 560px, lg 760px
     - [ ] Max-height 88vh, body scrolls internally
     - [ ] Footer always visible (sticky)
     - [ ] 32px inputs, two-column FormGrid on md+
     - [ ] Framer-motion animations (fade + scale + slide)
     - [ ] `tone="light"` variant support (token-driven)
     - [ ] Focus trap, Esc close, dirty form warning
   - [ ] components/admin/modal-section.tsx - Section wrapper with label
   - [ ] components/admin/form-grid.tsx - Two-column responsive grid

6. **Filter System Rebuild** - NEXT PRIORITY
   - [ ] components/admin/filter-popover.tsx:
     - [ ] Toolbar with result count + Filters(N) button
     - [ ] Popover ~520px, condition rows: "Where [Field] [Operator] [Value] [×]"
     - [ ] Live updates (no Apply button): selects immediate, text 300ms debounce
     - [ ] Fields can be used only once (grey out used)
     - [ ] Thin progress bar on table while loading
   - [ ] components/admin/filter-chips.tsx - Synchronized active chips
   - [ ] components/admin/listbox.tsx - Custom dropdown (replaces native select)
     - [ ] Small list, selected item with check
     - [ ] Keyboard navigation (arrows, Enter, Esc, type-ahead)
     - [ ] Search box when >7 options

7. **Audit Log Page Rework**
   - [ ] Replace FilterBar with FilterPopover
   - [ ] Update page title: 24px → 20px / 600
   - [ ] Update card title: 15px → 14px / 600
   - [ ] Update body text: 14px → 13px
   - [ ] Stat cards: remove colored tiles, use neutral 32px tile with muted icon + status dot
   - [ ] Remove all pink from any focus rings or accents
   - [ ] Update button sizes to sm/md
   - [ ] Card padding: 20px → 16px
   - [ ] Card radius: 14px → 12px

8. **Rewards Page Rework & Bug Fix**
   - [ ] Import and use getDrawActions() helper
   - [ ] Replace window.confirm with ConfirmDialog
   - [ ] Fix variant="destructive" → variant="danger" on buttons
   - [ ] Draw Details view:
     - [ ] Use AdminPageHeader with back button and status badge
     - [ ] Show draw info as compact two-column definition list
     - [ ] Winners section: real table (not key/value blocks)
     - [ ] Fix pluralization: "1 tokens" → "1 token"
     - [ ] Replace "Actions" card with getDrawActions() logic
     - [ ] Show read-only note when CLOSED + winnersSelected
   - [ ] Update all button sizes to md
   - [ ] Update page title to 20px / 600
   - [ ] Replace native selects in Create Draw modal with custom listbox

9. **Motion System Implementation**
   - [ ] Add framer-motion animations to all modals
   - [ ] Add useReducedMotion hook usage
   - [ ] Popovers: fade + scale from origin (140ms)
   - [ ] Buttons: 120ms hover transitions
   - [ ] Table rows: background lift on hover
   - [ ] Stat numbers: count-up animation on first render
   - [ ] Skeleton shimmer → content fade on load

10. **Date Field Enhancement**
    - [ ] Update date-range-field.tsx to show `DD MMM YYYY` format
    - [ ] Add color-scheme: dark for native picker
    - [ ] Integrate with FilterPopover preset chips

11. **Progress Bar Updates**
    - [ ] Ensure used in filter loading (thin bar on table)
    - [ ] Remove any pink colors

### 📋 TODO - Lower Priority

12. **Remaining Admin Components Updates**
    - [ ] admin-page-header.tsx - Add back button support, status badge placement
    - [ ] admin-card.tsx - Update padding 20px → 16px, radius 14px → 12px
    - [ ] admin-stat-card.tsx - Neutral 32px tile with muted icon + status dot
    - [ ] admin-action-button.tsx - Ensure matches new Button sizes
    - [ ] data-table.tsx - Update text sizes, row height, hover states
    - [ ] loading-states.tsx - Update sizes and transitions
    - [ ] avatar-initials.tsx - Verify sizes (32px)

13. **Global Search & Replace**
    - [ ] Find all admin files with `text-2xl` or `text-3xl` → change to `text-xl` (20px)
    - [ ] Find all admin files with `text-lg` → change to `text-sm` (14px)
    - [ ] Find all admin files with `text-base` → change to `text-[13px]`
    - [ ] Find all admin files with `rounded-2xl` cards → change to `rounded-xl` (12px)
    - [ ] Find all admin files with `rounded-xl` controls → change to `rounded-lg` (8px)
    - [ ] Find all admin files with `p-5` or `p-6` cards → change to `p-4`
    - [ ] Find all admin files with pink colors or `bg-brand-gradient` in admin → remove/replace
    - [ ] Find all lucide icons without explicit size → add size={16} strokeWidth={1.5}

14. **Reports Page (Phase 2 prep)**
    - [ ] Subscriptions tab: replace "[10 items]" dump with real table
    - [ ] Fix "1 subs" pluralization
    - [ ] Raffles filter: replace native date inputs and Apply button with FilterPopover

15. **Testing & Verification**
    - [ ] Screenshot audit-log at 1440px, 1024px, 768px, 390px
    - [ ] Screenshot rewards draw detail at all breakpoints
    - [ ] Test modal with long form on short screen (footer visible)
    - [ ] Test dirty form discard prompt
    - [ ] Test ACTIVE draw actions
    - [ ] Test CLOSED draw without winners
    - [ ] Test CLOSED draw with winners (read-only)
    - [ ] Test keyboard navigation: filters, dropdowns, modals
    - [ ] Test prefers-reduced-motion
    - [ ] Verify no pink anywhere in admin
    - [ ] Verify player app unchanged
    - [ ] Build with no errors

## Implementation Order

**Phase A (Critical - Do Now):**
1. Modal system rebuild (admin-modal, modal-section, form-grid)
2. FilterPopover + ListBox + FilterChips
3. Audit Log page rework with new filters
4. Rewards page bug fix + new modals

**Phase B (High Priority):**
5. Motion system implementation
6. Global typography/spacing search & replace
7. Remaining component updates

**Phase C (Verification):**
8. Testing checklist
9. Screenshots at all breakpoints
10. Build verification

## Known Issues to Fix

1. ✅ Colors: Pink still present in old Phase 1 implementation
2. ✅ Buttons: Too large (36px+ instead of 32px)
3. ✅ Typography: Too large throughout
4. ✅ Spacing: Too generous (p-6 instead of p-4)
5. ✅ Radii: Too large (14px cards instead of 12px)
6. ⚠️ Filters: Wrong pattern (filter bar with Apply instead of popover with live updates)
7. ⚠️ Modals: Missing sticky footer, native selects, bright scrollbar
8. ⚠️ Icons: Inconsistent sizes and weights, colored tiles
9. ⚠️ Draws bug: CLOSED draws still show "Select Winners"
10. ⚠️ window.confirm: Still used in rewards page

## Notes

- Player app must remain completely unchanged
- All admin pages must continue to build and function during implementation
- Focus on reference image alignment: "smaller and quieter" when unsure
- Red is only for primary/active/danger, never for count pills or neutral states
- Motion must respect prefers-reduced-motion
- Every listbox/dropdown needs keyboard navigation
