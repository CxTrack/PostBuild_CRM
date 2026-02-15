import React, { useState, useEffect } from 'react';
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage, ChevronDown, ChevronUp, Sparkles, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
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
    const { categories, fetchCategories, createExpense, updateExpense } = useExpenseStore();
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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization?.id) return;

        setIsSubmitting(true);
        try {
            if (expense?.id) {
                await updateExpense(expense.id, { ...formData, ai_processed: !!aiResult });
                toast.success('Expense updated successfully');
            } else {
                await createExpense({
                    ...formData as any,
                    organization_id: currentOrganization.id,
                    ai_processed: !!aiResult,
                });
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
                                                onFileUploaded={processReceipt}
                                                organizationId={currentOrganization?.id || ''}
                                                disabled={isSubmitting || aiProcessing}
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
            </Card>
        </div>
    );
};

export default ExpenseModal;
