import React, { useState, useEffect } from 'react';
import { X, Save, Receipt, Calendar, DollarSign, FileText, FileImage } from 'lucide-react';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Card, Button } from '@/components/theme/ThemeComponents';
import type { Expense, PaymentMethod, ExpensePaymentStatus } from '@/types/app.types';
import toast from 'react-hot-toast';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';

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
                await updateExpense(expense.id, formData);
                toast.success('Expense updated successfully');
            } else {
                await createExpense({
                    ...formData as any,
                    organization_id: currentOrganization.id,
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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
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
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800">
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
