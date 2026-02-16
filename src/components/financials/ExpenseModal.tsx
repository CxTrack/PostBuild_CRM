import React, { useState, useEffect } from 'react';
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage, ChevronDown, ChevronUp, Sparkles, CheckCircle, Loader2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Card, Button } from '@/components/theme/ThemeComponents';
import type { Expense, PaymentMethod, ExpensePaymentStatus } from '@/types/app.types';
import toast from 'react-hot-toast';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
import { supabase } from '@/lib/supabase';
import type { ReceiptScanResult } from '@/types/app.types';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense?: Expense;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, expense }) => {
    const { currentOrganization } = useOrganizationStore();
    const { categories, fetchCategories, createExpense, updateExpense, saveLineItems, fetchLineItems } = useExpenseStore();
    const { suppliers, fetchSuppliers } = useSupplierStore();

    const [formData, setFormData] = useState<Partial<Expense>>({
        expense_number: '',
        description: '',
        amount: 0,
        tax_amount: 0,
        total_amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        category_id: '',
        supplier_id: '',
        vendor_name: '',
        payment_method: 'credit_card',
        payment_status: 'paid',
        notes: '',
        receipt_url: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(!!expense);
    const [aiResult, setAiResult] = useState<any>(null);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unit_price: number; amount: number }>>([]);

    const applyAiData = (result: ReceiptScanResult) => {
        // Find matching category by name (case-insensitive)
        const matchedCategory = categories.find(
            c => c.name.toLowerCase() === result.category_suggestion?.toLowerCase()
        );

        // Try to match vendor to existing supplier (fuzzy match)
        let matchedSupplier: typeof suppliers[0] | undefined;
        if (result.vendor_name) {
            const vendorLower = result.vendor_name.toLowerCase().trim();
            // Exact match first
            matchedSupplier = suppliers.find(s => s.name.toLowerCase().trim() === vendorLower);
            // Partial match: supplier name contains vendor or vice versa
            if (!matchedSupplier) {
                matchedSupplier = suppliers.find(s =>
                    s.name.toLowerCase().includes(vendorLower) ||
                    vendorLower.includes(s.name.toLowerCase())
                );
            }
        }

        setFormData(prev => ({
            ...prev,
            description: result.ai_description || result.description || prev.description,
            amount: result.amount || prev.amount,
            tax_amount: result.tax_amount ?? prev.tax_amount,
            total_amount: result.total_amount || prev.total_amount,
            expense_date: result.expense_date || prev.expense_date,
            vendor_name: result.vendor_name || prev.vendor_name,
            supplier_id: matchedSupplier?.id || prev.supplier_id,
            payment_method: (result.payment_method as PaymentMethod) || prev.payment_method,
            category_id: matchedCategory?.id || prev.category_id,
            notes: prev.notes || (result.vendor_name ? `AI-scanned receipt from ${result.vendor_name}` : ''),
        }));

        // Populate line items from AI scan
        if (result.items && result.items.length > 0) {
            setLineItems(result.items.map(item => ({
                description: item.description || '',
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                amount: item.amount || 0,
            })));
        }

        setAccordionOpen(true); // Open accordion so user can review
    };

    const processReceipt = async (filePath: string) => {
        setAiProcessing(true);
        setAiError(null);

        try {
            // Use direct fetch with fresh session token to avoid AbortController bug
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Not authenticated. Please refresh and try again.');

            const response = await fetch(`${supabaseUrl}/functions/v1/receipt-scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    file_path: filePath,
                    bucket: 'receipts',
                    industry: currentOrganization?.industry_template || 'general_business',
                }),
            });

            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                throw new Error(`Scan failed (${response.status}): ${errText || 'Edge Function error'}`);
            }

            const data = await response.json();
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

    const addLineItem = () => {
        setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories(currentOrganization?.id);
            fetchSuppliers(currentOrganization?.id);
            if (expense) {
                setFormData(expense);
            } else {
                const nextNum = `EXP-${Date.now().toString().slice(-6)}`;
                setFormData({
                    expense_number: nextNum,
                    description: '',
                    amount: 0,
                    tax_amount: 0,
                    total_amount: 0,
                    expense_date: new Date().toISOString().split('T')[0],
                    category_id: categories[0]?.id || '',
                    payment_method: 'credit_card',
                    payment_status: 'paid',
                    notes: '',
                    receipt_url: '',
                });
                setLineItems([]);
            }
            if (expense) {
                // Load existing line items
                fetchLineItems(expense.id).then(items => {
                    setLineItems(items.map(li => ({
                        description: li.description,
                        quantity: Number(li.quantity),
                        unit_price: Number(li.unit_price),
                        amount: Number(li.amount),
                    })));
                });
            }
            // Reset AI state
            setAiResult(null);
            setAiProcessing(false);
            setAiError(null);
            // Accordion: open when editing, closed when creating new
            setAccordionOpen(!!expense);
        }
    }, [isOpen, expense, currentOrganization?.id]);

    useEffect(() => {
        const total = (Number(formData.amount) || 0) + (Number(formData.tax_amount) || 0);
        if (total !== formData.total_amount) {
            setFormData(prev => ({ ...prev, total_amount: total }));
        }
    }, [formData.amount, formData.tax_amount]);

    useEffect(() => {
        if (lineItems.length > 0) {
            const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
            if (subtotal !== formData.amount) {
                setFormData(prev => ({ ...prev, amount: subtotal }));
            }
        }
    }, [lineItems]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization?.id) return;

        setIsSubmitting(true);
        try {
            if (expense?.id) {
                await updateExpense(expense.id, { ...formData, ai_processed: !!aiResult });
                // Save line items (even if empty to handle deletions)
                await saveLineItems(expense.id, lineItems);
                toast.success('Expense updated successfully');
            } else {
                const newExpense = await createExpense({
                    ...formData as any,
                    organization_id: currentOrganization.id,
                    ai_processed: !!aiResult,
                });
                // Save line items if any
                if (newExpense?.id && lineItems.length > 0) {
                    await saveLineItems(newExpense.id, lineItems);
                }
                toast.success('Expense recorded successfully');
            }
            onClose();
        } catch (error) {
            toast.error('Failed to save expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-rose-600 to-pink-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Receipt size={24} className="mr-2" />
                        {expense ? 'Edit Expense' : 'Record Expense'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    {/* SECTION 1: Receipt Upload Zone — PROMINENT */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        {/* Receipt Upload Zone — works on both mobile and desktop */}
                        <ReceiptUpload
                            value={formData.receipt_url || ''}
                            onChange={(url) => setFormData({ ...formData, receipt_url: url || '' })}
                            onFileUploaded={processReceipt}
                            organizationId={currentOrganization?.id || ''}
                            disabled={isSubmitting || aiProcessing}
                        />
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                            <Sparkles size={12} className="inline mr-1 text-amber-500" />
                            Upload a receipt and AI will auto-fill the expense details
                        </p>
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
                                                Vendor Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.vendor_name || ''}
                                                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                                                placeholder="Business or store name"
                                            />
                                        </div>

                                        {suppliers.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Link to Supplier
                                            </label>
                                            <select
                                                value={formData.supplier_id || ''}
                                                onChange={(e) => {
                                                    const s = suppliers.find(sup => sup.id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        supplier_id: e.target.value,
                                                        vendor_name: s ? s.name : formData.vendor_name,
                                                    });
                                                }}
                                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all dark:text-white"
                                            >
                                                <option value="">None (Optional)</option>
                                                {suppliers.map(sup => (
                                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        )}
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
                                                onFileUploaded={processReceipt}
                                                organizationId={currentOrganization?.id || ''}
                                                disabled={isSubmitting || aiProcessing}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Line Items Table */}
                                {lineItems.length > 0 && (
                                    <div className="mt-8">
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

                                {/* Add Item Button */}
                                {lineItems.length === 0 ? (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={addLineItem}
                                            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-rose-600 transition-colors py-2 px-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-rose-300"
                                        >
                                            <Plus size={16} />
                                            <span>Add Itemized Details (Optional)</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={addLineItem}
                                            className="flex items-center space-x-1 text-xs text-rose-600 font-bold hover:text-rose-700 transition-colors"
                                        >
                                            <Plus size={14} />
                                            <span>Add Another Item</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Action Buttons — Always Visible */}
                    <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting} className="flex items-center">
                            <Save size={18} className="mr-2" />
                            {isSubmitting ? 'Saving...' : 'Save Expense'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ExpenseModal;
