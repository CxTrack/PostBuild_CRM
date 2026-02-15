# GEMINI TASK 4: Modal Fixes + UX Polish

## STRICT RULES
1. Only modify the files listed below — do NOT create new files
2. Use exact line numbers provided — verify them before editing
3. Run `npm run build` after ALL changes — must pass with zero errors
4. Do NOT remove or change any existing functionality
5. Do NOT hardcode user-facing strings
6. Commit message format: `fix: customer modal scroll + emoji + address fields + earnings button`

---

## CONTEXT
Multiple UX issues found during testing:
1. The Customer/Borrower modal is cut off on smaller screens — the Save button is not visible
2. A broken emoji character appears at the bottom of the Customer modal
3. The same broken emoji exists in AddressAutocomplete.tsx
4. The Customer modal is missing optional address fields (DB already supports them)
5. The Earnings page "New Transaction" button should say "Add Expense" and be red to match the ExpenseModal

---

## SUB-TASK A: Fix CustomerModal Scroll Cutoff

**File:** `src/components/customers/CustomerModal.tsx`

The modal container at line 153 has no max-height or overflow, so on smaller screens the Save button at the bottom (lines 370-383) gets cut off.

### A1. Add flex-col + max-height to modal container (line 153)

**Current:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
```

**Replace with:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
```

### A2. Make the form body scrollable (line 182)

Find the `<form>` tag (approximately line 182, after the header and error display):

**Current:**
```tsx
<form onSubmit={handleSubmit} className="p-6 space-y-5">
```

**Replace with:**
```tsx
<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
```

**Why:** The `flex-1` makes the form take remaining space, `overflow-y-auto` enables scrolling. The header and footer stay fixed in place thanks to the `flex-col` on the parent.

---

## SUB-TASK B: Fix Broken Emoji Characters

### B1. Fix in CustomerModal.tsx (line 355)

**File:** `src/components/customers/CustomerModal.tsx`

**Current (approximately line 355):**
```tsx
<span className="mr-1">ðŸ'¡</span>
```

**Replace with:**
```tsx
<span className="mr-1">💡</span>
```

If the JSX file encoding doesn't support direct emoji, use:
```tsx
<span className="mr-1">{'\u{1F4A1}'}</span>
```

### B2. Fix in AddressAutocomplete.tsx (line 345)

**File:** `src/components/ui/AddressAutocomplete.tsx`

**Current (approximately line 345):**
```tsx
ðŸ'¡ Address autocomplete requires Google Places API. Add your API key to enable this feature.
```

**Replace the entire line content with:**
```tsx
💡 Address autocomplete requires Google Places API. Add your API key to enable this feature.
```

Or use the Unicode escape if encoding is an issue:
```tsx
{'\u{1F4A1}'} Address autocomplete requires Google Places API. Add your API key to enable this feature.
```

---

## SUB-TASK C: Add Optional Address Fields to CustomerModal

**File:** `src/components/customers/CustomerModal.tsx`

The `customers` database table already has columns: `address`, `city`, `state`, `postal_code`, `country`. The TypeScript `Customer` interface already includes these fields. We only need to add the frontend form fields.

### C1. Add import for AddressAutocomplete (top of file, after line 3)

**After the existing imports (around line 3-8), add:**
```tsx
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
```

**Also update the existing lucide import on line 3** — add `MapPin`, `ChevronDown`, `ChevronUp` to the import if they aren't there. If they conflict with the new import line, merge them into the existing import.

### C2. Add address fields to formData state (lines 23-32)

**Current:**
```tsx
const [formData, setFormData] = useState({
    customer_type: customer?.customer_type || 'personal',
    first_name: customer?.first_name || '',
    middle_name: customer?.middle_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    status: customer?.status || 'Active',
});
```

**Replace with:**
```tsx
const [formData, setFormData] = useState({
    customer_type: customer?.customer_type || 'personal',
    first_name: customer?.first_name || '',
    middle_name: customer?.middle_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    status: customer?.status || 'Active',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || '',
});
const [showAddress, setShowAddress] = useState(
    Boolean(customer?.address || customer?.city || customer?.state || customer?.postal_code)
);
```

### C3. Add address fields to the useEffect reset (lines 34-47)

**Current:**
```tsx
useEffect(() => {
    if (customer) {
      setFormData({
        customer_type: customer.customer_type || 'personal',
        first_name: customer.first_name || '',
        middle_name: customer.middle_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        status: customer.status || 'Active',
      });
    }
}, [customer]);
```

**Replace with:**
```tsx
useEffect(() => {
    if (customer) {
      setFormData({
        customer_type: customer.customer_type || 'personal',
        first_name: customer.first_name || '',
        middle_name: customer.middle_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        status: customer.status || 'Active',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postal_code: customer.postal_code || '',
        country: customer.country || '',
      });
      setShowAddress(Boolean(customer.address || customer.city || customer.state || customer.postal_code));
    }
}, [customer]);
```

### C4. Add address section to the form UI

**After the Status `</div>` (approximately line 351), and BEFORE the tip text `<div>` (approximately line 353), insert the following address section:**

```tsx
{/* Address Section - Collapsible */}
<div className="pt-2">
    <button
        type="button"
        onClick={() => setShowAddress(!showAddress)}
        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
    >
        <MapPin size={14} className="mr-1" />
        {showAddress ? 'Hide Address' : 'Add Address'}
        {showAddress ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
    </button>

    {showAddress && (
        <div className="mt-3 space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address
                </label>
                <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    onAddressSelect={(components: AddressComponents) => {
                        setFormData(prev => ({
                            ...prev,
                            address: components.address,
                            city: components.city,
                            state: components.state,
                            postal_code: components.postal_code,
                            country: components.country,
                        }));
                    }}
                    placeholder="Start typing an address..."
                    className=""
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                    </label>
                    <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State / Province
                    </label>
                    <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal / ZIP Code
                    </label>
                    <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country
                    </label>
                    <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Country"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                </div>
            </div>
        </div>
    )}
</div>
```

**Important:** These address fields are OPTIONAL — no validation is needed. The `handleSubmit` function already spreads `formData` into the create/update call, so the address fields will be saved automatically.

---

## SUB-TASK D: Fix Earnings "Add Expense" Button Text + Color

### D1. Fix button labels in modules.config.ts

**File:** `src/config/modules.config.ts`

Change ALL `financials.newButton` values across all industry templates to `'Add Expense'`:

**Line 440 (DEFAULT_PAGE_LABELS → financials):**
```
newButton: 'New Expense',
```
→ Change to:
```
newButton: 'Add Expense',
```

**Line 687 (mortgage_broker → financials):**
```
newButton: 'New Transaction',
```
→ Change to:
```
newButton: 'Add Expense',
```

**Line 1171 (tax_accounting → financials):**
```
newButton: 'New Expense',
```
→ Change to:
```
newButton: 'Add Expense',
```

**Line 1661 (distribution_logistics → financials):**
```
newButton: 'New Expense',
```
→ Change to:
```
newButton: 'Add Expense',
```

### D2. Change button color to red/danger variant

**File:** `src/pages/Financials.tsx`

**Current (line 77):**
```tsx
<Button variant="primary" onClick={() => setShowExpenseModal(true)} className="flex items-center">
```

**Replace with:**
```tsx
<Button variant="danger" onClick={() => setShowExpenseModal(true)} className="flex items-center">
```

**Why:** The `danger` variant renders a red button (line 242 of ThemeComponents.tsx: `bg-red-600 text-white hover:bg-red-700`), which matches the ExpenseModal's rose/pink gradient header. This creates visual consistency — the red button signals "expense" and matches the red modal.

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. Start dev server and test:
   - **CustomerModal:** Open the "New Customer/Borrower" modal on `/dashboard/customers`
     - Resize browser to small viewport (375px width) — modal should scroll, Save button visible
     - The lightbulb emoji renders correctly (not garbled characters)
     - Click "Add Address" — address fields expand with a nice animation
     - Type an address — Google Places suggestions appear (if API key is configured)
     - Select an address — city, state, postal code, country auto-fill
     - Click "Hide Address" — fields collapse
     - Create a customer with address — saves successfully
     - Edit that customer — address fields pre-populated and expanded
   - **Financials page:** Navigate to `/dashboard/financials`
     - Button says "Add Expense" (not "New Transaction")
     - Button is RED colored (not blue)
     - Click it — ExpenseModal opens with rose/pink header saying "Record Expense"
   - **AddressAutocomplete fallback:** When Google API is not loaded, the amber message shows a lightbulb emoji (not garbled text)
3. Test viewport responsiveness:
   - 375px (mobile) — all modals scroll correctly
   - 768px (tablet) — address fields in 2x2 grid
   - 1440px (desktop) — everything centered and proportioned

---

## FILES MODIFIED SUMMARY

| File | Changes |
|------|---------|
| `src/components/customers/CustomerModal.tsx` | Added `max-h-[90vh] overflow-hidden flex-col` to modal, `flex-1 overflow-y-auto` to form, fixed emoji, added collapsible address fields with AddressAutocomplete |
| `src/components/ui/AddressAutocomplete.tsx` | Fixed broken emoji in fallback message |
| `src/config/modules.config.ts` | Changed 4 financials `newButton` labels to `'Add Expense'` |
| `src/pages/Financials.tsx` | Changed button `variant="primary"` to `variant="danger"` |
