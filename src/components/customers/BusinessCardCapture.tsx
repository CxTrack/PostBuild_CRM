/**
 * BusinessCardCapture - Mobile-only component for scanning business cards
 * Shows a FAB (floating action button) on mobile viewports
 * Captures image → uploads to Supabase → sends to OCR Edge Function → returns extracted data
 */

import React, { useState, useRef } from 'react';
import { Loader2, AlertCircle, CreditCard, Check, RotateCcw } from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';
import { compressImageForOCR } from '@/utils/image.utils';

interface ExtractedContact {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    raw_text: string;
}

interface BusinessCardCaptureProps {
    onContactExtracted: (contact: ExtractedContact, imageUrl: string) => void;
}

export const BusinessCardCapture: React.FC<BusinessCardCaptureProps> = ({
    onContactExtracted,
}) => {
    const { currentOrganization } = useOrganizationStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProcessing, setShowProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>('');
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile || !currentOrganization?.id) return;

        // Show preview
        const previewUrl = URL.createObjectURL(rawFile);
        setPreview(previewUrl);
        setShowProcessing(true);
        setIsProcessing(true);
        setError(null);

        try {
            // Step 1: Compress and upload to Supabase Storage
            setProgress('Uploading image...');
            const file = await compressImageForOCR(rawFile);
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${currentOrganization.id}/${timestamp}_${safeName}`;

            const supabaseUrl = getSupabaseUrl();
            const token = await getAuthToken();
            if (!token) throw new Error('Please sign in to scan business cards');

            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // Upload via direct fetch (avoids Supabase JS AbortController issue)
            const uploadRes = await fetch(
                `${supabaseUrl}/storage/v1/object/business-cards/${path}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': anonKey,
                        'Cache-Control': '3600',
                    },
                    body: file,
                }
            );

            if (!uploadRes.ok) {
                const err = await uploadRes.json().catch(() => ({}));
                throw new Error('Failed to upload: ' + (err.message || uploadRes.statusText));
            }

            // Step 2: Get a signed URL for the uploaded image
            const signedUrlRes = await fetch(
                `${supabaseUrl}/storage/v1/object/sign/business-cards/${path}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': anonKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ expiresIn: 3600 }),
                }
            );

            const signedUrlData = signedUrlRes.ok ? await signedUrlRes.json() : null;
            const imageUrl = signedUrlData?.signedURL
                ? `${supabaseUrl}/storage/v1${signedUrlData.signedURL}`
                : path;

            // Step 3: Call OCR Edge Function
            setProgress('Scanning card with AI...');

            const ocrResponse = await fetch(
                `${supabaseUrl}/functions/v1/ocr-extract`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        file_path: path,
                        bucket: 'business-cards',
                    }),
                }
            );

            if (!ocrResponse.ok) {
                const errorData = await ocrResponse.json().catch(() => ({}));
                if (errorData.error === 'token_limit_reached') {
                    throw new Error('Out of AI tokens this month. Upgrade your plan for more.');
                }
                throw new Error(errorData.error || 'OCR processing failed');
            }

            const ocrData = await ocrResponse.json();

            if (ocrData.success && ocrData.contact) {
                const tokenInfo = ocrData.tokensUsed ? ` (${ocrData.tokensUsed} AI tokens)` : '';
                setProgress(`Contact extracted!${tokenInfo}`);
                // Small delay so user sees the success message
                await new Promise(r => setTimeout(r, 1000));
                onContactExtracted(ocrData.contact, imageUrl);
                resetState();
            } else {
                throw new Error(ocrData.error || 'Could not extract contact info from card');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to process business card');
            setIsProcessing(false);
        }

        // Reset file input
        e.target.value = '';
    };

    const resetState = () => {
        setShowProcessing(false);
        setIsProcessing(false);
        setError(null);
        setPreview(null);
        setProgress('');
    };

    // Processing overlay
    if (showProcessing) {
        return (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:hidden">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                    {/* Card image preview */}
                    {preview && (
                        <div className="bg-gray-100 dark:bg-gray-900">
                            <img
                                src={preview}
                                alt="Business card"
                                className="w-full max-h-48 object-contain"
                            />
                        </div>
                    )}

                    <div className="p-6">
                        {isProcessing ? (
                            <div className="text-center">
                                <Loader2 size={40} className="text-blue-600 animate-spin mx-auto mb-3" />
                                <p className="font-medium text-gray-900 dark:text-white">{progress}</p>
                                <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                            </div>
                        ) : error ? (
                            <div className="text-center">
                                <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                                <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center"
                                    >
                                        <RotateCcw size={16} className="mr-2" />
                                        Retry
                                    </button>
                                    <button
                                        onClick={resetState}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Check size={40} className="text-green-500 mx-auto mb-3" />
                                <p className="font-medium text-green-600">Contact extracted!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hidden camera input for retry */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    className="hidden"
                />
            </div>
        );
    }

    // FAB — only visible on mobile
    return (
        <>
            <button
                onClick={() => cameraInputRef.current?.click()}
                className="md:hidden fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                title="Scan Business Card"
            >
                <CreditCard size={24} />
            </button>

            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
            />
        </>
    );
};

export default BusinessCardCapture;
