# GEMINI TASK 9: Expense Line Items — Display, Edit & Save

## STRICT RULES
1. Only modify the files listed below — do NOT create new files
2. Run `npm run build` after ALL changes — must pass with zero errors
3. Do NOT change the modal header, ReceiptUpload, AI processing logic, or accordion toggle (those were done in Tasks 7 & 8)
4. Do NOT add any new npm packages
5. Do NOT change any existing store methods — only ADD new ones
6. Do NOT modify the `expense_line_items` table schema (already created)
7. Commit message format: `feat: editable expense line items with AI auto-populate and DB persistence`

---

## GLOBAL GUARDRAILS
- **AbortController Bug**: `organizationStore.ts` uses direct `fetch()` not `supabase.from()`. Other stores are fine using supabase client.
- **Theme Classes**: Always include `dark:` Tailwind variants
- **Build Check**: Must pass `npm run build` with zero TypeScript errors
- **DB Table**: `expense_line_items` columns: `id` (uuid auto), `expense_id` (uuid FK), `description` (text NOT NULL), `quantity` (numeric default 1), `unit_price` (numeric default 0), `amount` (numeric default 0), `created_at` (timestamptz)
- **Existing imports**: `supabase` is imported from `@/lib/supabase` in both files

---

## CONTEXT

Tasks 7 & 8 restructured ExpenseModal with:
- Receipt upload zone at the top
- AI processing that calls `receipt-scan` Edge Function
- `applyAiData()` that populates form fields from AI result
- `aiResult` contains an `items` array: `Array<{ description, quantity, unit_price, amount }>`
- Manual form inside an accordion
- State variables: `aiResult`, `aiProcessing`, `aiError`, `accordionOpen`

This task adds:
1. A `saveLineItems` method to `expenseStore.ts`
2. A `lineItems` state array in ExpenseModal
3. An editable line items table rendered inside the accordion (below the form fields)
4. Wires `handleSubmit` to save line items after the expense is created/updated

---

## FILES TO MODIFY

1. `src/stores/expenseStore.ts` — Add `saveLineItems` and `fetchLineItems` methods
2. `src/components/financials/ExpenseModal.tsx` — Add line items state, UI table, and save wiring

---

## SUB-TASK A: Add Line Item Methods to `expenseStore.ts`

**File:** `src/stores/expenseStore.ts`

### A1. Add import for ExpenseLineItem type

Find line 3:
```typescript
import type { Expense, ExpenseCategory } from '../types/app.types';
```

**Replace with:**
```typescript
import type { Expense, ExpenseCategory, ExpenseLineItem } from '../types/app.types';
```

### A2. Add new methods to the interface

Find the interface (lines 5-16). Add these two methods before the closing `}`:

After the line:
```typescript
    createCategory: (category: Omit<ExpenseCategory, 'id' | 'created_at'>) => Promise<ExpenseCategory | null>;
```

**Add:**
```typescript
    saveLineItems: (expenseId: string, items: Array<{ description: string; quantity: number; unit_price: number; amount: number }>) => Promise<void>;
    fetchLineItems: (expenseId: string) => Promise<ExpenseLineItem[]>;
```

### A3. Add `saveLineItems` method

After the `createCategory` method's closing `}` and before the store's final `}));`, add:

```typescript
    saveLineItems: async (expenseId, items) => {
        try {
            // Delete existing line items for this expense
            await supabase.from('expense_line_items').delete().eq('expense_id', expenseId);

            if (items.length === 0) return;

            // Insert new line items
            const rows = items.map(item => ({
                expense_id: expenseId,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.amount,
            }));

            const { error } = await supabase.from('expense_line_items').insert(rows);
            if (error) throw error;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save line items';
            console.error('saveLineItems error:', message);
        }
    },

    fetchLineItems: async (expenseId) => {
        try {
            const { data, error } = await supabase
                .from('expense_line_items')
                .select('*')
                .eq('expense_id', expenseId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('fetchLineItems error:', error);
            return [];
        }
    },
```

---

## SUB-TASK B: Add Line Items State & UI to ExpenseModal

**File:** `src/components/financials/ExpenseModal.tsx`

### B1. Add Trash2 icon import

Find the lucide-react import line (should include `ChevronDown, ChevronUp` etc. from Task 7). Add `Trash2` to the import list.

**Example — find:**
```tsx
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage, ChevronDown, ChevronUp, Camera, Upload, Sparkles, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
```

**Replace with:**
```tsx
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage, ChevronDown, ChevronUp, Camera, Upload, Sparkles, CheckCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
```

### B2. Add line items state variable

After the existing state declarations (`aiError` state line from Task 7), add:

```tsx
const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unit_price: number; amount: number }>>([]);
```

### B3. Destructure new store methods

Find where `useExpenseStore` is destructured:
```tsx
const { categories, fetchCategories, createExpense, updateExpense } = useExpenseStore();
```

**Replace with:**
```tsx
const { categories, fetchCategories, createExpense, updateExpense, saveLineItems, fetchLineItems } = useExpenseStore();
```

### B4. Load existing line items when editing

In the `useEffect` that runs when the modal opens (`if (isOpen)` block), inside the `if (expense)` branch, **after** `setFormData(expense);`, add:

```tsx
                // Load existing line items
                fetchLineItems(expense.id).then(items => {
                    setLineItems(items.map(li => ({
                        description: li.description,
                        quantity: Number(li.quantity),
                        unit_price: Number(li.unit_price),
                        amount: Number(li.amount),
                    })));
                });
```

In the `else` branch (new expense), add after the `setFormData({...})` call:

```tsx
                setLineItems([]);
```

### B5. Populate line items from AI result in `applyAiData`

Find the `applyAiData` function (added in Task 8). At the end of the function body, **before** the closing `};`, add:

```tsx
    // Populate line items from AI scan
    if (result.items && result.items.length > 0) {
        setLineItems(result.items.map(item => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            amount: item.amount || 0,
        })));
    }
```

### B6. Add line item helper functions

After the `processReceipt` function (from Task 8), add:

```tsx
const updateLineItem = (index: number, field: string, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        // Auto-calculate amount when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
            updated.amount = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
    }));
};

const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
};
```

### B7. Render line items table inside the accordion

Inside the accordion's `{accordionOpen && (...)}` block, find the closing `</div>` of the grid (the one that closes `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">`).

**After** that closing `</div>` but still inside the accordion's `<div className="px-6 pb-6 space-y-6">`, add:

```tsx
                    {/* Line Items Table */}
                    {lineItems.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Itemized Expenses ({lineItems.length} items)
                            </label>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                    <div className="col-span-5">Item</div>
                                    <div className="col-span-2 text-right">Qty</div>
                                    <div className="col-span-2 text-right">Price</div>
                                    <div className="col-span-2 text-right">Amount</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {/* Rows */}
                                {lineItems.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-700/50 items-center">
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                                                className="w-full px-2 py-1 text-sm rounded-lg bg-transparent border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-rose-500 focus:border-transparent dark:text-white"
                                                placeholder="Item name"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                step="1"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value || '1'))}
                                                className="w-full px-2 py-1 text-sm text-right rounded-lg bg-transparent border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-rose-500 focus:border-transparent dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value || '0'))}
                                                className="w-full px-2 py-1 text-sm text-right rounded-lg bg-transparent border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-rose-500 focus:border-transparent dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-medium text-gray-900 dark:text-white py-1">
                                            ${item.amount.toFixed(2)}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLineItem(idx)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {/* Subtotal */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="col-span-9 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                                        Subtotal:
                                    </div>
                                    <div className="col-span-2 text-right text-sm font-bold text-rose-600 dark:text-rose-400">
                                        ${lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                                    </div>
                                    <div className="col-span-1"></div>
                                </div>
                            </div>
                        </div>
                    )}
```

### B8. Wire handleSubmit to save line items

Find the `handleSubmit` function. The current create path (after Task 8) looks approximately like:

```tsx
await createExpense({
    ...formData as any,
    organization_id: currentOrganization.id,
    ai_processed: !!aiResult,
});
```

**Replace the create block with:**
```tsx
const newExpense = await createExpense({
    ...formData as any,
    organization_id: currentOrganization.id,
    ai_processed: !!aiResult,
});
// Save line items if any
if (newExpense?.id && lineItems.length > 0) {
    await saveLineItems(newExpense.id, lineItems);
}
```

For the update path, find:
```tsx
await updateExpense(expense.id, { ...formData, ai_processed: !!aiResult });
```

**Replace with:**
```tsx
await updateExpense(expense.id, { ...formData, ai_processed: !!aiResult });
// Save line items (replaces existing)
if (lineItems.length > 0) {
    await saveLineItems(expense.id, lineItems);
}
```

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. Start dev server and test:
   - **Upload a receipt with multiple items:**
     - AI scans → form auto-fills
     - Line items table appears inside accordion with all items
     - Each row shows: description, qty, unit price, calculated amount
     - Edit a quantity → amount auto-recalculates
     - Remove an item → row disappears
     - Subtotal updates dynamically
     - Save → expense saved + line items saved to `expense_line_items` table
   - **Manual entry (no receipt):**
     - No line items table shown (since `lineItems` array is empty)
     - Form works as before
   - **Edit existing expense with line items:**
     - Open edit modal → accordion starts open
     - Line items loaded from DB and displayed
     - Can edit/remove items → save → DB updated
   - **Edit existing expense without line items:**
     - No line items section shown
3. Verify in Supabase Table Editor:
   - After saving an AI-scanned expense, check `expense_line_items` table
   - Rows should have correct `expense_id`, description, quantity, unit_price, amount
   - After editing and saving again, old rows replaced with new ones

---

## FILES MODIFIED SUMMARY

| File | Changes |
|------|---------|
| `src/stores/expenseStore.ts` | Added `ExpenseLineItem` import, `saveLineItems()` method (delete + insert), `fetchLineItems()` method, updated interface |
| `src/components/financials/ExpenseModal.tsx` | Added `Trash2` icon import, `lineItems` state, destructured new store methods, load line items on edit, populate from AI result, `updateLineItem()`/`removeLineItem()` helpers, editable table UI with subtotal, wired `handleSubmit` to save line items |
