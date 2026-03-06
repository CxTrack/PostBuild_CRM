import React, { useState, useEffect } from 'react';
import {
    X, Save, Building2, User, Mail, Phone, Globe, MapPin, Landmark,
    Clock, Edit, Plus, ChevronDown, ChevronRight
} from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';
import { Card, Button } from '@/components/theme/ThemeComponents';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { validateEmail, validatePhone } from '@/utils/validation';
import type { Supplier } from '@/types/app.types';
import { PAYMENT_TERMS_OPTIONS } from '@/config/paymentTerms';
import { COUNTRIES, getRegionsForCountry, isDomesticCountry } from '@/config/countries';
import { CURRENCIES } from '@/config/currencies';
import toast from 'react-hot-toast';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier?: Supplier;
}

type SectionKey = 'company' | 'contact' | 'address' | 'financial' | 'performance';

const inputClass = 'w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-sm';

const DEFAULTS: Partial<Supplier> = {
    name: '',
    code: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    region: '',
    postal_code: '',
    country: 'CA',
    address_format: 'domestic',
    tax_id: '',
    payment_terms: 'net_30',
    currency: 'CAD',
    status: 'active',
    rating: 5,
    lead_time_days: 7,
    notes: '',
};

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, supplier }) => {
    const { currentOrganization } = useOrganizationStore();
    const { createSupplier, updateSupplier } = useSupplierStore();
    const { theme } = useThemeStore();

    const [formData, setFormData] = useState<Partial<Supplier>>({ ...DEFAULTS });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        company: true,
        contact: true,
        address: true,
        financial: true,
        performance: false,
    });

    useEffect(() => {
        if (supplier) {
            setFormData({ ...DEFAULTS, ...supplier });
        } else {
            setFormData({ ...DEFAULTS });
        }
        setErrors({});
    }, [supplier, isOpen]);

    // Sync address format when country changes
    const handleCountryChange = (countryCode: string) => {
        const domestic = isDomesticCountry(countryCode);
        setFormData(prev => ({
            ...prev,
            country: countryCode,
            address_format: domestic ? 'domestic' : 'international',
            // Clear state/region when switching between domestic and international
            state: domestic ? prev.state : '',
            region: domestic ? '' : prev.region,
        }));
    };

    const toggleSection = (key: SectionKey) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) return null;

    const isDomestic = isDomesticCountry(formData.country || 'CA');
    const regions = isDomestic ? getRegionsForCountry(formData.country || 'CA') : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization?.id) return;

        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Company name is required';
        if (formData.email) {
            const emailResult = validateEmail(formData.email);
            if (!emailResult.isValid) newErrors.email = emailResult.error!;
        }
        if (formData.phone) {
            const phoneResult = validatePhone(formData.phone);
            if (!phoneResult.isValid) newErrors.phone = phoneResult.error!;
        }

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
                address_format: isDomestic ? 'domestic' as const : 'international' as const,
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

    const SectionHeader: React.FC<{ sectionKey: SectionKey; icon: React.ReactNode; title: string }> = ({ sectionKey, icon, title }) => (
        <button
            type="button"
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center justify-between w-full py-2 text-sm font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
            <span className="flex items-center gap-2">
                {icon}
                {title}
            </span>
            {openSections[sectionKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        {supplier ? <Edit size={22} className="mr-2" /> : <Plus size={22} className="mr-2" />}
                        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Status badge in header */}
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Supplier['status'] })}
                            className="px-3 py-1 rounded-lg bg-white/20 text-white text-sm border border-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none"
                        >
                            <option value="active" className="text-gray-900">Active</option>
                            <option value="inactive" className="text-gray-900">Inactive</option>
                            <option value="pending" className="text-gray-900">Pending</option>
                            <option value="blocked" className="text-gray-900">Blocked</option>
                        </select>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* ── Company Details ────────────────────────────── */}
                    <div>
                        <SectionHeader sectionKey="company" icon={<Building2 size={15} />} title="Company Details" />
                        {openSections.company && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Supplier Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className={inputClass}
                                        placeholder="e.g. SUP-001"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Website
                                    </label>
                                    <div className="relative">
                                        <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className={`${inputClass} pl-9`}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Primary Contact ──────────────────────────────── */}
                    <div>
                        <SectionHeader sectionKey="contact" icon={<User size={15} />} title="Primary Contact" />
                        {openSections.contact && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Contact Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => {
                                                setFormData({ ...formData, email: e.target.value });
                                                if (errors.email) setErrors({ ...errors, email: '' });
                                            }}
                                            className={`${inputClass} pl-9 ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                    </div>
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
                                        className={`rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Address & Localization ──────────────────────── */}
                    <div>
                        <SectionHeader sectionKey="address" icon={<MapPin size={15} />} title="Address" />
                        {openSections.address && (
                            <div className="space-y-4 mt-3">
                                {/* Country selector (drives domestic vs international) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Country
                                        </label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) => handleCountryChange(e.target.value)}
                                            className={inputClass}
                                        >
                                            {COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {isDomestic ? 'Domestic format' : 'International format'}
                                        </p>
                                    </div>
                                </div>

                                {/* Street address lines */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Street Address
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address_line1}
                                            onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address_line2}
                                            onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                                            className={inputClass}
                                            placeholder="Suite, unit, building..."
                                        />
                                    </div>
                                </div>

                                {/* City + State/Region + Postal */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isDomestic ? 'Province / State' : 'Region / Province'}
                                        </label>
                                        {isDomestic && regions.length > 0 ? (
                                            <select
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                className={inputClass}
                                            >
                                                <option value="">Select...</option>
                                                {regions.map(r => (
                                                    <option key={r.code} value={r.code}>{r.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formData.region || formData.state}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    region: e.target.value,
                                                    state: e.target.value,
                                                })}
                                                className={inputClass}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Postal / ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.postal_code}
                                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Financial Settings ────────────────────────────── */}
                    <div>
                        <SectionHeader sectionKey="financial" icon={<Landmark size={15} />} title="Financial Settings" />
                        {openSections.financial && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Currency
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className={inputClass}
                                    >
                                        {CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} - {c.name} ({c.symbol})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Terms
                                    </label>
                                    <select
                                        value={PAYMENT_TERMS_OPTIONS.find(o => o.key === formData.payment_terms) ? formData.payment_terms : (formData.payment_terms ? 'custom' : '')}
                                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                        className={inputClass}
                                    >
                                        <option value="">Select payment terms...</option>
                                        {PAYMENT_TERMS_OPTIONS.map(option => (
                                            <option key={option.key} value={option.key}>{option.label}</option>
                                        ))}
                                    </select>
                                    {formData.payment_terms && PAYMENT_TERMS_OPTIONS.find(o => o.key === formData.payment_terms) && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {PAYMENT_TERMS_OPTIONS.find(o => o.key === formData.payment_terms)?.description}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tax / Business ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tax_id}
                                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                        className={inputClass}
                                        placeholder="GST/HST, VAT, EIN..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Performance ───────────────────────────────────── */}
                    <div>
                        <SectionHeader sectionKey="performance" icon={<Clock size={15} />} title="Performance" />
                        {openSections.performance && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Lead Time (Days)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.lead_time_days}
                                        onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value || '0') })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Supplier Rating
                                    </label>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                className={`text-2xl transition-all ${formData.rating && formData.rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Notes ──────────────────────────────────────────── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Internal Notes
                        </label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className={inputClass}
                        />
                    </div>

                    {/* ── Actions ──────────────────────────────────────── */}
                    <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
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
