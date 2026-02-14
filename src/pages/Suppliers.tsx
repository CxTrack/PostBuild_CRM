import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Filter, Building2, User, Mail, Phone,
    Eye, Edit, Trash2, Star, MapPin
} from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useThemeStore } from '@/stores/themeStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import SupplierModal from '@/components/suppliers/SupplierModal';
import { Card, Button, PageContainer } from '@/components/theme/ThemeComponents';
import { usePageLabels } from '@/hooks/usePageLabels';
import toast from 'react-hot-toast';

export const Suppliers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending' | 'blocked'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(undefined);

    const { currentOrganization, currentMembership } = useOrganizationStore();
    const { suppliers, loading, fetchSuppliers, deleteSupplier } = useSupplierStore();
    const { theme } = useThemeStore();
    const labels = usePageLabels('suppliers');

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchSuppliers(currentOrganization.id);
        }
    }, [currentOrganization?.id]);

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch =
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.code?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (id: string) => {
        if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
            toast.error('You do not have permission to delete suppliers');
            return;
        }
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                await deleteSupplier(id);
                toast.success('Supplier deleted successfully');
            } catch (error) {
                toast.error('Failed to delete supplier');
            }
        }
    };

    const openEditModal = (supplier: any) => {
        setSelectedSupplier(supplier);
        setShowSupplierModal(true);
    };

    const openCreateModal = () => {
        setSelectedSupplier(undefined);
        setShowSupplierModal(true);
    };

    return (
        <PageContainer>
            <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {labels.subtitle}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={openCreateModal}
                        className="flex items-center"
                    >
                        <Plus size={20} className="mr-2" />
                        {labels.newButton}
                    </Button>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder={labels.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={
                                theme === 'soft-modern'
                                    ? 'w-full pl-10 pr-4 py-2 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] border-2 border-transparent focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400'
                                    : 'w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-500'
                            }
                        />
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400' : ''}
                    >
                        <Filter size={20} />
                    </Button>
                </div>

                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'active', 'inactive', 'pending', 'blocked'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <Building2 size={40} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {searchTerm ? `No ${labels.entityPlural} found` : labels.emptyStateTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                            {searchTerm ? 'Try adjusting your search or filters' : labels.emptyStateDescription}
                        </p>
                        {!searchTerm && (
                            <Button variant="primary" onClick={openCreateModal}>
                                {labels.emptyStateButton}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <Card key={supplier.id} className="hover:shadow-lg transition-all border-l-4 border-l-primary-500 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold mr-3">
                                            {supplier.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                {supplier.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                {supplier.code || 'NO-CODE'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(supplier)}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {supplier.contact_name && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <User size={14} className="mr-2 text-primary-500" />
                                            {supplier.contact_name}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Mail size={14} className="mr-2 text-primary-500" />
                                            {supplier.email}
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Phone size={14} className="mr-2 text-primary-500" />
                                            {supplier.phone}
                                        </div>
                                    )}
                                    {(supplier.city || supplier.country) && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <MapPin size={14} className="mr-2 text-primary-500" />
                                            {supplier.city}, {supplier.country}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < (supplier.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                            />
                                        ))}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${supplier.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            supplier.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                        {supplier.status}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <SupplierModal
                isOpen={showSupplierModal}
                onClose={() => {
                    setShowSupplierModal(false);
                    setSelectedSupplier(undefined);
                }}
                supplier={selectedSupplier}
            />
        </PageContainer>
    );
};

export default Suppliers;
