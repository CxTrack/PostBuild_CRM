import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Mail, Phone, Globe, MapPin, Landmark, Clock, Edit, Plus } from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';
import { Card, Button } from '@/components/theme/ThemeComponents';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { validateEmail, validatePhone } from '@/utils/validation';
import type { Supplier } from '@/types/app.types';
import toast from 'react-hot-toast';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier?: Supplier;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, supplier }) => {
    const { currentOrganization } = useOrganizationStore();
    const { createSupplier, updateSupplier } = useSupplierStore();
    const { theme } = useThemeStore();

    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        code: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        address_line1: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'CA',
        tax_id: '',
        payment_terms: 'Net 30',
        currency: 'CAD',
        status: 'active',
        rating: 5,
        lead_time_days: 7,
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
        } else {
            setFormData({
                name: '',
                code: '',
                contact_name: '',
                email: '',
                phone: '',
                website: '',
                address_line1: '',
                city: '',
                state: '',
                postal_code: '',
                country: 'CA',
                tax_id: '',
                payment_terms: 'Net 30',
                currency: 'CAD',
                status: 'active',
                rating: 5,
                lead_time_days: 7,
                notes: '',
            });
        }
    }, [supplier, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization?.id) return;

        // Validate fields
        const newErrors: Record<string, string> = {};
        const emailResult = validateEmail(formData.email);
        if (!emailResult.isValid) newErrors.email = emailResult.error!;
        const phoneResult = validatePhone(formData.phone);
        if (!phoneResult.isValid) newErrors.phone = phoneResult.error!;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        setIsSubmitting(true);
        try {
            const dataToSave = {
                ...formData,
                phone: formatPhoneForStorage(formData.phone),
            };

            if (supplier?.id) {
                await updateSupplier(supplier.id, dataToSave);
                toast.success('Supplier updated successfully');
            } else {
                await createSupplier({
                    ...dataToSave as any,
                    organization_id: currentOrganization.id,
                });
                toast.success('Supplier created successfully');
            }
            onClose();
        } catch (error) {
            toast.error('Failed to save supplier');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        {supplier ? <Edit size={24} className="mr-2" /> : <Plus size={24} className="mr-2" />}
                        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                <Building2 size={16} className="mr-2" />
                                Company Details
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Company Name*
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Supplier Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                    placeholder="e.g. SUP-001"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                <User size={16} className="mr-2" />
                                Contact Person
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({ ...formData, email: e.target.value });
                                            if (errors.email) setErrors({ ...errors, email: '' });
                                        }}
                                        className={`w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone
                                    </label>
                                    <PhoneInput
                                        value={formData.phone || ''}
                                        onChange={(e) => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            if (errors.phone) setErrors({ ...errors, phone: '' });
                                        }}
                                        className={`rounded-xl bg-gray-50 dark:bg-gray-900/50 ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                <MapPin size={16} className="mr-2" />
                                Address & Localization
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_line1}
                                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.postal_code}
                                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                <Landmark size={16} className="mr-2" />
                                Financial Settings
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Currency
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                    >
                                        <option value="CAD">CAD</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Terms
                                    </label>
                                    <select
                                        value={formData.payment_terms}
                                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                    >
                                        <option value="Immediate">Immediate</option>
                                        <option value="Net 15">Net 15</option>
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 60">Net 60</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tax / Business ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                    placeholder="GST/HST etc."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                <Clock size={16} className="mr-2" />
                                Performance
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Lead Time (Days)
                                </label>
                                <input
                                    type="number"
                                    value={formData.lead_time_days}
                                    onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value || '0') })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Supplier Rating (1-5)
                                </label>
                                <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            className={`text-2xl transition-all ${formData.rating && formData.rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-200'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Internal Notes
                            </label>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting} className="flex items-center">
                            <Save size={18} className="mr-2" />
                            {isSubmitting ? 'Saving...' : 'Save Supplier'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SupplierModal;
