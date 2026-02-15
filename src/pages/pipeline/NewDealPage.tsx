import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Zap, Calendar,
    Tag as TagIcon, Info, Target, TrendingUp,
    Clock, Repeat, Building2, DollarSign
} from 'lucide-react';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { usePipelineConfigStore } from '@/stores/pipelineConfigStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useLenderStore } from '@/stores/lenderStore';
import { usePageLabels } from '@/hooks/usePageLabels';
import { Card, Button } from '@/components/theme/ThemeComponents';
import toast from 'react-hot-toast';

export default function NewDealPage() {
    const navigate = useNavigate();
    const { createDeal } = useDealStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const { stages } = usePipelineConfigStore();
    const { currentOrganization } = useOrganizationStore();
    const { lenders, fetchLenders, createLender } = useLenderStore();
    const labels = usePageLabels('pipeline');
    const isMortgage = currentOrganization?.industry_template === 'mortgage_broker';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [showQuickAddLender, setShowQuickAddLender] = useState(false);
    const [newLenderName, setNewLenderName] = useState('');
    const [newLenderCommission, setNewLenderCommission] = useState('');
    const [newLenderVolumeCommission, setNewLenderVolumeCommission] = useState('');
    const [addingLender, setAddingLender] = useState(false);

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
        lender_id: '',
        commission_percentage: '',
        volume_commission_percentage: '',
    });

    useEffect(() => {
        fetchCustomers();
        if (isMortgage) fetchLenders();
    }, [fetchCustomers, isMortgage, fetchLenders]);

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
        try {
            await createDeal({
                ...formData,
                title: formData.title.trim(),
                value: parseFloat(formData.value),
                probability: parseFloat(formData.probability) || 0,
                expected_close_date: formData.expected_close_date || undefined,
                description: formData.description || undefined,
                lender_id: formData.lender_id || undefined,
                commission_percentage: parseFloat(formData.commission_percentage) || 0,
                volume_commission_percentage: parseFloat(formData.volume_commission_percentage) || 0,
            });

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
                                Create New {labels.entitySingular}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Fill in the details to add this {labels.entitySingular} to your pipeline
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
                            {isSubmitting ? 'Creating...' : `Create ${labels.entitySingular}`}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 pt-8">
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
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
