import React, { useState, useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useLenderStore, Lender } from '@/stores/lenderStore';
import { useThemeStore } from '@/stores/themeStore';
import { Card, Button, Badge, Modal } from '@/components/theme/ThemeComponents';
import { PhoneInput } from '@/components/ui/PhoneInput';
import {
    Building2,
    Phone,
    Star,
    Clock,
    Plus,
    Edit,
    Trash2,
    DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

export const LenderDirectory: React.FC = () => {
    const { currentOrganization } = useOrganizationStore();
    const { lenders, loading, fetchLenders, createLender, updateLender, deleteLender } = useLenderStore();
    const { theme } = useThemeStore();
    const [showForm, setShowForm] = useState(false);
    const [editingLender, setEditingLender] = useState<Lender | null>(null);
    const [formSaving, setFormSaving] = useState(false);

    const emptyForm = {
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        account_executive: '',
        ae_phone: '',
        ae_email: '',
        loan_types: '',
        min_credit_score: '',
        is_preferred: false,
        avg_turn_time_days: '',
        rating: '3',
        notes: '',
        default_commission_pct: '',
        default_volume_commission_pct: '',
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchLenders();
        }
    }, [currentOrganization, fetchLenders]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingLender(null);
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (lender: Lender) => {
        setEditingLender(lender);
        setFormData({
            name: lender.name,
            contact_name: lender.contact_name || '',
            contact_email: lender.contact_email || '',
            contact_phone: lender.contact_phone || '',
            account_executive: lender.account_executive || '',
            ae_phone: lender.ae_phone || '',
            ae_email: lender.ae_email || '',
            loan_types: (lender.loan_types || []).join(', '),
            min_credit_score: lender.min_credit_score?.toString() || '',
            is_preferred: lender.is_preferred,
            avg_turn_time_days: lender.avg_turn_time_days?.toString() || '',
            rating: lender.rating?.toString() || '3',
            notes: lender.notes || '',
            default_commission_pct: lender.default_commission_pct?.toString() || '',
            default_volume_commission_pct: lender.default_volume_commission_pct?.toString() || '',
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Lender name is required');
            return;
        }
        setFormSaving(true);
        try {
            const payload: Partial<Lender> = {
                name: formData.name.trim(),
                contact_name: formData.contact_name || null,
                contact_email: formData.contact_email || null,
                contact_phone: formData.contact_phone || null,
                account_executive: formData.account_executive || null,
                ae_phone: formData.ae_phone || null,
                ae_email: formData.ae_email || null,
                loan_types: formData.loan_types.split(',').map(t => t.trim()).filter(Boolean),
                min_credit_score: formData.min_credit_score ? parseInt(formData.min_credit_score) : null,
                is_preferred: formData.is_preferred,
                avg_turn_time_days: formData.avg_turn_time_days ? parseInt(formData.avg_turn_time_days) : null,
                rating: formData.rating ? parseInt(formData.rating) : null,
                notes: formData.notes || null,
                default_commission_pct: parseFloat(formData.default_commission_pct) || 0,
                default_volume_commission_pct: parseFloat(formData.default_volume_commission_pct) || 0,
            };

            if (editingLender) {
                await updateLender(editingLender.id, payload);
            } else {
                await createLender(payload);
            }
            setShowForm(false);
            resetForm();
        } catch {
            // error handled in store
        } finally {
            setFormSaving(false);
        }
    };

    const handleDelete = async (lender: Lender) => {
        if (!confirm(`Delete "${lender.name}"? This cannot be undone.`)) return;
        try {
            await deleteLender(lender.id);
        } catch {
            // error handled in store
        }
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                size={14}
                className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
            />
        ));
    };

    const textPrimary = theme === 'soft-modern'
        ? 'text-slate-900'
        : 'text-gray-900 dark:text-white';

    const textSecondary = theme === 'soft-modern'
        ? 'text-slate-600'
        : 'text-gray-600 dark:text-gray-400';

    const textMuted = theme === 'soft-modern'
        ? 'text-slate-500'
        : 'text-gray-500 dark:text-gray-500';

    const inputClasses = 'w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-sm outline-none';

    if (loading) {
        return (
            <div className={`animate-pulse ${textSecondary}`}>
                Loading lenders...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${textPrimary}`}>
                        Lender Directory
                    </h2>
                    <p className={textSecondary}>
                        Manage your lender relationships
                    </p>
                </div>
                <Button variant="primary" onClick={openAddForm}>
                    <Plus size={18} className="mr-2" />
                    Add Lender
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lenders.map((lender) => (
                    <Card
                        key={lender.id}
                        hover
                        className={lender.is_preferred ? 'ring-2 ring-yellow-400' : ''}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lender.is_preferred
                                    ? 'bg-yellow-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                    }`}>
                                    <Building2
                                        className={lender.is_preferred ? 'text-white' : 'text-blue-600 dark:text-blue-400'}
                                        size={20}
                                    />
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${textPrimary}`}>
                                        {lender.name}
                                    </h3>
                                    {lender.is_preferred && (
                                        <Badge variant="warning">Preferred</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => openEditForm(lender)}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Edit size={14} className={textMuted} />
                                </button>
                                <button
                                    onClick={() => handleDelete(lender)}
                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            {lender.account_executive && (
                                <div className={textSecondary}>
                                    <span className="font-medium">AE:</span> {lender.account_executive}
                                </div>
                            )}
                            {lender.ae_phone && (
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <Phone size={12} />
                                    <a
                                        href={`tel:${lender.ae_phone}`}
                                        className="hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                        {lender.ae_phone}
                                    </a>
                                </div>
                            )}
                            {lender.avg_turn_time_days && (
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <Clock size={12} />
                                    <span>Avg: {lender.avg_turn_time_days} days</span>
                                </div>
                            )}
                            {(lender.default_commission_pct > 0 || lender.default_volume_commission_pct > 0) && (
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <DollarSign size={12} />
                                    <span>
                                        {lender.default_commission_pct > 0 ? `${lender.default_commission_pct}%` : ''}
                                        {lender.default_commission_pct > 0 && lender.default_volume_commission_pct > 0 ? ' + ' : ''}
                                        {lender.default_volume_commission_pct > 0 ? `${lender.default_volume_commission_pct}% vol` : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {renderStars(lender.rating || 0)}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {lender.loan_types?.slice(0, 2).map((type) => (
                                    <Badge key={type} variant="default">
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {lenders.length === 0 && (
                <Card className="text-center py-12">
                    <Building2 className={`mx-auto mb-4 ${textMuted}`} size={48} />
                    <h3 className={`text-lg font-medium ${textSecondary}`}>
                        No lenders yet
                    </h3>
                    <p className={`mb-4 ${textMuted}`}>
                        Add your first lender to start tracking relationships
                    </p>
                    <Button variant="primary" onClick={openAddForm}>
                        Add First Lender
                    </Button>
                </Card>
            )}

            {/* Lender Form Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => { setShowForm(false); resetForm(); }}
                title={editingLender ? 'Edit Lender' : 'Add New Lender'}
                maxWidth="xl"
            >
                <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Lender Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={inputClasses}
                                placeholder="e.g. First National Bank"
                                autoFocus
                            />
                        </div>

                        {/* Contact Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contact Name
                            </label>
                            <input
                                type="text"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                className={inputClasses}
                                placeholder="Main contact"
                            />
                        </div>

                        {/* Contact Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contact Email
                            </label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className={inputClasses}
                                placeholder="contact@lender.com"
                            />
                        </div>

                        {/* Contact Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contact Phone
                            </label>
                            <PhoneInput
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            />
                        </div>

                        {/* Account Executive */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Account Executive
                            </label>
                            <input
                                type="text"
                                value={formData.account_executive}
                                onChange={(e) => setFormData({ ...formData, account_executive: e.target.value })}
                                className={inputClasses}
                                placeholder="Your AE name"
                            />
                        </div>

                        {/* AE Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                AE Phone
                            </label>
                            <PhoneInput
                                value={formData.ae_phone}
                                onChange={(e) => setFormData({ ...formData, ae_phone: e.target.value })}
                            />
                        </div>

                        {/* AE Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                AE Email
                            </label>
                            <input
                                type="email"
                                value={formData.ae_email}
                                onChange={(e) => setFormData({ ...formData, ae_email: e.target.value })}
                                className={inputClasses}
                                placeholder="ae@lender.com"
                            />
                        </div>

                        {/* Loan Types */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Loan Types <span className="text-gray-400 text-xs">(comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.loan_types}
                                onChange={(e) => setFormData({ ...formData, loan_types: e.target.value })}
                                className={inputClasses}
                                placeholder="Conventional, CMHC, HELOC, Refinance"
                            />
                        </div>

                        {/* Commission Defaults */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <DollarSign size={14} className="text-green-500" />
                                Default Commission %
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="100"
                                value={formData.default_commission_pct}
                                onChange={(e) => setFormData({ ...formData, default_commission_pct: e.target.value })}
                                className={inputClasses}
                                placeholder="0.875"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <DollarSign size={14} className="text-blue-500" />
                                Volume Commission %
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="100"
                                value={formData.default_volume_commission_pct}
                                onChange={(e) => setFormData({ ...formData, default_volume_commission_pct: e.target.value })}
                                className={inputClasses}
                                placeholder="0.25"
                            />
                        </div>

                        {/* Min Credit Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Credit Score
                            </label>
                            <input
                                type="number"
                                min="300"
                                max="900"
                                value={formData.min_credit_score}
                                onChange={(e) => setFormData({ ...formData, min_credit_score: e.target.value })}
                                className={inputClasses}
                                placeholder="650"
                            />
                        </div>

                        {/* Avg Turn Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Avg Turn Time (days)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.avg_turn_time_days}
                                onChange={(e) => setFormData({ ...formData, avg_turn_time_days: e.target.value })}
                                className={inputClasses}
                                placeholder="5"
                            />
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rating
                            </label>
                            <select
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                className={inputClasses}
                            >
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                            </select>
                        </div>

                        {/* Preferred Toggle */}
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_preferred}
                                    onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400" />
                            </label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Lender</span>
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
                                className={inputClasses}
                                placeholder="Additional notes about this lender..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { setShowForm(false); resetForm(); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={formSaving || !formData.name.trim()}
                        >
                            {formSaving ? 'Saving...' : editingLender ? 'Update Lender' : 'Add Lender'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LenderDirectory;
