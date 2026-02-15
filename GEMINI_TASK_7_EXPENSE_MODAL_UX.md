# GEMINI TASK 7: ExpenseModal UX Redesign — Receipt-First Layout

## STRICT RULES
1. Only modify the file listed below — do NOT create new files
2. Use exact line numbers provided — verify them before editing
3. Run `npm run build` after ALL changes — must pass with zero errors
4. Do NOT remove or change the handleSubmit function (lines 74-96)
5. Do NOT remove or change the useEffect hooks (lines 40-70)
6. Do NOT change the modal header gradient (lines 101-109)
7. Do NOT change any import paths or store usage patterns
8. Keep the `max-h-[90vh] overflow-hidden flex flex-col` pattern on the Card
9. Keep the `flex-1 overflow-y-auto` on the scrollable area
10. Use `rounded-xl` for all elements, `rose-500/rose-600` as accent color
11. All UI must support dark mode using existing `dark:` Tailwind classes
12. Commit message format: `feat: receipt-first expense modal with accordion manual entry`

---

## GLOBAL GUARDRAILS
- **AbortController Bug**: `organizationStore.ts` uses direct `fetch()` not `supabase.from()`. Other stores (like expenseStore) are fine using supabase client.
- **Theme Classes**: Always include `dark:bg-gray-800`, `dark:text-white`, `dark:border-gray-700` etc. alongside light mode classes
- **Component Pattern**: Modals use `fixed inset-0 z-50` overlay + `Card` from ThemeComponents
- **Build Check**: Every phase ends with `npm run build` passing with zero TypeScript errors
- **Existing Utilities**: Use `lucide-react` icons, `react-hot-toast` for toasts, existing `Button`/`Card` from ThemeComponents

---

## CONTEXT

The current `ExpenseModal.tsx` (304 lines) shows a full form immediately when opened. The user wants a **receipt-first** experience:
- **Mobile**: Two prominent buttons ("Take Photo" + "Upload File") at the top. The manual form fields are hidden behind an accordion.
- **Desktop**: A drag-and-drop upload zone at the top. The manual form fields are behind an accordion.
- **Editing an existing expense**: The accordion starts OPEN (form pre-populated).
- **Creating a new expense**: The accordion starts CLOSED (receipt-first).

The existing `ReceiptUpload` component (`src/components/ui/ReceiptUpload.tsx`) already handles drag/drop + camera capture. We'll reuse it.

---

## FILE TO MODIFY

**File:** `src/components/financials/ExpenseModal.tsx`

---

## CHANGES

### Step 1: Update imports (line 2)

**Current:**
```tsx
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage } from 'lucide-react';
```

**Replace with:**
```tsx
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage, ChevronDown, ChevronUp, Camera, Upload, Sparkles, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
```

### Step 2: Add new state variables (after line 38, after `const [isSubmitting, setIsSubmitting] = useState(false);`)

**Add:**
```tsx
const [accordionOpen, setAccordionOpen] = useState(!!expense);
const [aiResult, setAiResult] = useState<any>(null);
const [aiProcessing, setAiProcessing] = useState(false);
const [aiError, setAiError] = useState<string | null>(null);
```

### Step 3: Reset accordion state when modal opens

**In the useEffect at line 40-63**, add at the end of the `if (isOpen)` block (just before the closing `}`):

```tsx
// Reset AI state
setAiResult(null);
setAiProcessing(false);
setAiError(null);
// Accordion: open when editing, closed when creating new
setAccordionOpen(!!expense);
```

### Step 4: Restructure the form content

**Replace the ENTIRE form content** (from line 111 `<form onSubmit={handleSubmit}...` to line 298 `</form>`) with the following restructured layout:

```tsx
<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
    {/* SECTION 1: Receipt Upload Zone — PROMINENT */}
    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        {/* Show receipt preview if already uploaded */}
        {formData.receipt_url ? (
            <ReceiptUpload
                value={formData.receipt_url || ''}
                onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
                organizationId={currentOrganization?.id || ''}
                disabled={isSubmitting || aiProcessing}
            />
        ) : (
            <>
                {/* MOBILE: Two buttons side by side */}
                <div className="md:hidden space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = (e: any) => {
                                    const file = e.target?.files?.[0];
                                    if (file) {
                                        // Trigger the hidden ReceiptUpload flow
                                        setShowMobileUpload(true);
                                        setMobileFile(file);
                                    }
                                };
                                input.click();
                            }}
                            disabled={isSubmitting || aiProcessing}
                            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Camera size={28} className="mb-2" />
                            <span className="text-sm font-bold">Take Photo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/jpeg,image/png,image/webp,application/pdf';
                                input.onchange = (e: any) => {
                                    const file = e.target?.files?.[0];
                                    if (file) {
                                        setShowMobileUpload(true);
                                        setMobileFile(file);
                                    }
                                };
                                input.click();
                            }}
                            disabled={isSubmitting || aiProcessing}
                            className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-rose-400 dark:hover:border-rose-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Upload size={28} className="mb-2" />
                            <span className="text-sm font-bold">Upload File</span>
                        </button>
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Snap a receipt and AI will auto-fill the expense details
                    </p>
                </div>

                {/* DESKTOP: Full drag-drop zone */}
                <div className="hidden md:block">
                    <ReceiptUpload
                        value={formData.receipt_url || ''}
                        onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
                        organizationId={currentOrganization?.id || ''}
                        disabled={isSubmitting || aiProcessing}
                    />
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                        <Sparkles size={12} className="inline mr-1 text-amber-500" />
                        Upload a receipt and AI will auto-fill the expense details
                    </p>
                </div>
            </>
        )}
    </div>

    {/* SECTION 2: AI Processing Status */}
    {aiProcessing && (
        <div className="flex items-center justify-center p-4 mx-6 mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Loader2 size={20} className="text-blue-500 animate-spin mr-3" />
            <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Scanning receipt...</p>
                <p className="text-xs text-blue-500 dark:text-blue-400">AI is extracting expense details</p>
            </div>
        </div>
    )}

    {aiError && !aiProcessing && (
        <div className="flex items-center p-4 mx-6 mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Scan failed</p>
                <p className="text-xs text-red-500 dark:text-red-400">{aiError}</p>
            </div>
        </div>
    )}

    {aiResult && !aiProcessing && (
        <div className="p-4 mx-6 mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <CheckCircle size={18} className="text-emerald-500 mr-2" />
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Receipt Scanned</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800 px-2 py-0.5 rounded-full">
                    {Math.round((aiResult.confidence || 0) * 100)}% confident
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">Vendor:</span> <span className="font-medium text-gray-900 dark:text-white">{aiResult.vendor_name || 'Unknown'}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Total:</span> <span className="font-medium text-gray-900 dark:text-white">${(aiResult.total_amount || 0).toFixed(2)}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Date:</span> <span className="font-medium text-gray-900 dark:text-white">{aiResult.expense_date || 'N/A'}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Items:</span> <span className="font-medium text-gray-900 dark:text-white">{aiResult.items?.length || 0} found</span></div>
            </div>
        </div>
    )}

    {/* SECTION 3: Manual Entry Accordion */}
    <div className="mt-4">
        <button
            type="button"
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
            <span className="flex items-center">
                <FileText size={16} className="mr-2" />
                {aiResult ? 'Review & Edit Details' : 'Enter Manually'}
            </span>
            {accordionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {accordionOpen && (
            <div className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Description */}
                    <div className="space-y-4 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description*
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white text-lg font-medium"
                            placeholder="What was this expense for?"
                        />
                    </div>

                    {/* Amount Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Amount (Subtotal)*
                            </label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value || '0') })}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tax Amount
                            </label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.tax_amount}
                                    onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value || '0') })}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total to Record</p>
                            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                ${formData.total_amount?.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Date/Category/Vendor Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date*
                            </label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category*
                            </label>
                            <select
                                required
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Vendor / Supplier
                            </label>
                            <select
                                value={formData.supplier_id}
                                onChange={(e) => {
                                    const s = suppliers.find(sup => sup.id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        supplier_id: e.target.value,
                                        vendor_name: s ? s.name : ''
                                    });
                                }}
                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                            >
                                <option value="">Select Supplier (Optional)</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Payment Method + Status Row */}
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                            >
                                <option value="credit_card">Credit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.payment_status}
                                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as ExpensePaymentStatus })}
                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                            >
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="reimbursed">Reimbursed</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <FileText size={14} className="mr-1" />
                            Notes & Reference
                        </label>
                        <textarea
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                            placeholder="Reference number, receipt details, etc."
                        />
                    </div>

                    {/* Receipt Upload (shown in accordion on desktop if not already uploaded) */}
                    {!formData.receipt_url && (
                        <div className="md:col-span-2 hidden md:block">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                <FileImage size={14} className="mr-1" />
                                Receipt / Attachment
                            </label>
                            <ReceiptUpload
                                value={formData.receipt_url || ''}
                                onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
                                organizationId={currentOrganization?.id || ''}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>

    {/* SECTION 4: Action Buttons — Always Visible */}
    <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-800">
        <Button variant="secondary" onClick={onClose} type="button">
            Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting} className="flex items-center">
            <Save size={18} className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
    </div>
</form>
```

**IMPORTANT NOTE about mobile file upload:** The mobile "Take Photo" and "Upload File" buttons use `document.createElement('input')` to create temporary file inputs. The `setShowMobileUpload` and `setMobileFile` state variables referenced above need to be added. However, for this phase, a simpler approach is to skip the mobile-specific file handling and instead show the ReceiptUpload component on both mobile and desktop, but with different visual presentation.

**SIMPLIFIED APPROACH — Replace the mobile buttons with:**

Instead of the complex mobile file handling, show the ReceiptUpload component everywhere but add mobile-specific helper text:

```tsx
{/* Receipt Upload Zone — works on both mobile and desktop */}
<ReceiptUpload
    value={formData.receipt_url || ''}
    onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
    organizationId={currentOrganization?.id || ''}
    disabled={isSubmitting || aiProcessing}
/>
<p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
    <Sparkles size={12} className="inline mr-1 text-amber-500" />
    Upload a receipt and AI will auto-fill the expense details
</p>
```

The ReceiptUpload component already has mobile camera capture built in (`md:hidden` button for "Take Photo of Receipt"). This is simpler and avoids complex state management for file handoff.

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. Start dev server and test:
   - **New Expense (Desktop):**
     - Click "Add Expense" → Modal opens
     - Receipt upload zone is prominent at the top
     - Manual form fields are hidden behind "Enter Manually" accordion
     - Click "Enter Manually" → form fields expand with all existing fields
     - Fill in fields → Save → works as before
   - **New Expense (Mobile viewport 375px):**
     - Modal opens with receipt upload zone and "Take Photo" button
     - "Enter Manually" accordion below
     - Camera capture works on real mobile device
   - **Edit Expense:**
     - Click edit on existing expense → Modal opens
     - Accordion starts OPEN with all fields pre-populated
     - Receipt preview shows if receipt was attached
   - **AI Status sections:**
     - The processing/error/success bars render correctly (even if empty for now — they'll be wired in Task 8)
3. Modal scrolls properly on all viewport sizes
4. Dark mode looks correct

---

## FILES MODIFIED SUMMARY

| File | Changes |
|------|---------|
| `src/components/financials/ExpenseModal.tsx` | Restructured form layout: receipt upload zone at top, manual entry behind accordion, AI status sections (placeholders), accordion auto-open for edit mode |
