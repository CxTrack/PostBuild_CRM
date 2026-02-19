import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, RefreshCw, DollarSign, Calendar, Search } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProductStore } from '@/stores/productStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, Button } from '@/components/theme/ThemeComponents';
import type { CustomerSubscription, BillingInterval } from '@/types/app.types';
import toast from 'react-hot-toast';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    subscription?: CustomerSubscription;
    organizationId: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    subscription,
    organizationId,
}) => {
    const { createSubscription, updateSubscription } = useSubscriptionStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const { products, fetchProducts } = useProductStore();
    const { user } = useAuthContext();

    const [formData, setFormData] = useState({
        customer_id: '',
        product_id: '',
        name: '',
        description: '',
        amount: 0,
        currency: 'USD',
        billing_interval: 'monthly' as BillingInterval,
        billing_interval_count: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active' as 'active' | 'trial' | 'paused',
        setup_fee: 0,
        auto_invoice: false,
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Recurring products only
    const recurringProducts = useMemo(() =>
        products.filter(p => p.pricing_model === 'recurring' && p.is_active),
        [products]
    );

    // Filter customers by search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers.slice(0, 20);
        const search = customerSearch.toLowerCase();
        return customers.filter(c =>
            (c.first_name && c.first_name.toLowerCase().includes(search)) ||
            (c.last_name && c.last_name.toLowerCase().includes(search)) ||
            (c.company_name && c.company_name.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search))
        ).slice(0, 20);
    }, [customers, customerSearch]);

    // Get selected customer display name
    const selectedCustomerName = useMemo(() => {
        const c = customers.find(c => c.id === formData.customer_id);
        if (!c) return '';
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
        return c.company_name ? `${name} (${c.company_name})` : name;
    }, [customers, formData.customer_id]);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            fetchProducts(organizationId);

            if (subscription) {
                setFormData({
                    customer_id: subscription.customer_id,
                    product_id: subscription.product_id || '',
                    name: subscription.name,
                    description: subscription.description || '',
                    amount: subscription.amount,
                    currency: subscription.currency,
                    billing_interval: subscription.billing_interval,
                    billing_interval_count: subscription.billing_interval_count,
                    start_date: subscription.start_date,
                    end_date: subscription.end_date || '',
                    status: (subscription.status === 'active' || subscription.status === 'trial' || subscription.status === 'paused')
                        ? subscription.status
                        : 'active',
                    setup_fee: subscription.setup_fee,
                    auto_invoice: subscription.auto_invoice,
                    notes: subscription.notes || '',
                });
                const c = customers.find(c => c.id === subscription.customer_id);
                if (c) {
                    const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
                    setCustomerSearch(c.company_name ? `${name} (${c.company_name})` : name);
                }
            } else {
                setFormData({
                    customer_id: '',
                    product_id: '',
                    name: '',
                    description: '',
                    amount: 0,
                    currency: 'USD',
                    billing_interval: 'monthly',
                    billing_interval_count: 1,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    status: 'active',
                    setup_fee: 0,
                    auto_invoice: false,
                    notes: '',
                });
                setCustomerSearch('');
            }
            setShowCustomerDropdown(false);
        }
    }, [isOpen, subscription, organizationId]);

    // When product changes, auto-fill name, description, and amount
    useEffect(() => {
        if (formData.product_id) {
            const product = products.find(p => p.id === formData.product_id);
            if (product) {
                setFormData(prev => ({
                    ...prev,
                    name: prev.name || product.name,
                    description: prev.description || product.description || '',
                    amount: prev.amount || product.price,
                    billing_interval: product.recurring_interval || prev.billing_interval,
                    billing_interval_count: product.recurring_interval_count || prev.billing_interval_count,
                }));
            }
        }
    }, [formData.product_id, products]);

    if (!isOpen) return null;

    const handleSelectCustomer = (customerId: string) => {
        const c = customers.find(c => c.id === customerId);
        if (c) {
            const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
            setCustomerSearch(c.company_name ? `${name} (${c.company_name})` : name);
            setFormData(prev => ({ ...prev, customer_id: customerId }));
        }
        setShowCustomerDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationId || !formData.customer_id) {
            toast.error('Please select a customer');
            return;
        }
        if (!formData.name.trim()) {
            toast.error('Subscription name is required');
            return;
        }
        if (!formData.amount || formData.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        setIsSubmitting(true);
        try {
            if (subscription?.id) {
                await updateSubscription(subscription.id, {
                    customer_id: formData.customer_id,
                    product_id: formData.product_id || undefined,
                    name: formData.name,
                    description: formData.description || undefined,
                    amount: formData.amount,
                    currency: formData.currency,
                    billing_interval: formData.billing_interval,
                    billing_interval_count: formData.billing_interval_count,
                    start_date: formData.start_date,
                    end_date: formData.end_date || undefined,
                    status: formData.status,
                    setup_fee: formData.setup_fee,
                    auto_invoice: formData.auto_invoice,
                    notes: formData.notes || undefined,
                });
                toast.success('Subscription updated');
            } else {
                await createSubscription({
                    organization_id: organizationId,
                    customer_id: formData.customer_id,
                    product_id: formData.product_id || undefined,
                    name: formData.name,
                    description: formData.description || undefined,
                    amount: formData.amount,
                    currency: formData.currency,
                    billing_interval: formData.billing_interval,
                    billing_interval_count: formData.billing_interval_count,
                    start_date: formData.start_date,
                    end_date: formData.end_date || undefined,
                    status: formData.status,
                    setup_fee: formData.setup_fee,
                    setup_fee_invoiced: false,
                    auto_invoice: formData.auto_invoice,
                    invoice_days_before: 0,
                    notes: formData.notes || undefined,
                    created_by: user?.id,
                });
                toast.success('Subscription created');
            }
            onSave();
            onClose();
        } catch (error) {
            toast.error('Failed to save subscription');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <RefreshCw size={24} className="mr-2" />
                        {subscription ? 'Edit Subscription' : 'New Subscription'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="px-6 py-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Search */}
                            <div className="md:col-span-2 relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Customer*
                                </label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerDropdown(true);
                                            if (!e.target.value) {
                                                setFormData(prev => ({ ...prev, customer_id: '' }));
                                            }
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                        placeholder="Search customers..."
                                    />
                                </div>
                                {showCustomerDropdown && filteredCustomers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {filteredCustomers.map(c => {
                                            const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
                                            const display = c.company_name ? `${name} (${c.company_name})` : name;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => handleSelectCustomer(c.id)}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                        formData.customer_id === c.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                                    }`}
                                                >
                                                    <div className="font-medium">{display || c.email}</div>
                                                    {c.email && name && <div className="text-xs text-gray-500 dark:text-gray-400">{c.email}</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {formData.customer_id && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Selected: {selectedCustomerName}</p>
                                )}
                            </div>

                            {/* Product Selector (optional) */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Linked Product (Optional)
                                </label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                >
                                    <option value="">None (manual entry)</option>
                                    {recurringProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — ${p.price}/{p.recurring_interval || 'month'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Only recurring products are shown. Selecting one auto-fills name and amount.
                                </p>
                            </div>

                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Subscription Name*
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white text-lg font-medium"
                                    placeholder="e.g., Monthly Retainer, SaaS Pro Plan"
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                    placeholder="What does this subscription include?"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Amount*
                                </label>
                                <div className="relative">
                                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value || '0') })}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Currency
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="CAD">CAD (C$)</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>

                            {/* Billing Interval */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Billing Interval
                                </label>
                                <select
                                    value={formData.billing_interval}
                                    onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value as BillingInterval })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            {/* Billing Interval Count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Every N intervals
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={formData.billing_interval_count}
                                    onChange={(e) => setFormData({ ...formData, billing_interval_count: parseInt(e.target.value || '1') })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    e.g., 2 = every 2 {formData.billing_interval === 'monthly' ? 'months' : formData.billing_interval === 'daily' ? 'days' : formData.billing_interval === 'weekly' ? 'weeks' : formData.billing_interval === 'quarterly' ? 'quarters' : 'years'}
                                </p>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Date*
                                </label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    End Date (Optional)
                                </label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'trial' | 'paused' })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="trial">Trial</option>
                                    <option value="paused">Paused</option>
                                </select>
                            </div>

                            {/* Setup Fee */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Setup Fee
                                </label>
                                <div className="relative">
                                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.setup_fee}
                                        onChange={(e) => setFormData({ ...formData, setup_fee: parseFloat(e.target.value || '0') })}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Auto Invoice */}
                            <div className="md:col-span-2 flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="auto_invoice"
                                    checked={formData.auto_invoice}
                                    onChange={(e) => setFormData({ ...formData, auto_invoice: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="auto_invoice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Auto-generate invoices on billing date
                                </label>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                                    placeholder="Internal notes about this subscription"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting} className="flex items-center">
                            <Save size={18} className="mr-2" />
                            {isSubmitting ? 'Saving...' : subscription ? 'Update Subscription' : 'Create Subscription'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SubscriptionModal;
