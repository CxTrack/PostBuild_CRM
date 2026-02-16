import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Zap, Calendar,
    Tag as TagIcon, Info, Target, TrendingUp,
    Clock, Repeat, Building2, DollarSign, Home, ChevronRight, X
} from 'lucide-react';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { usePipelineConfigStore } from '@/stores/pipelineConfigStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useLenderStore } from '@/stores/lenderStore';
import { useProductStore } from '@/stores/productStore';
import { usePageLabels } from '@/hooks/usePageLabels';
import { Card, Button } from '@/components/theme/ThemeComponents';
import QuickAddCustomerModal from '@/components/shared/QuickAddCustomerModal';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/types/app.types';

export default function NewDealPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;
    const { createDeal, updateDeal, fetchDealById } = useDealStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const { stages } = usePipelineConfigStore();
    const { currentOrganization } = useOrganizationStore();
    const { lenders, fetchLenders, createLender } = useLenderStore();
    const { products, fetchProducts } = useProductStore();
    const labels = usePageLabels('pipeline');
    const isMortgage = currentOrganization?.industry_template === 'mortgage_broker';

    // Loan products for mortgage broker
    const loanProducts = useMemo(() => {
        if (!isMortgage) return [];
        return products.filter(p => p.is_active && p.loan_type);
    }, [isMortgage, products]);

    const [isLoadingDeal, setIsLoadingDeal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [showQuickAddLender, setShowQuickAddLender] = useState(false);
    const [newLenderName, setNewLenderName] = useState('');
    const [newLenderCommission, setNewLenderCommission] = useState('');
    const [newLenderVolumeCommission, setNewLenderVolumeCommission] = useState('');
    const [addingLender, setAddingLender] = useState(false);
    const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        customer_id: '',
        value: '',
        currency: currentOrganization?.metadata?.currency || 'USD',
        stage: '',
        probability: '',
        expected_close_date: '',
        source: 'other',
        revenue_type: 'one_time' as 'one_time' | 'recurring',
        recurring_interval: 'monthly' as 'monthly' | 'quarterly' | 'annual',
        description: '',
        tags: [] as string[],
        product_id: '',
        lender_id: '',
        commission_percentage: '',
        volume_commission_percentage: '',
    });

    useEffect(() => {
        fetchCustomers();
        if (isMortgage) {
            fetchLenders();
            fetchProducts(currentOrganization?.id);
        }
    }, [fetchCustomers, isMortgage, fetchLenders, fetchProducts, currentOrganization?.id]);

    // Load existing deal when editing
    useEffect(() => {
        if (!editId) return;
        setIsLoadingDeal(true);
        fetchDealById(editId).then(deal => {
            if (deal) {
                setFormData({
                    title: deal.title || '',
                    customer_id: deal.customer_id || '',
                    value: deal.value?.toString() || '',
                    currency: deal.currency || currentOrganization?.metadata?.currency || 'USD',
                    stage: deal.stage || '',
                    probability: deal.probability != null ? (deal.probability > 1 ? deal.probability.toString() : (deal.probability * 100).toString()) : '',
                    expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
                    source: deal.source || 'other',
                    revenue_type: deal.revenue_type || 'one_time',
                    recurring_interval: deal.recurring_interval || 'monthly',
                    description: deal.description || '',
                    tags: deal.tags || [],
                    product_id: deal.product_id || '',
                    lender_id: deal.lender_id || '',
                    commission_percentage: deal.commission_percentage?.toString() || '',
                    volume_commission_percentage: deal.volume_commission_percentage?.toString() || '',
                });
            } else {
                toast.error('Deal not found');
                navigate('/dashboard/pipeline');
            }
        }).finally(() => setIsLoadingDeal(false));
    }, [editId]);

    const availableStages = useMemo(() => {
        if (stages.length > 0) {
            return stages.map(s => ({
                key: s.stage_key,
                label: s.stage_label,
                probability: s.default_probability || 0
            }));
        }
        return [
            { key: 'lead', label: 'Lead', probability: 10 },
            { key: 'qualified', label: 'Qualified', probability: 25 },
            { key: 'proposal', label: 'Proposal', probability: 50 },
            { key: 'negotiation', label: 'Negotiation', probability: 75 },
        ];
    }, [stages]);

    useEffect(() => {
        if (availableStages.length > 0 && !formData.stage) {
            const defaultStage = availableStages[0];
            setFormData(prev => ({
                ...prev,
                stage: defaultStage.key,
                probability: defaultStage.probability.toString()
            }));
        }
    }, [availableStages, formData.stage]);

    const handleStageChange = (stageKey: string) => {
        const stage = availableStages.find(s => s.key === stageKey);
        setFormData(prev => ({
            ...prev,
            stage: stageKey,
            probability: stage ? stage.probability.toString() : prev.probability
        }));
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }));
    };

    const handleLoanProductChange = (productId: string) => {
        const product = loanProducts.find(p => p.id === productId);
        setFormData(prev => ({
            ...prev,
            product_id: productId,
            // Auto-fill title if empty
            title: prev.title || (product?.name || ''),
        }));
    };

    const selectedLoanProduct = loanProducts.find(p => p.id === formData.product_id);

    const handleLenderChange = (lenderId: string) => {
        const lender = lenders.find(l => l.id === lenderId);
        setFormData(prev => ({
            ...prev,
            lender_id: lenderId,
            commission_percentage: lender?.default_commission_pct?.toString() || prev.commission_percentage,
            volume_commission_percentage: lender?.default_volume_commission_pct?.toString() || prev.volume_commission_percentage,
        }));
    };

    const handleQuickAddLender = async () => {
        if (!newLenderName.trim()) return;
        setAddingLender(true);
        try {
            const lender = await createLender({
                name: newLenderName.trim(),
                default_commission_pct: parseFloat(newLenderCommission) || 0,
                default_volume_commission_pct: parseFloat(newLenderVolumeCommission) || 0,
            });
            handleLenderChange(lender.id);
            setShowQuickAddLender(false);
            setNewLenderName('');
            setNewLenderCommission('');
            setNewLenderVolumeCommission('');
        } catch {
            // Error handled in store
        } finally {
            setAddingLender(false);
        }
    };

    const selectedLender = lenders.find(l => l.id === formData.lender_id);
    const isCommissionFromLender = selectedLender &&
        formData.commission_percentage === selectedLender.default_commission_pct?.toString();
    const isVolumeFromLender = selectedLender &&
        formData.volume_commission_percentage === selectedLender.default_volume_commission_pct?.toString();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }
        if (!formData.customer_id) {
            toast.error('Please select a customer');
            return;
        }
        if (!formData.value || parseFloat(formData.value) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        const dealData = {
            title: formData.title.trim(),
            customer_id: formData.customer_id,
            value: parseFloat(formData.value),
            currency: formData.currency,
            stage: formData.stage,
            probability: parseFloat(formData.probability) || 0,
            expected_close_date: formData.expected_close_date || undefined,
            source: formData.source,
            revenue_type: formData.revenue_type,
            recurring_interval: formData.revenue_type === 'recurring' ? formData.recurring_interval : undefined,
            description: formData.description || undefined,
            tags: formData.tags,
            product_id: formData.product_id || undefined,
            lender_id: formData.lender_id || undefined,
            commission_percentage: parseFloat(formData.commission_percentage) || 0,
            volume_commission_percentage: parseFloat(formData.volume_commission_percentage) || 0,
        };
        try {
            if (isEditMode && editId) {
                await updateDeal(editId, dealData);
                toast.success(`${labels.entitySingular} updated`);
            } else {
                await createDeal(dealData);
            }
            navigate('/dashboard/pipeline');
        } catch {
            // Error handled in store
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-sm outline-none shadow-sm';
    const labelClasses = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-primary-500" size={24} />
                                {isEditMode ? `Edit ${labels.entitySingular}` : `Create New ${labels.entitySingular}`}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isEditMode ? `Update the details of this ${labels.entitySingular}` : `Fill in the details to add this ${labels.entitySingular} to your pipeline`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => handleSubmit(new Event('submit') as any)}
                            disabled={isSubmitting}
                            className="px-6 flex items-center gap-2 shadow-lg shadow-primary-500/20"
                        >
                            <Save size={18} />
                            {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? `Save ${labels.entitySingular}` : `Create ${labels.entitySingular}`)}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 pt-8">
                {isLoadingDeal ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Info className="text-primary-500" size={18} />
                                Basic Information
                            </h3>

                            <div className="space-y-6">
                                <div className="relative">
                                    <label className={labelClasses}>
                                        Title <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({ ...formData, title: e.target.value });
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className={inputClasses}
                                        placeholder={labels.titlePlaceholder || `e.g. "New ${labels.entitySingular}"`}
                                        autoComplete="off"
                                    />
                                    {showSuggestions && labels.titleSuggestions && labels.titleSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                            {labels.titleSuggestions
                                                .filter(s => !formData.title || s.toLowerCase().includes(formData.title.toLowerCase()))
                                                .map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setFormData({ ...formData, title: suggestion });
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors first:rounded-t-xl last:rounded-b-xl border-b last:border-0 border-gray-100 dark:border-gray-700"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClasses}>
                                        {labels.columns?.customer || 'Customer'} <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.customer_id}
                                            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                            className={`flex-1 ${inputClasses}`}
                                        >
                                            <option value="">Select a {labels.entitySingular}...</option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name || `${customer.first_name} ${customer.last_name} ${customer.company ? `(${customer.company})` : ''}`}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickAddCustomer(true)}
                                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"
                                            title={`Add new ${labels.columns?.customer || 'Customer'}`}
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Description</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={inputClasses}
                                        placeholder="Add more details about this opportunity..."
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Loan Product Selector (Mortgage only) */}
                        {isMortgage && (
                            <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Home className="text-primary-500" size={18} />
                                    Loan Product
                                </h3>

                                <div className="space-y-4">
                                    {loanProducts.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {loanProducts.map(product => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => handleLoanProductChange(product.id)}
                                                        className={`p-3 rounded-xl border-2 text-left transition-all ${formData.product_id === product.id
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{product.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {product.loan_type && (
                                                                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase rounded">
                                                                            {product.loan_type}
                                                                        </span>
                                                                    )}
                                                                    {product.interest_rate_type && (
                                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">
                                                                            {product.interest_rate_type}
                                                                        </span>
                                                                    )}
                                                                    {product.min_rate != null && product.max_rate != null && (
                                                                        <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                                                                            {product.min_rate}%&ndash;{product.max_rate}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {formData.product_id === product.id && (
                                                                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {formData.product_id && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, product_id: '' }))}
                                                    className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                                >
                                                    <X size={12} /> Clear selection
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                            <Home size={24} className="mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No loan products configured</p>
                                            <a
                                                href="/dashboard/products/new"
                                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1"
                                            >
                                                Add your first loan product <ChevronRight size={12} />
                                            </a>
                                        </div>
                                    )}

                                    {selectedLoanProduct && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {selectedLoanProduct.min_amount != null && selectedLoanProduct.max_amount != null && (
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Amount Range:</span>
                                                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                                            ${selectedLoanProduct.min_amount.toLocaleString()} &ndash; ${selectedLoanProduct.max_amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedLoanProduct.min_term_months != null && selectedLoanProduct.max_term_months != null && (
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Term:</span>
                                                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                                            {selectedLoanProduct.min_term_months} &ndash; {selectedLoanProduct.max_term_months} months
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedLoanProduct.down_payment_min_pct != null && (
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Min Down:</span>
                                                        <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedLoanProduct.down_payment_min_pct}%</span>
                                                    </div>
                                                )}
                                                {selectedLoanProduct.insurance_required && (
                                                    <div>
                                                        <span className="text-orange-600 dark:text-orange-400 font-medium">Mortgage insurance required</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Revenue Model */}
                        <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Repeat className="text-primary-500" size={18} />
                                Revenue Model
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Type</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, revenue_type: 'one_time' })}
                                            className={`py-2 text-sm font-medium rounded-lg transition-all ${formData.revenue_type === 'one_time'
                                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            One-time
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, revenue_type: 'recurring' })}
                                            className={`py-2 text-sm font-medium rounded-lg transition-all ${formData.revenue_type === 'recurring'
                                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            Recurring
                                        </button>
                                    </div>
                                </div>

                                {formData.revenue_type === 'recurring' && (
                                    <div>
                                        <label className={labelClasses}>Interval</label>
                                        <select
                                            value={formData.recurring_interval}
                                            onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value as any })}
                                            className={inputClasses}
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="annual">Annual</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Lender & Commission (Mortgage Broker only) */}
                        {isMortgage && (
                            <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Building2 className="text-primary-500" size={18} />
                                    Lender & Commission
                                </h3>

                                <div className="space-y-6">
                                    {/* Lender Selector */}
                                    <div>
                                        <label className={labelClasses}>Lender</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.lender_id}
                                                onChange={(e) => handleLenderChange(e.target.value)}
                                                className={`flex-1 ${inputClasses}`}
                                            >
                                                <option value="">Select a lender...</option>
                                                {lenders.map(lender => (
                                                    <option key={lender.id} value={lender.id}>
                                                        {lender.name}{lender.is_preferred ? ' \u2605' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickAddLender(!showQuickAddLender)}
                                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-600 dark:text-gray-400"
                                            >
                                                + New
                                            </button>
                                        </div>
                                        {selectedLender && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                Commission rates auto-filled from {selectedLender.name} defaults
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Add Lender Inline */}
                                    {showQuickAddLender && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                            <input
                                                type="text"
                                                value={newLenderName}
                                                onChange={(e) => setNewLenderName(e.target.value)}
                                                className={inputClasses}
                                                placeholder="Lender name"
                                                autoFocus
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Default Commission %</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        max="100"
                                                        value={newLenderCommission}
                                                        onChange={(e) => setNewLenderCommission(e.target.value)}
                                                        className={inputClasses}
                                                        placeholder="0.875"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Volume Commission %</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        max="100"
                                                        value={newLenderVolumeCommission}
                                                        onChange={(e) => setNewLenderVolumeCommission(e.target.value)}
                                                        className={inputClasses}
                                                        placeholder="0.25"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleQuickAddLender}
                                                    disabled={addingLender || !newLenderName.trim()}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {addingLender ? 'Adding...' : 'Add Lender'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQuickAddLender(false)}
                                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Commission Percentages */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>
                                                <DollarSign size={14} className="mr-1 text-green-500" />
                                                Commission %
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    max="100"
                                                    value={formData.commission_percentage}
                                                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                                                    className={`${inputClasses} ${isCommissionFromLender ? 'text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    placeholder="0.875"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>
                                                <DollarSign size={14} className="mr-1 text-blue-500" />
                                                Volume Bonus %
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    max="100"
                                                    value={formData.volume_commission_percentage}
                                                    onChange={(e) => setFormData({ ...formData, volume_commission_percentage: e.target.value })}
                                                    className={`${inputClasses} ${isVolumeFromLender ? 'text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    placeholder="0.25"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commission Amount Preview */}
                                    {formData.value && (parseFloat(formData.commission_percentage) > 0 || parseFloat(formData.volume_commission_percentage) > 0) && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            {parseFloat(formData.commission_percentage) > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-green-700 dark:text-green-400">Commission:</span>
                                                    <span className="font-semibold text-green-800 dark:text-green-300">
                                                        ${((parseFloat(formData.value) || 0) * (parseFloat(formData.commission_percentage) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                            {parseFloat(formData.volume_commission_percentage) > 0 && (
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-blue-700 dark:text-blue-400">Volume Bonus:</span>
                                                    <span className="font-semibold text-blue-800 dark:text-blue-300">
                                                        ${((parseFloat(formData.value) || 0) * (parseFloat(formData.volume_commission_percentage) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Tags */}
                        <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <TagIcon className="text-primary-500" size={18} />
                                Tags
                            </h3>

                            <div>
                                <label className={labelClasses}>
                                    Add Tags <span className="text-gray-400 text-xs ml-1">(Press Enter to add)</span>
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        className={inputClasses}
                                        placeholder="e.g. urgent, high-priority, vip"
                                    />

                                    {formData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {formData.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-primary-100 dark:border-primary-900/30"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="hover:text-primary-800 dark:hover:text-primary-200"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        {/* Value & Stage */}
                        <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Target className="text-primary-500" size={18} />
                                Financials & Stage
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className={labelClasses}>
                                        Value <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            className={`${inputClasses} pl-8`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>
                                        Stage <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => handleStageChange(e.target.value)}
                                        className={inputClasses}
                                    >
                                        {availableStages.map(stage => (
                                            <option key={stage.key} value={stage.key}>
                                                {stage.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClasses}>
                                        Probability (%)
                                    </label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.probability}
                                                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                                                className={inputClasses}
                                                placeholder="e.g. 50"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary-500 h-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(0, parseInt(formData.probability) || 0))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Timeline */}
                        <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Clock className="text-primary-500" size={18} />
                                Timeline & Source
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className={labelClasses}>
                                        Expected Close
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.expected_close_date}
                                            onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                                            className={`${inputClasses} pl-10`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Source</label>
                                    <select
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className={inputClasses}
                                    >
                                        <option value="other">Other</option>
                                        {(labels.sourceOptions || ['Referral', 'Website', 'Social Media', 'Walk-In', 'Cold Outreach']).map((opt, i) => (
                                            <option key={i} value={opt.toLowerCase().replace(/ /g, '_')}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Summary Widget */}
                        <div className="p-5 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl shadow-primary-500/20 text-white">
                            <h4 className="text-sm font-bold opacity-80 mb-4 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Forecast Summary
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs opacity-80">Projected Value</span>
                                    <span className="text-xl font-bold">
                                        ${parseFloat(formData.value || '0').toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end border-t border-white/20 pt-3">
                                    <span className="text-xs opacity-80">Weighted Value ({formData.probability || '0'}%)</span>
                                    <span className="text-lg font-semibold">
                                        ${((parseFloat(formData.value || '0') * (parseFloat(formData.probability || '0') / 100)) || 0).toLocaleString()}
                                    </span>
                                </div>
                                {isMortgage && parseFloat(formData.commission_percentage) > 0 && (
                                    <>
                                        <div className="flex justify-between items-end border-t border-white/20 pt-3">
                                            <span className="text-xs opacity-80">Projected Commission ({formData.commission_percentage}%)</span>
                                            <span className="text-lg font-semibold text-green-300">
                                                ${((parseFloat(formData.value || '0') * (parseFloat(formData.commission_percentage) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {parseFloat(formData.volume_commission_percentage) > 0 && (
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs opacity-80">Volume Bonus ({formData.volume_commission_percentage}%)</span>
                                                <span className="text-sm font-medium text-blue-300">
                                                    +${((parseFloat(formData.value || '0') * (parseFloat(formData.volume_commission_percentage) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-end border-t border-white/20 pt-3">
                                            <span className="text-xs font-bold opacity-90">Total Earnings</span>
                                            <span className="text-xl font-bold text-green-200">
                                                ${(
                                                    ((parseFloat(formData.value || '0') * (parseFloat(formData.commission_percentage) || 0) / 100)) +
                                                    ((parseFloat(formData.value || '0') * (parseFloat(formData.volume_commission_percentage) || 0) / 100))
                                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
                )}
            </main>

            {/* Quick Add Customer Modal */}
            <QuickAddCustomerModal
                isOpen={showQuickAddCustomer}
                onClose={() => setShowQuickAddCustomer(false)}
                onCustomerCreated={(customer) => {
                    setFormData(prev => ({ ...prev, customer_id: customer.id }));
                    setShowQuickAddCustomer(false);
                    fetchCustomers();
                }}
            />
        </div>
    );
}
