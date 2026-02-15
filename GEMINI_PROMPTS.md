# CxTrack CRM — Execution Audit: Phone, Tasks, Pipeline, Lender System

> All changes below have been **executed directly by Claude**. This document serves as an audit trail and reference for future modifications.

---

## Current-State Audit (Pre-Fix)

| Feature | Status | Details |
|---------|--------|---------|
| Phone formatting in QuickAddCustomerModal | BROKEN | Plain `<input type="tel">` — no formatting |
| Phone formatting in ProfileTab | BROKEN | Plain `<input type="tel">` — no formatting |
| Phone formatting in CustomerModal | OK | Already uses `<PhoneInput>` |
| Phone formatting in CustomerForm | OK | Already uses `<PhoneInput>` |
| Phone formatting in SupplierModal | OK | Already uses `<PhoneInput>` |
| Task creation from calendar | BROKEN | `status: 'todo'` violates DB CHECK constraint; missing scheduling columns in DB |
| Task priority casing | BROKEN | Code sends `'medium'`, DB CHECK expects `'Medium'` |
| Task scheduling fields | BROKEN | `start_time`, `end_time`, `duration`, `show_on_calendar`, `outcome`, `type`, `due_time` missing from DB |
| Application/Pipeline creation | WORKING | Basic creation works, but missing lender/commission fields |
| Lender selector in Applications | MISSING | No lender dropdown on NewDealPage |
| Commission tracking | MISSING | No commission fields in pipeline_items or UI |
| Lender management form | PLACEHOLDER | Modal says "integration in progress..." |
| Lender CRUD (add/edit/delete) | INCOMPLETE | Only list view worked; no add/edit/delete |

---

## Phase A — Database Migrations (Executed)

### A1: `add_task_scheduling_columns`
Added 7 columns to `tasks`: `start_time` (TEXT), `end_time` (TEXT), `duration` (INTEGER DEFAULT 30), `type` (TEXT), `outcome` (TEXT), `show_on_calendar` (BOOLEAN DEFAULT false), `due_time` (TIME).

### A2: `add_lender_default_commission_columns`
Added 2 columns to `lenders`: `default_commission_pct` (NUMERIC(5,3) DEFAULT 0), `default_volume_commission_pct` (NUMERIC(5,3) DEFAULT 0).

### A3: `add_pipeline_lender_commission_columns`
Added 5 columns to `pipeline_items`: `lender_id` (UUID FK to lenders), `commission_percentage` (NUMERIC(5,3)), `volume_commission_percentage` (NUMERIC(5,3)), `commission_amount` (NUMERIC(12,2)), `volume_commission_amount` (NUMERIC(12,2)). Plus index on `lender_id`.

### A4: `expand_lender_rls_all_members`
Replaced owner/admin-only lender management with full org member CRUD access.

---

## Phase B — Code Changes (Executed)

### B1: PhoneInput in QuickAddCustomerModal
**File:** `src/components/shared/QuickAddCustomerModal.tsx`
- Added `import { PhoneInput } from '@/components/ui/PhoneInput'`
- Replaced plain `<input type="tel">` with `<PhoneInput>` component

### B2: PhoneInput in ProfileTab
**File:** `src/components/settings/ProfileTab.tsx`
- Added `import { PhoneInput } from '@/components/ui/PhoneInput'`
- Replaced phone icon + plain input with `<PhoneInput>` component

### B3: Fix taskStore.ts
**File:** `src/stores/taskStore.ts`
- **createTask**: Changed `status: 'todo'` to `status: 'pending'`; added priority title-case mapping; added all scheduling fields to insert
- **updateTask**: Removed `'todo'` status mapping; added priority title-case mapping; added scheduling fields
- **Both response mappings**: Fixed to read `show_on_calendar` from DB, use `type || category`

### B4: Create lenderStore.ts
**File:** `src/stores/lenderStore.ts` (NEW)
- Zustand store with `Lender` interface, `fetchLenders`, `createLender`, `updateLender`, `deleteLender`, `getLenderById`

### B5: Update dealStore.ts
**File:** `src/stores/dealStore.ts`
- Added `lender_id`, commission fields to `Deal` interface
- Added `lenders` join to `fetchDeals` select
- Added commission fields + computed amounts to `createDeal`

### B6: Lender & Commission UI on NewDealPage
**File:** `src/pages/pipeline/NewDealPage.tsx`
- Added lender selector dropdown (mortgage_broker only)
- Added "+ New" inline quick-add lender
- Added commission % fields with auto-fill from lender defaults
- Added commission amount preview widget
- Passes all new fields to `createDeal()`

### B7: LenderDirectory CRUD Form
**File:** `src/components/mortgage/LenderDirectory.tsx`
- Replaced placeholder modal with full add/edit form
- Switched from inline supabase to `useLenderStore`
- Added delete button with confirmation
- Phone fields use `<PhoneInput>` component
- Shows commission defaults on lender cards

---

## Build Status

```
npm run build → SUCCESS (0 errors, 20.98s)
```

---

## Verification Checklist

- [x] DB: `tasks` table has all 7 new scheduling columns
- [x] DB: `lenders` table has `default_commission_pct` and `default_volume_commission_pct`
- [x] DB: `pipeline_items` has `lender_id` and 4 commission columns
- [x] DB: Lender RLS allows all org members full CRUD
- [x] Code: QuickAddCustomerModal uses PhoneInput
- [x] Code: ProfileTab uses PhoneInput
- [x] Code: taskStore inserts `status: 'pending'` (not 'todo')
- [x] Code: taskStore maps priority to title-case
- [x] Code: taskStore includes all scheduling fields
- [x] Code: lenderStore.ts created with full CRUD
- [x] Code: dealStore includes lender/commission in Deal interface and createDeal
- [x] Code: NewDealPage shows lender section for mortgage_broker only
- [x] Code: LenderDirectory has real add/edit/delete form
- [x] Build passes with 0 errors
