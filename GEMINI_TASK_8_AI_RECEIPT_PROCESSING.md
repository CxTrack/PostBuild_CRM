# GEMINI TASK 8: AI Receipt Processing Integration

## STRICT RULES
1. Only modify the files listed below — do NOT create new files
2. Run `npm run build` after ALL changes — must pass with zero errors
3. Do NOT change the handleSubmit function logic (only add `ai_processed` field to the save payload)
4. Do NOT change the ReceiptUpload internal upload logic — only add the callback prop
5. Do NOT add any new npm packages
6. Do NOT restructure the modal layout (that was done in Task 7)
7. Commit message format: `feat: AI receipt scanning with OpenRouter vision API integration`

---

## GLOBAL GUARDRAILS
- **AbortController Bug**: `organizationStore.ts` uses direct `fetch()` not `supabase.from()`. Other stores are fine using supabase client.
- **Theme Classes**: Always include `dark:` Tailwind variants
- **Build Check**: Must pass `npm run build` with zero TypeScript errors
- **Edge Function calls**: Use `supabase.functions.invoke('receipt-scan', { body: { ... } })` — the supabase client automatically includes the auth token
- **Existing imports**: `supabase` is imported from `@/lib/supabase`

---

## CONTEXT

Task 7 restructured the ExpenseModal with:
- Receipt upload zone at the top
- AI status sections (processing spinner, error, success preview) — currently just rendering from state but not wired to any backend
- Manual form behind an accordion
- State variables: `aiResult`, `aiProcessing`, `aiError`, `accordionOpen`

This task wires the AI receipt scanning: after a receipt is uploaded, it calls the `receipt-scan` Supabase Edge Function (already deployed), which sends the image to OpenRouter's Gemini Flash vision model and returns structured expense data. The extracted data is then auto-filled into the form.

---

## FILES TO MODIFY

1. `src/types/app.types.ts` — Add new interfaces
2. `src/components/ui/ReceiptUpload.tsx` — Add `onFileUploaded` callback prop
3. `src/components/financials/ExpenseModal.tsx` — Wire AI processing

---

## SUB-TASK A: Add Types to `app.types.ts`

**File:** `src/types/app.types.ts`

### A1. Add `ai_processed` to Expense interface

Find the `Expense` interface (around line 361-381). After the `receipt_url?: string;` line (line 376), add:

```typescript
  ai_processed?: boolean;
```

### A2. Add ReceiptScanResult interface

After the `Expense` interface closing brace (after line 381), add:

```typescript
export interface ExpenseLineItem {
  id: string;
  expense_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface ReceiptScanResult {
  vendor_name: string;
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  expense_date: string;
  payment_method: string;
  category_suggestion: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  ai_description: string;
  confidence: number;
}
```

---

## SUB-TASK B: Add `onFileUploaded` Callback to ReceiptUpload

**File:** `src/components/ui/ReceiptUpload.tsx`

### B1. Update the props interface (line 12-17)

**Current:**
```tsx
interface ReceiptUploadProps {
    value?: string;
    onChange: (url: string | null) => void;
    organizationId: string;
    disabled?: boolean;
}
```

**Replace with:**
```tsx
interface ReceiptUploadProps {
    value?: string;
    onChange: (url: string | null) => void;
    onFileUploaded?: (filePath: string) => void;
    organizationId: string;
    disabled?: boolean;
}
```

### B2. Destructure the new prop (line 22-27)

**Current:**
```tsx
export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
    value,
    onChange,
    organizationId,
    disabled = false,
}) => {
```

**Replace with:**
```tsx
export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
    value,
    onChange,
    onFileUploaded,
    organizationId,
    disabled = false,
}) => {
```

### B3. Call the callback after successful upload

In the `uploadFile` function, find line 107 where `onChange(path)` is called. **After that line**, add:

```tsx
            // Notify parent that file was uploaded (for AI processing)
            onFileUploaded?.(path);
```

So the section becomes:
```tsx
            // Return the storage path (not the signed URL) for persistence
            onChange(path);

            // Notify parent that file was uploaded (for AI processing)
            onFileUploaded?.(path);
```

---

## SUB-TASK C: Wire AI Processing in ExpenseModal

**File:** `src/components/financials/ExpenseModal.tsx`

### C1. Add supabase import

After the existing imports (around line 9), add:

```tsx
import { supabase } from '@/lib/supabase';
import type { ReceiptScanResult } from '@/types/app.types';
```

### C2. Add `applyAiData` function

After the state declarations (after the `aiError` state line), add:

```tsx
const applyAiData = (result: ReceiptScanResult) => {
    // Find matching category by name
    const matchedCategory = categories.find(
        c => c.name.toLowerCase() === result.category_suggestion?.toLowerCase()
    );

    setFormData(prev => ({
        ...prev,
        description: result.ai_description || result.description || prev.description,
        amount: result.amount || prev.amount,
        tax_amount: result.tax_amount ?? prev.tax_amount,
        total_amount: result.total_amount || prev.total_amount,
        expense_date: result.expense_date || prev.expense_date,
        vendor_name: result.vendor_name || prev.vendor_name,
        payment_method: (result.payment_method as PaymentMethod) || prev.payment_method,
        category_id: matchedCategory?.id || prev.category_id,
        notes: prev.notes || (result.vendor_name ? `AI-scanned receipt from ${result.vendor_name}` : ''),
    }));

    setAccordionOpen(true); // Open accordion so user can review
};
```

### C3. Add `processReceipt` function

After `applyAiData`, add:

```tsx
const processReceipt = async (filePath: string) => {
    setAiProcessing(true);
    setAiError(null);

    try {
        const { data, error } = await supabase.functions.invoke('receipt-scan', {
            body: { file_path: filePath, bucket: 'receipts' },
        });

        if (error) throw new Error(error.message || 'Failed to scan receipt');
        if (!data?.success) throw new Error(data?.error || 'Scan failed');

        const result: ReceiptScanResult = data.data;
        setAiResult(result);

        // Auto-apply if confidence is high enough
        if (result.confidence >= 0.7) {
            applyAiData(result);
            toast.success('Receipt scanned! Review the extracted data below.');
        } else {
            toast('Receipt scanned with low confidence. Please review manually.', { icon: '⚠️' });
            setAccordionOpen(true);
        }
    } catch (err: any) {
        setAiError(err.message || 'Failed to process receipt');
        toast.error('Receipt scan failed. Please enter details manually.');
        setAccordionOpen(true); // Open form so user can enter manually
    } finally {
        setAiProcessing(false);
    }
};
```

### C4. Pass `onFileUploaded` to ReceiptUpload components

Find ALL `<ReceiptUpload` usages in ExpenseModal.tsx and add `onFileUploaded={processReceipt}` prop.

There should be 2-3 instances (depending on Task 7 output). For each one, add the prop:

**Before:**
```tsx
<ReceiptUpload
    value={formData.receipt_url || ''}
    onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
    organizationId={currentOrganization?.id || ''}
    disabled={isSubmitting || aiProcessing}
/>
```

**After:**
```tsx
<ReceiptUpload
    value={formData.receipt_url || ''}
    onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
    onFileUploaded={processReceipt}
    organizationId={currentOrganization?.id || ''}
    disabled={isSubmitting || aiProcessing}
/>
```

### C5. Include `ai_processed` in the save payload

In the `handleSubmit` function, modify the create call to include `ai_processed`:

**Current (approximately):**
```tsx
await createExpense({
    ...formData as any,
    organization_id: currentOrganization.id,
});
```

**Replace with:**
```tsx
await createExpense({
    ...formData as any,
    organization_id: currentOrganization.id,
    ai_processed: !!aiResult,
});
```

And for the update call:
```tsx
await updateExpense(expense.id, { ...formData, ai_processed: !!aiResult });
```

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. Start dev server and test:
   - **Upload a receipt image (JPEG/PNG):**
     - Drag image onto upload zone (desktop) or use file picker
     - Image uploads to Supabase Storage ✓
     - "Scanning receipt..." spinner appears
     - After 2-5 seconds, AI result appears:
       - Green success bar with vendor, total, date, item count
       - Accordion auto-opens with all form fields pre-filled
     - Review fields, adjust if needed → Save → expense saved with `ai_processed: true`
   - **Upload a blurry/unreadable image:**
     - Scan completes with low confidence
     - Toast shows "low confidence" warning
     - Accordion opens for manual entry
   - **Network error / edge function failure:**
     - Red error bar shows error message
     - Accordion auto-opens so user can enter manually
     - Toast shows "scan failed" message
   - **Manual entry (no receipt):**
     - Click "Enter Manually" → form expands → fill in → save → `ai_processed: false`
3. Verify the `receipt_url` is saved to DB after upload
4. Verify `ai_processed` column is set correctly in the DB

---

## FILES MODIFIED SUMMARY

| File | Changes |
|------|---------|
| `src/types/app.types.ts` | Added `ai_processed` to Expense, added `ExpenseLineItem` and `ReceiptScanResult` interfaces |
| `src/components/ui/ReceiptUpload.tsx` | Added `onFileUploaded` callback prop, fires after successful upload |
| `src/components/financials/ExpenseModal.tsx` | Added supabase import, `applyAiData()`, `processReceipt()`, wired `onFileUploaded` to all ReceiptUpload instances, included `ai_processed` in save payload |
