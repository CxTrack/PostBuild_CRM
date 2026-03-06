import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Edit, Mail, Phone, Globe, MapPin, Star,
    Building2, Package, FileText, Trash2, ExternalLink, Clock, Landmark
} from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import SupplierModal from '@/components/suppliers/SupplierModal';
import SupplierContactsList from '@/components/suppliers/SupplierContactsList';
import { Card, Button, PageContainer } from '@/components/theme/ThemeComponents';
import { PAYMENT_TERMS_OPTIONS } from '@/config/paymentTerms';
import { COUNTRIES } from '@/config/countries';
import { CURRENCIES } from '@/config/currencies';
import type { Supplier } from '@/types/app.types';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'products' | 'notes';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const SupplierProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        currentSupplier,
        fetchSupplierById,
        updateSupplier,
        deleteSupplier,
        relatedProducts,
        fetchRelatedProducts,
        loading,
    } = useSupplierStore();
    const { currentOrganization, currentMembership } = useOrganizationStore();

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showEditModal, setShowEditModal] = useState(false);
    const [notesText, setNotesText] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        if (id) {
            fetchSupplierById(id);
            fetchRelatedProducts(id);
        }
    }, [id]);

    useEffect(() => {
        if (currentSupplier?.notes) {
            setNotesText(currentSupplier.notes);
        }
    }, [currentSupplier?.notes]);

    const handleDelete = async () => {
        if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
            toast.error('You do not have permission to delete suppliers');
            return;
        }
        if (confirm('Are you sure you want to delete this supplier? This cannot be undone.')) {
            try {
                await deleteSupplier(currentSupplier!.id);
                toast.success('Supplier deleted');
                navigate('/dashboard/suppliers');
            } catch {
                toast.error('Failed to delete supplier');
            }
        }
    };

    const handleSaveNotes = async () => {
        if (!currentSupplier?.id) return;
        setSavingNotes(true);
        try {
            await updateSupplier(currentSupplier.id, { notes: notesText });
            toast.success('Notes saved');
        } catch {
            toast.error('Failed to save notes');
        } finally {
            setSavingNotes(false);
        }
    };

    const getPaymentTermLabel = (key?: string) => {
        if (!key) return '--';
        const match = PAYMENT_TERMS_OPTIONS.find(o => o.key === key);
        return match ? match.label : key;
    };

    const getCountryName = (code?: string) => {
        if (!code) return '--';
        const match = COUNTRIES.find(c => c.code === code);
        return match ? match.name : code;
    };

    const getCurrencyLabel = (code?: string) => {
        if (!code) return '--';
        const match = CURRENCIES.find(c => c.code === code);
        return match ? `${match.code} (${match.symbol})` : code;
    };

    // ── Loading & not found ─────────────────────────────────────────

    if (loading && !currentSupplier) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </PageContainer>
        );
    }

    if (!currentSupplier) {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center py-20">
                    <Building2 size={48} className="text-gray-400 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Supplier not found</h2>
                    <Button variant="secondary" onClick={() => navigate('/dashboard/suppliers')}>
                        <ArrowLeft size={16} className="mr-2" /> Back to Suppliers
                    </Button>
                </div>
            </PageContainer>
        );
    }

    const supplier = currentSupplier;
    const addressParts = [
        supplier.address_line1,
        supplier.address_line2,
        supplier.city,
        supplier.state || supplier.region,
        supplier.postal_code,
        getCountryName(supplier.country),
    ].filter(Boolean);

    // ── Render ──────────────────────────────────────────────────────

    return (
        <PageContainer>
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/dashboard/suppliers')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Suppliers
                </button>

                <Card className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl flex-shrink-0">
                                {supplier.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {supplier.name}
                                    </h1>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[supplier.status] || STATUS_COLORS.inactive}`}>
                                        {supplier.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {supplier.code && (
                                        <span className="font-mono">{supplier.code}</span>
                                    )}
                                    {supplier.rating && supplier.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    className={i < supplier.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {supplier.website && (
                                <a
                                    href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                    title="Visit website"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            )}
                            <Button variant="secondary" onClick={() => setShowEditModal(true)} className="flex items-center gap-2">
                                <Edit size={16} />
                                Edit
                            </Button>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete supplier"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
                {([
                    { key: 'overview', label: 'Overview' },
                    { key: 'products', label: `Products (${relatedProducts.length})` },
                    { key: 'notes', label: 'Notes' },
                ] as { key: TabType; label: string }[]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contacts */}
                        <Card>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Building2 size={15} />
                                Contacts
                            </h3>
                            <SupplierContactsList supplierId={supplier.id} />
                        </Card>

                        {/* Quick info cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {supplier.email && (
                                <Card className="flex items-center gap-3 p-4">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <Mail size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{supplier.email}</p>
                                    </div>
                                </Card>
                            )}
                            {supplier.phone && (
                                <Card className="flex items-center gap-3 p-4">
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                        <Phone size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{supplier.phone}</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Address */}
                        <Card>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin size={15} />
                                Address
                            </h3>
                            {addressParts.length > 0 ? (
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {supplier.address_line1 && <>{supplier.address_line1}<br /></>}
                                    {supplier.address_line2 && <>{supplier.address_line2}<br /></>}
                                    {[supplier.city, supplier.state || supplier.region, supplier.postal_code].filter(Boolean).join(', ')}
                                    {supplier.country && <><br />{getCountryName(supplier.country)}</>}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No address on file</p>
                            )}
                        </Card>

                        {/* Financial */}
                        <Card>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Landmark size={15} />
                                Financial
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Payment Terms</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{getPaymentTermLabel(supplier.payment_terms)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Currency</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{getCurrencyLabel(supplier.currency)}</span>
                                </div>
                                {supplier.tax_id && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Tax ID</span>
                                        <span className="font-medium text-gray-900 dark:text-white font-mono">{supplier.tax_id}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Performance */}
                        <Card>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={15} />
                                Performance
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Lead Time</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {supplier.lead_time_days ? `${supplier.lead_time_days} days` : '--'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Rating</span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < (supplier.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Products Linked</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{relatedProducts.length}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <Card>
                    {relatedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Package size={40} className="text-gray-400 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No linked products</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Link products to this supplier from the Products page.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">SKU</th>
                                        <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase">Unit Cost</th>
                                        <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase">Price</th>
                                        <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Min Order</th>
                                        <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Preferred</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatedProducts.map(rp => (
                                        <tr key={rp.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                                {rp.product_name || '--'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                {rp.product_sku || rp.supplier_sku || '--'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                                                ${rp.unit_cost?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                                                {rp.product_price ? `$${rp.product_price.toFixed(2)}` : '--'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                                                {rp.minimum_order_quantity || 1}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {rp.is_preferred ? (
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400 mx-auto" />
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'notes' && (
                <Card>
                    <div className="space-y-4">
                        <textarea
                            rows={8}
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-sm"
                            placeholder="Add internal notes about this supplier..."
                        />
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                onClick={handleSaveNotes}
                                disabled={savingNotes || notesText === (supplier.notes || '')}
                                className="flex items-center gap-2"
                            >
                                <FileText size={16} />
                                {savingNotes ? 'Saving...' : 'Save Notes'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Edit modal */}
            <SupplierModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    // Refresh after edit
                    if (id) fetchSupplierById(id);
                }}
                supplier={supplier}
            />
        </PageContainer>
    );
};

export default SupplierProfile;
