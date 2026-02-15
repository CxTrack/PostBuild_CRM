# GEMINI TASK 1: Full Pipeline Item Creation Page + Industry-Specific Title Suggestions

## DIRECTORY
```
c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM
```

## BRANCH
```
CRM-Template-Configuration
```

## OVERVIEW
Currently, both the "New Application" button AND the "Add Your First Application" button in Pipeline.tsx just open the QuickAddDealModal. We need:

1. A **full-page form** at `/dashboard/pipeline/new` for in-depth deal/application creation
2. **Industry-specific title suggestions** as a dropdown/combobox in BOTH the QuickAdd modal AND the new full page
3. The QuickAdd modal placeholder `e.g. "New website project"` must be replaced with dynamic industry-specific text
4. The "New [Entity]" button (blue, top-right) should navigate to the full page; "Quick Add" (green) keeps opening the modal

---

## TASK A: Add industry-specific title suggestions to `modules.config.ts`

**File:** `src/config/modules.config.ts`

Add a new `titleSuggestions` field to the pipeline section of `DEFAULT_PAGE_LABELS` and each industry's `PAGE_LABELS.pipeline`. These are common industry-standard titles users would pick from. Also add a `titlePlaceholder` field.

### Add to `DEFAULT_PAGE_LABELS.pipeline` (around line 308):
```typescript
pipeline: {
  // ... existing fields stay unchanged ...
  titlePlaceholder: 'e.g. "New sales opportunity"',
  titleSuggestions: [
    'New Sales Opportunity',
    'Service Agreement',
    'Product Sale',
    'Consulting Engagement',
    'Partnership Deal',
  ],
},
```

### Add to each industry's pipeline labels:

**mortgage_broker** (around line 555):
```typescript
titlePlaceholder: 'e.g. "Purchase - 123 Main St"',
titleSuggestions: [
  // Canada
  'Conventional Mortgage',
  'High-Ratio Mortgage',
  'CMHC Insured Purchase',
  'Refinance',
  'Home Equity Line of Credit (HELOC)',
  'Pre-Approval',
  'Mortgage Renewal',
  'Mortgage Transfer / Switch',
  'Private Mortgage',
  'Bridge Financing',
  'Construction Mortgage',
  'Reverse Mortgage',
  // US
  'FHA Loan',
  'VA Loan',
  'USDA Loan',
  'Conventional Loan',
  'Jumbo Loan',
  'ARM (Adjustable Rate)',
  'Fixed Rate Mortgage',
  'Cash-Out Refinance',
  'Rate-and-Term Refinance',
  'Home Equity Loan',
],
```

**real_estate** (around line 678):
```typescript
titlePlaceholder: 'e.g. "123 Oak Avenue - Listing"',
titleSuggestions: [
  'Residential Listing',
  'Buyer Representation',
  'Commercial Listing',
  'Condo Sale',
  'New Construction Sale',
  'Investment Property',
  'Land Sale',
  'Rental / Lease',
  'Property Management',
  'Short Sale',
  'Foreclosure',
],
```

**contractors_home_services** (around line 809):
```typescript
titlePlaceholder: 'e.g. "Kitchen Renovation - Smith"',
titleSuggestions: [
  'Kitchen Renovation',
  'Bathroom Remodel',
  'Basement Finishing',
  'Deck / Patio Build',
  'Roof Replacement',
  'HVAC Installation',
  'Plumbing Repair',
  'Electrical Work',
  'Painting (Interior)',
  'Painting (Exterior)',
  'Flooring Installation',
  'Window Replacement',
  'Landscaping',
  'Fence Installation',
],
```

**legal_services** (around line 946):
```typescript
titlePlaceholder: 'e.g. "Smith v. Jones - Personal Injury"',
titleSuggestions: [
  'Personal Injury Claim',
  'Family Law - Divorce',
  'Family Law - Custody',
  'Real Estate Closing',
  'Corporate Formation',
  'Contract Dispute',
  'Employment Law',
  'Immigration Application',
  'Criminal Defense',
  'Estate Planning / Will',
  'Trademark Registration',
  'Litigation',
],
```

**construction** (around line 1131):
```typescript
titlePlaceholder: 'e.g. "Riverside Commercial Build"',
titleSuggestions: [
  'Residential New Build',
  'Commercial Build',
  'Tenant Improvement',
  'Renovation / Remodel',
  'Addition',
  'Site Preparation',
  'Foundation Work',
  'Roofing Project',
  'Concrete Work',
  'Steel Erection',
  'Electrical Rough-In',
  'Plumbing Rough-In',
],
```

**gyms_fitness** (around line 1210):
```typescript
titlePlaceholder: 'e.g. "John D. - Premium Membership"',
titleSuggestions: [
  'Monthly Membership',
  'Annual Membership',
  'Personal Training Package',
  'Group Class Package',
  'Student Membership',
  'Family Membership',
  'Corporate Wellness',
  'Day Pass / Trial',
  'Online Coaching',
],
```

**software_development** (around line 1318):
```typescript
titlePlaceholder: 'e.g. "Mobile App - Acme Corp"',
titleSuggestions: [
  'Web Application',
  'Mobile App (iOS/Android)',
  'API Integration',
  'E-Commerce Platform',
  'CRM Customization',
  'Database Migration',
  'Cloud Infrastructure',
  'UI/UX Redesign',
  'Security Audit',
  'Maintenance Contract',
  'MVP Development',
],
```

**distribution_logistics** (around line 1405):
```typescript
titlePlaceholder: 'e.g. "Bulk Order - ABC Retail"',
titleSuggestions: [
  'Bulk Purchase Order',
  'Recurring Supply Order',
  'Drop Ship Order',
  'Wholesale Distribution',
  'Import Shipment',
  'Export Shipment',
  'Warehouse Transfer',
  'Custom Fulfillment',
  'Returns / RMA',
],
```

**tax_accounting** (if pipeline exists for this industry, add):
```typescript
titlePlaceholder: 'e.g. "2025 Personal Tax Return - Smith"',
titleSuggestions: [
  'Personal Tax Return',
  'Corporate Tax Return',
  'T1 General (Canada)',
  'T2 Corporate (Canada)',
  '1040 Individual (US)',
  '1120 Corporate (US)',
  'Bookkeeping Setup',
  'Payroll Setup',
  'GST/HST Filing',
  'Sales Tax Filing',
  'Financial Statement Preparation',
  'Tax Planning Consultation',
],
```

### Also update the `PageLabels` interface:

Find the `PageLabels` interface (search for `interface PageLabels` or `export interface PageLabels`) and add:
```typescript
titlePlaceholder?: string;
titleSuggestions?: string[];
```

And update the `getPageLabels()` function to merge these new fields (it should already handle this via spread, but verify).

---

## TASK B: Update QuickAddDealModal to use dynamic placeholder + title dropdown

**File:** `src/components/pipeline/QuickAddDealModal.tsx`

### Change 1: Replace hardcoded placeholder (line 130)
```typescript
// BEFORE:
placeholder={`e.g. "New website project"`}

// AFTER:
placeholder={labels.titlePlaceholder || `e.g. "New ${labels.entitySingular}"`}
```

### Change 2: Add title suggestion dropdown
Convert the title input into a combobox. When the user focuses on the Title field, show a dropdown of `labels.titleSuggestions`. The user can either pick a suggestion or type freely.

Replace the Title section (lines 120-133) with:
```tsx
{/* Title with suggestions */}
<div className="relative">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Title <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    value={formData.title}
    onChange={(e) => {
      setFormData({ ...formData, title: e.target.value });
      setShowSuggestions(true);
    }}
    onFocus={() => setShowSuggestions(true)}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
    className={inputClasses}
    placeholder={labels.titlePlaceholder || `e.g. "New ${labels.entitySingular}"`}
    autoFocus
    autoComplete="off"
  />
  {showSuggestions && labels.titleSuggestions && labels.titleSuggestions.length > 0 && (
    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
      {labels.titleSuggestions
        .filter(s => !formData.title || s.toLowerCase().includes(formData.title.toLowerCase()))
        .map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setFormData({ ...formData, title: suggestion });
              setShowSuggestions(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors first:rounded-t-xl last:rounded-b-xl"
          >
            {suggestion}
          </button>
        ))}
    </div>
  )}
</div>
```

Add `showSuggestions` state:
```typescript
const [showSuggestions, setShowSuggestions] = useState(false);
```

### Change 3: Also update the "Customer" label to use labels
Line 137-138, change:
```typescript
// BEFORE:
Customer <span className="text-red-500">*</span>

// AFTER:
{labels.columns?.customer || 'Customer'} <span className="text-red-500">*</span>
```

And line 145, change:
```typescript
// BEFORE:
<option value="">Select a customer...</option>

// AFTER:
<option value="">Select a {(labels.columns?.customer || 'customer').toLowerCase()}...</option>
```

---

## TASK C: Create Full Pipeline Item Creation Page

**New File:** `src/pages/pipeline/NewDealPage.tsx`

This is an in-depth form page with multiple sections. It uses the SAME `dealStore.createDeal()` method and the SAME `pipeline_items` table. The form should include ALL fields the `pipeline_items` table supports:

**DB columns available:** id, organization_id, customer_id, assigned_to, stage, title, description, value, probability, expected_close_date, final_status, lost_reason, tags, metadata, created_by, quote_id, currency, weighted_value, actual_close_date, source, revenue_type, recurring_interval, products

### Page Structure:
```
┌──────────────────────────────────────────────────┐
│ ← Back to [Pipeline Label]                       │
│                                                   │
│ New [Entity Singular]                             │
│ Fill in the details to create a new [entity]      │
├──────────────────────────────────────────────────┤
│ SECTION 1: Basic Information                      │
│ ┌─────────────────┬─────────────────────────┐    │
│ │ Title *         │ [combobox with           │    │
│ │                 │  titleSuggestions]        │    │
│ ├─────────────────┼─────────────────────────┤    │
│ │ [Customer] *    │ [dropdown + add new btn] │    │
│ ├─────────────────┼─────────────────────────┤    │
│ │ Description     │ [textarea]               │    │
│ └─────────────────┴─────────────────────────┘    │
│                                                   │
│ SECTION 2: Value & Stage                          │
│ ┌──────────┬──────────┬──────────┬──────────┐    │
│ │ Value *  │ Currency │ Stage *  │Probability│    │
│ └──────────┴──────────┴──────────┴──────────┘    │
│                                                   │
│ SECTION 3: Timeline                               │
│ ┌────────────────────┬───────────────────────┐   │
│ │ Expected Close Date│ Source                │   │
│ └────────────────────┴───────────────────────┘   │
│                                                   │
│ SECTION 4: Revenue Model                          │
│ ┌────────────────────┬───────────────────────┐   │
│ │ Revenue Type       │ Recurring Interval    │   │
│ │ (one_time/recurring│ (if recurring)         │   │
│ └────────────────────┴───────────────────────┘   │
│                                                   │
│ SECTION 5: Tags & Notes                           │
│ ┌────────────────────────────────────────────┐   │
│ │ Tags (pill input)                           │   │
│ ├────────────────────────────────────────────┤   │
│ │ Additional Notes (rich textarea)            │   │
│ └────────────────────────────────────────────┘   │
│                                                   │
│              [Cancel]  [Create [Entity]]          │
└──────────────────────────────────────────────────┘
```

### Key requirements:
1. Use `usePageLabels('pipeline')` for ALL user-facing text
2. Include the same title combobox with `labels.titleSuggestions`
3. Source dropdown options: `referral`, `website`, `cold_call`, `advertising`, `partner`, `social_media`, `trade_show`, `other`
4. Revenue type: `one_time` or `recurring`
5. If recurring, show interval dropdown: `monthly`, `quarterly`, `annual`
6. Tags: pill/chip input where user types and presses Enter to add
7. Currency defaults to org currency or 'USD'
8. On submit, call `dealStore.createDeal()` then `navigate('/dashboard/pipeline')`
9. Use the org hydration pattern:
```typescript
const { currentOrganization } = useOrganizationStore();
if (!currentOrganization) return <LoadingSpinner />;
```
10. Match the existing app's styling: rounded-xl, dark mode support, same input classes

### Source label dropdown should also be industry-specific. Add `sourceOptions` to PAGE_LABELS:

**DEFAULT:**
```typescript
sourceOptions: ['Referral', 'Website', 'Cold Call', 'Advertising', 'Partner', 'Social Media', 'Trade Show', 'Other'],
```

**mortgage_broker:**
```typescript
sourceOptions: ['Referral', 'Realtor Partner', 'Website', 'Walk-In', 'Social Media', 'MLS Listing', 'Builder Partnership', 'Financial Advisor', 'Repeat Client', 'Other'],
```

**real_estate:**
```typescript
sourceOptions: ['Referral', 'Open House', 'MLS', 'Website', 'Social Media', 'Sign Call', 'Cold Call', 'Door Knock', 'Sphere of Influence', 'Other'],
```

**contractors_home_services:**
```typescript
sourceOptions: ['Referral', 'Google / SEO', 'HomeStars / Angi', 'Social Media', 'Yard Sign', 'Repeat Client', 'Walk-In', 'Partner', 'Other'],
```

(Add sensible defaults for all other industries too.)

---

## TASK D: Add Route + Wire Up Navigation

### File: `src/App.tsx`

Add after line 122:
```typescript
<Route path="pipeline/new" element={<NewDealPage />} />
```

Add import at top:
```typescript
import NewDealPage from './pages/pipeline/NewDealPage';
```

### File: `src/pages/Pipeline.tsx`

**Change the blue "New [Entity]" button (line 432-438) to navigate instead of opening modal:**
```typescript
// BEFORE (line 433):
onClick={() => setShowQuickAdd(true)}

// AFTER:
onClick={() => navigate('/dashboard/pipeline/new')}
```

**Change the "Add Your First [Entity]" button in empty state (line 549-559) to also navigate:**
```typescript
// BEFORE (line 550):
onClick={() => setShowQuickAdd(true)}

// AFTER:
onClick={() => navigate('/dashboard/pipeline/new')}
```

The green "Quick Add" buttons stay as-is (opening the modal).

---

## TASK E: Update PageLabels TypeScript Interface

Find where `PageLabels` interface is defined (likely in `modules.config.ts` or a types file) and add:
```typescript
titlePlaceholder?: string;
titleSuggestions?: string[];
sourceOptions?: string[];
```

---

## VERIFICATION CHECKLIST
- [ ] `npm run build` succeeds with zero errors
- [ ] All 11 industries have `titleSuggestions`, `titlePlaceholder`, and `sourceOptions` in their pipeline labels (or fall back to DEFAULT_PAGE_LABELS)
- [ ] QuickAdd modal shows filtered title suggestions dropdown
- [ ] QuickAdd modal placeholder is dynamic, not "New website project"
- [ ] "New [Entity]" button navigates to `/dashboard/pipeline/new`
- [ ] "Quick Add" button still opens modal
- [ ] "Add Your First [Entity]" empty state button navigates to full page
- [ ] Full page form creates deal via `dealStore.createDeal()` and redirects back to pipeline
- [ ] Full page uses `usePageLabels('pipeline')` for ALL text
- [ ] Dark mode works on new page
- [ ] No hardcoded strings for entity names, customer labels, etc.

## DEPLOY
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build
git add src/config/modules.config.ts src/components/pipeline/QuickAddDealModal.tsx src/pages/pipeline/NewDealPage.tsx src/pages/Pipeline.tsx src/App.tsx
git commit -m "feat: add full pipeline creation page with industry-specific title suggestions"
git push origin CRM-Template-Configuration
```
