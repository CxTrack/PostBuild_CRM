# CxTrack CRM — Execution Audit: Phone, Tasks, Pipeline, Lender System

> All changes below have been **executed directly by Claude**. This document serves as an audit trail and reference for future modifications.
>
> **Round 2** additions at bottom: Application 400 fix, commission UX polish, forecast summary.

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

---

# Round 2 — Application 400 Fix, Commission UX, Forecast Summary

> Executed by Claude. All changes below are applied and verified.

## Round 2: Root Cause Analysis

**Problem:** Creating a new application as mortgage_broker returned HTTP 400.

**Root Cause:** The `pipeline_items` table had a CHECK constraint:
```sql
CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'))
```
But mortgage_broker uses dynamic pipeline stages from `industry_pipeline_stages`:
`inquiry, prequalified, docs_requested, docs_received, submitted, approved, clear_to_close, funded, declined`

None of these match the CHECK constraint, so **every INSERT for mortgage_broker** (and all other custom-stage industries) failed with 400.

**Secondary Issue:** `handleSubmit` used `...formData` spread which sent all form fields as strings (including `commission_percentage: '0.875'`) alongside the explicitly-typed overrides, causing potential type conflicts.

---

## Round 2 Phase A — Database Migration (Executed)

### A5: `drop_pipeline_items_stage_check_constraint`
```sql
ALTER TABLE public.pipeline_items DROP CONSTRAINT IF EXISTS pipeline_items_stage_check;
```
Stages are now dynamic per-industry (managed via `industry_pipeline_stages` / `organization_pipeline_stages` tables). No hardcoded CHECK needed.

**Verification:** `SELECT conname FROM pg_constraint WHERE conrelid = 'public.pipeline_items'::regclass AND contype = 'c';` returns only `pipeline_items_final_status_check` and `pipeline_items_probability_check`.

---

## Round 2 Phase B — Code Changes (Executed)

### B8: Fix formData spread in handleSubmit
**File:** `src/pages/pipeline/NewDealPage.tsx`

Replaced `...formData` spread in `createDeal()` call with explicit field-by-field passing with proper type coercion:

```typescript
await createDeal({
    title: formData.title.trim(),
    customer_id: formData.customer_id,
    value: parseFloat(formData.value),
    currency: formData.currency,
    stage: formData.stage,
    probability: parseFloat(formData.probability) || 0,
    expected_close_date: formData.expected_close_date || undefined,
    source: formData.source,
    revenue_type: formData.revenue_type,
    recurring_interval: formData.revenue_type === 'recurring' ? formData.recurring_interval : undefined,
    description: formData.description || undefined,
    tags: formData.tags,
    lender_id: formData.lender_id || undefined,
    commission_percentage: parseFloat(formData.commission_percentage) || 0,
    volume_commission_percentage: parseFloat(formData.volume_commission_percentage) || 0,
});
```

### B9: Commission auto-fill styling
**File:** `src/pages/pipeline/NewDealPage.tsx`

Added helpers above the JSX return:
```typescript
const selectedLender = lenders.find(l => l.id === formData.lender_id);
const isCommissionFromLender = selectedLender &&
    formData.commission_percentage === selectedLender.default_commission_pct?.toString();
const isVolumeFromLender = selectedLender &&
    formData.volume_commission_percentage === selectedLender.default_volume_commission_pct?.toString();
```

Changes:
- Commission % input: conditional `text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20` when value matches lender defaults
- Volume Bonus % input: same conditional styling
- Hint text below lender selector: "Commission rates auto-filled from {lenderName} defaults" in blue

### B10: Projected commission in Forecast Summary widget
**File:** `src/pages/pipeline/NewDealPage.tsx`

Expanded the Forecast Summary widget (sidebar) to show commission projections for mortgage_broker:
- **Projected Commission** line with percentage and green-300 text
- **Volume Bonus** line with percentage and blue-300 text (only when > 0)
- **Total Earnings** line summing both commissions in green-200 bold text
- All commission lines only appear when `isMortgage && commission_percentage > 0`
- Non-mortgage industries see only Projected Value and Weighted Value (unchanged)

---

## Round 2 Build Status

```
npm run build → SUCCESS (0 errors, 14.96s)
```

---

## Round 2 Verification Checklist

- [x] DB: `pipeline_items_stage_check` constraint dropped (dynamic stages work)
- [x] DB: Tasks table has all scheduling columns (confirmed: start_time, end_time, duration, type, outcome, show_on_calendar, due_time)
- [x] Code: handleSubmit passes explicit typed fields (no `...formData` spread)
- [x] Code: Commission inputs show blue tint when values match lender defaults
- [x] Code: Hint text shows below lender selector when lender selected
- [x] Code: Forecast Summary shows Projected Commission, Volume Bonus, Total Earnings (mortgage_broker only)
- [x] Build passes with 0 errors

---

## Gemini Prompts (for reference — all changes already executed by Claude)

Below are the phased prompts that would be used for Gemini execution. Since Claude executed all changes directly, these serve as documentation.

### Global Guardrails

```
GLOBAL GUARDRAILS — apply to every phase:
- Project: C:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM
- Framework: React + TypeScript + Vite + Tailwind
- Backend: Supabase (Postgres + Auth + RLS)
- State: Zustand stores
- CRITICAL: organizationStore uses direct fetch() not supabase.from() (AbortController bug)
- Dark mode: All UI must support dark mode (dark: prefixed Tailwind classes)
- DO NOT restructure, rename, or delete existing files not listed
- DO NOT change imports that already work
- Every phase must end with: npm run build (0 errors)
- Use existing utilities: usePageLabels(), useOrganizationStore, PhoneInput, etc.
```

### Prompt B8: Fix formData spread in handleSubmit

```
TASK: The handleSubmit function in NewDealPage.tsx uses ...formData spread which sends ALL form fields as strings into createDeal(), causing type conflicts. Replace with explicit field-by-field passing.

FILE: src/pages/pipeline/NewDealPage.tsx

EXACT CHANGE — Replace the createDeal() call inside handleSubmit (the ...formData spread block) with:

await createDeal({
    title: formData.title.trim(),
    customer_id: formData.customer_id,
    value: parseFloat(formData.value),
    currency: formData.currency,
    stage: formData.stage,
    probability: parseFloat(formData.probability) || 0,
    expected_close_date: formData.expected_close_date || undefined,
    source: formData.source,
    revenue_type: formData.revenue_type,
    recurring_interval: formData.revenue_type === 'recurring' ? formData.recurring_interval : undefined,
    description: formData.description || undefined,
    tags: formData.tags,
    lender_id: formData.lender_id || undefined,
    commission_percentage: parseFloat(formData.commission_percentage) || 0,
    volume_commission_percentage: parseFloat(formData.volume_commission_percentage) || 0,
});

Key: Remove ...formData spread entirely. Explicitly pass each field with proper types (parseFloat for numbers, || undefined for optional strings).

FILES NOT TO TOUCH: dealStore.ts, lenderStore.ts, LenderDirectory.tsx
VERIFICATION: npm run build passes. Create an application → no 400 error from type mismatches.
```

### Prompt B9: Commission auto-fill styling

```
TASK: When a lender is selected and commission % fields auto-populate from lender defaults, show the values in normal dark text color with a subtle blue tint (not light grey placeholder). The tint should disappear when user edits the value away from the lender default.

FILE: src/pages/pipeline/NewDealPage.tsx

CHANGES:

1. Add helper variables ABOVE the handleSubmit function (after handleQuickAddLender):

const selectedLender = lenders.find(l => l.id === formData.lender_id);
const isCommissionFromLender = selectedLender &&
    formData.commission_percentage === selectedLender.default_commission_pct?.toString();
const isVolumeFromLender = selectedLender &&
    formData.volume_commission_percentage === selectedLender.default_volume_commission_pct?.toString();

2. Add hint text below the lender selector's closing </div>, inside the Lender field block:

{selectedLender && (
    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
        Commission rates auto-filled from {selectedLender.name} defaults
    </p>
)}

3. Update Commission % input className from:
className={inputClasses}
to:
className={`${inputClasses} ${isCommissionFromLender ? 'text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20' : ''}`}

4. Update Volume Bonus % input className from:
className={inputClasses}
to:
className={`${inputClasses} ${isVolumeFromLender ? 'text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20' : ''}`}

FILES NOT TO TOUCH: dealStore.ts, lenderStore.ts, LenderDirectory.tsx
VERIFICATION: npm run build passes. Select a lender with defaults → commission fields show values in dark text with subtle blue tint. Edit the value → tint disappears.
```

### Prompt B10: Projected commission in Forecast Summary

```
TASK: The Forecast Summary sidebar widget currently shows only "Projected Value" and "Weighted Value". For mortgage_broker, add "Projected Commission", "Volume Bonus", and "Total Earnings" lines.

FILE: src/pages/pipeline/NewDealPage.tsx

EXACT CHANGE — Find the Forecast Summary widget (the div with "bg-gradient-to-br from-primary-600 to-primary-700") and add the following AFTER the "Weighted Value" div, inside the same space-y-4 container:

{isMortgage && parseFloat(formData.commission_percentage) > 0 && (
    <>
        <div className="flex justify-between items-end border-t border-white/20 pt-3">
            <span className="text-xs opacity-80">Projected Commission ({formData.commission_percentage}%)</span>
            <span className="text-lg font-semibold text-green-300">
                ${((parseFloat(formData.value || '0') * (parseFloat(formData.commission_percentage) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
        {parseFloat(formData.volume_commission_percentage) > 0 && (
            <div className="flex justify-between items-end">
                <span className="text-xs opacity-80">Volume Bonus ({formData.volume_commission_percentage}%)</span>
                <span className="text-sm font-medium text-blue-300">
                    +${((parseFloat(formData.value || '0') * (parseFloat(formData.volume_commission_percentage) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        )}
        <div className="flex justify-between items-end border-t border-white/20 pt-3">
            <span className="text-xs font-bold opacity-90">Total Earnings</span>
            <span className="text-xl font-bold text-green-200">
                ${(
                    ((parseFloat(formData.value || '0') * (parseFloat(formData.commission_percentage) || 0) / 100)) +
                    ((parseFloat(formData.value || '0') * (parseFloat(formData.volume_commission_percentage) || 0) / 100))
                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    </>
)}

NOTE: isMortgage is already defined in the component as:
const isMortgage = currentOrganization?.industry_template === 'mortgage_broker';

FILES NOT TO TOUCH: dealStore.ts, everything except NewDealPage.tsx
VERIFICATION: npm run build passes. On mortgage_broker, enter value $400,000 with 0.875% commission and 0.25% volume → Forecast Summary shows: Projected Commission $3,500.00, Volume Bonus +$1,000.00, Total Earnings $4,500.00. Non-mortgage industries see only Projected Value and Weighted Value.
```

---

## Complete File Change Summary (Both Rounds)

| File | Round | Changes |
|------|-------|---------|
| `src/components/shared/QuickAddCustomerModal.tsx` | R1 | PhoneInput swap |
| `src/components/settings/ProfileTab.tsx` | R1 | PhoneInput swap |
| `src/stores/taskStore.ts` | R1 | Fix status, priority, scheduling fields |
| `src/stores/lenderStore.ts` | R1 | NEW — Zustand CRUD store for lenders |
| `src/stores/dealStore.ts` | R1 | Lender/commission fields in Deal interface and createDeal |
| `src/pages/pipeline/NewDealPage.tsx` | R1+R2 | Lender UI, commission fields, handleSubmit fix, commission styling, forecast summary |
| `src/components/mortgage/LenderDirectory.tsx` | R1 | Full CRUD form replacing placeholder |

## Complete Migration Summary (Both Rounds)

| Migration | Round | Description |
|-----------|-------|-------------|
| `add_task_scheduling_columns` | R1 | 7 columns on `tasks` |
| `add_lender_default_commission_columns` | R1 | 2 columns on `lenders` |
| `add_pipeline_lender_commission_columns` | R1 | 5 columns + index on `pipeline_items` |
| `expand_lender_rls_all_members` | R1 | Org-wide lender CRUD RLS |
| `drop_pipeline_items_stage_check_constraint` | R2 | Removed restrictive stage CHECK |
