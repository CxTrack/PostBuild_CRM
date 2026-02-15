# GEMINI TASK 5: Receipt Upload for Expenses

## STRICT RULES
1. Only modify/create the files listed below
2. Run `npm run build` after ALL changes — must pass with zero errors
3. Do NOT remove or change any existing functionality
4. Use the existing Supabase client from `@/lib/supabase`
5. Use Tailwind responsive classes for mobile vs desktop behavior
6. Commit message format: `feat: receipt upload for expenses with drag-drop and camera capture`

---

## CONTEXT
Users need to attach receipt images to expenses. This is a universal feature across ALL industry templates.

**What already exists:**
- `receipt_url` column exists in the `expenses` DB table
- `receipt_url?: string` is already in the TypeScript `Expense` interface (`src/types/app.types.ts` line 376)
- Supabase client is initialized in `src/lib/supabase.ts`
- `ExpenseModal.tsx` already has proper flex-col scroll layout

**What needs to be created:**
1. Supabase Storage bucket `receipts` (with RLS policies)
2. A reusable `ReceiptUpload` React component
3. Wire the component into `ExpenseModal.tsx`

---

## SUB-TASK A: Create Supabase Storage Bucket

This must be done MANUALLY in the Supabase Dashboard or via the Supabase CLI. Include these instructions for the developer:

### Instructions (run in Supabase Dashboard → Storage):

1. Go to: https://supabase.com/dashboard/project/zkpfzrbbupgiqkzqydji/storage/buckets
2. Click "New Bucket"
3. Name: `receipts`
4. Public: **OFF** (private — we'll use signed URLs for viewing)
5. File size limit: 10MB
6. Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

### Storage RLS Policies (create in SQL Editor):

```sql
-- Allow authenticated users to upload receipts to their org folder
CREATE POLICY "Users can upload receipts to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
        SELECT o.id::text FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
    )
);

-- Allow authenticated users to view receipts in their org folder
CREATE POLICY "Users can view receipts in their org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
        SELECT o.id::text FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
    )
);

-- Allow authenticated users to delete receipts in their org folder
CREATE POLICY "Users can delete receipts in their org folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
        SELECT o.id::text FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
    )
);
```

---

## SUB-TASK B: Create ReceiptUpload Component

**Create new file:** `src/components/ui/ReceiptUpload.tsx`

```tsx
/**
 * ReceiptUpload - Drag & drop + camera capture receipt upload
 * Desktop: drag-and-drop zone + click to browse
 * Mobile: click to browse + camera capture option
 * Uploads to Supabase Storage bucket 'receipts'
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, FileImage, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReceiptUploadProps {
    value?: string;
    onChange: (url: string | null) => void;
    organizationId: string;
    disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
    value,
    onChange,
    organizationId,
    disabled = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Generate signed URL for viewing
    const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
        try {
            const { data, error } = await supabase.storage
                .from('receipts')
                .createSignedUrl(path, 3600); // 1 hour expiry
            if (error) throw error;
            return data.signedUrl;
        } catch {
            return null;
        }
    }, []);

    // Load preview from existing value
    React.useEffect(() => {
        if (value && !preview) {
            // If value is a storage path (not a full URL), get signed URL
            if (!value.startsWith('http')) {
                getSignedUrl(value).then(url => {
                    if (url) setPreview(url);
                });
            } else {
                setPreview(value);
            }
        }
        if (!value) {
            setPreview(null);
        }
    }, [value, getSignedUrl, preview]);

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return 'Invalid file type. Please upload JPEG, PNG, WebP, or PDF.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'File too large. Maximum size is 10MB.';
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Generate unique path: orgId/timestamp_filename
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${organizationId}/${timestamp}_${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get signed URL for preview
            const signedUrl = await getSignedUrl(path);
            if (signedUrl) {
                setPreview(signedUrl);
            }

            // Return the storage path (not the signed URL) for persistence
            onChange(path);
        } catch (err: any) {
            setError(err.message || 'Failed to upload receipt');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        if (value && !value.startsWith('http')) {
            // Delete from storage
            try {
                await supabase.storage.from('receipts').remove([value]);
            } catch {
                // Silently fail — file may already be gone
            }
        }
        setPreview(null);
        onChange(null);
        setError(null);
    };

    // Drag & drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !uploading) setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        if (disabled || uploading) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    // If there's a preview (existing receipt), show it
    if (preview || value) {
        const isPdf = value?.endsWith('.pdf');
        return (
            <div className="relative group">
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                    {isPdf ? (
                        <div className="flex items-center justify-center p-6">
                            <FileImage size={48} className="text-gray-400" />
                            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">PDF Receipt Attached</span>
                        </div>
                    ) : (
                        <img
                            src={preview || ''}
                            alt="Receipt"
                            className="w-full max-h-48 object-contain"
                            onError={() => setPreview(null)}
                        />
                    )}
                </div>

                {!disabled && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        );
    }

    // Upload zone
    return (
        <div>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                    ${dragOver
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-rose-400 dark:hover:border-rose-500 bg-gray-50 dark:bg-gray-900/50'
                    }
                    ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            >
                {uploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 size={32} className="text-rose-500 animate-spin mb-2" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading receipt...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload size={32} className="text-gray-400 mb-2" />
                        {/* Desktop text */}
                        <p className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Drag & drop a receipt here, or click to browse
                        </p>
                        {/* Mobile text */}
                        <p className="md:hidden text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tap to upload a receipt
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            JPEG, PNG, WebP, or PDF (max 10MB)
                        </p>
                    </div>
                )}

                {/* Hidden file input for browse */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled || uploading}
                />
            </div>

            {/* Mobile camera capture button */}
            <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || uploading}
                className="md:hidden mt-3 w-full flex items-center justify-center px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
                <Camera size={18} className="mr-2" />
                Take Photo of Receipt
            </button>

            {/* Hidden camera input — mobile only */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || uploading}
            />

            {/* Error message */}
            {error && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ReceiptUpload;
```

---

## SUB-TASK C: Wire ReceiptUpload into ExpenseModal

**File:** `src/components/financials/ExpenseModal.tsx`

### C1. Add import (top of file, after existing imports around line 7)

**After line 7 (`import toast from 'react-hot-toast';`), add:**
```tsx
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
```

### C2. Add receipt_url to formData initial state (line 33)

**Current (line 33):**
```tsx
        notes: '',
    });
```

**Replace with:**
```tsx
        notes: '',
        receipt_url: '',
    });
```

### C3. Also add receipt_url to the reset state in the useEffect (find the else block where formData is reset)

Look for the `setFormData` call in the `else` block of the `useEffect` (approximately lines 46-58 where it creates a new expense). Add `receipt_url: '',` to that object as well.

### C4. Add ReceiptUpload component to the form

**After the Notes & Reference section (approximately after line 269, after the closing `</div>` of the notes field), add:**

```tsx
{/* Receipt Upload */}
<div className="md:col-span-2">
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
```

**Note:** Import `FileImage` from lucide-react if it's not already imported. Check line 2 — if `FileImage` is not in the import, add it:

**Current line 2:**
```tsx
import { X, Save, Receipt, Calendar, DollarSign, FileText } from 'lucide-react';
```

**Update to:**
```tsx
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage } from 'lucide-react';
```

### C5. Ensure receipt_url is included in the save payload

Check the `handleSubmit` function. It likely spreads `formData` into the create/update call, which means `receipt_url` will be included automatically. Verify that `receipt_url` is part of the data being sent.

If the submit function explicitly picks fields (destructuring), add `receipt_url` to the picked fields.

---

## SUB-TASK D: Update CSP for Supabase Storage (if not already done)

**File:** `netlify.toml`

Check if the Content-Security-Policy `img-src` directive includes Supabase storage URLs. The signed URLs will come from `https://zkpfzrbbupgiqkzqydji.supabase.co/storage/v1/...`.

Since `https://*.supabase.co` is already in `default-src`, this should be covered. But verify that `img-src` includes it too:

**If `img-src` does NOT include `https://*.supabase.co`, add it:**
```
img-src 'self' data: blob: https://*.unsplash.com https://*.stripe.com https://maps.gstatic.com https://maps.googleapis.com https://*.supabase.co;
```

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. **Supabase Storage bucket must be created first** (Sub-task A) before testing uploads
3. Start dev server and test:
   - Navigate to `/dashboard/financials`
   - Click "Add Expense" button
   - In the ExpenseModal, scroll down — the Receipt upload zone should be visible below Notes
   - **Desktop test:**
     - Drag an image onto the upload zone — it should upload and show a preview
     - Click the upload zone — file picker opens
     - Select a JPEG image — uploads and shows preview
     - Hover over the preview — red X button appears to remove
     - Click remove — receipt deleted, upload zone returns
     - Try uploading a file > 10MB — error message shown
     - Try uploading a .txt file — "Invalid file type" error
   - **Mobile test (use Chrome DevTools mobile emulator):**
     - The drag text should say "Tap to upload a receipt" (not drag & drop)
     - A "Take Photo of Receipt" button should appear below the upload zone
     - Click it — camera capture should open (on real mobile device)
   - **Save test:**
     - Fill out expense form with a receipt attached
     - Save — expense created with receipt_url
     - Edit the expense — receipt preview should load from signed URL
4. Test with an expense that has no receipt — upload zone should show

---

## FILES SUMMARY

| File | Action | Changes |
|------|--------|---------|
| `src/components/ui/ReceiptUpload.tsx` | CREATE | New component with drag/drop, file browse, camera capture, Supabase Storage upload |
| `src/components/financials/ExpenseModal.tsx` | MODIFY | Import ReceiptUpload, add `receipt_url` to formData, add component to form UI |
| `netlify.toml` | VERIFY | Ensure `img-src` allows Supabase storage URLs |
| Supabase Dashboard | MANUAL | Create `receipts` bucket + RLS policies (SQL provided above) |
