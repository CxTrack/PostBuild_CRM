import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Filter, Building2, User, Mail, Phone,
    Edit, Trash2, Star, MapPin, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupplierStore } from '@/stores/supplierStore';
import { useThemeStore } from '@/stores/themeStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import SupplierModal from '@/components/suppliers/SupplierModal';
import { Card, Button, PageContainer } from '@/components/theme/ThemeComponents';
import { ResizableTable, type ColumnDef } from '@/components/compact/ResizableTable';
import { PAYMENT_TERMS_OPTIONS } from '@/config/paymentTerms';
import { usePageLabels } from '@/hooks/usePageLabels';
import type { Supplier } from '@/types/app.types';
import toast from 'react-hot-toast';

type ViewMode = 'compact' | 'grid';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const Suppliers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending' | 'blocked'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
    const [viewMode, setViewMode] = useState<ViewMode>('compact');
    const [sortColumn, setSortColumn] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const navigate = useNavigate();
    const { currentOrganization, currentMembership } = useOrganizationStore();
    const { suppliers, loading, fetchSuppliers, deleteSupplier } = useSupplierStore();
    const { theme } = useThemeStore();
    const labels = usePageLabels('suppliers');

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchSuppliers(currentOrganization.id);
        }
    }, [currentOrganization?.id]);

    const filteredSuppliers = useMemo(() => {
        let result = suppliers.filter(supplier => {
            const matchesSearch =
                supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.code?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
            return matchesSearch && matchesStatus;
        });

        // Sort for table view
        result.sort((a, b) => {
            const dir = sortDirection === 'asc' ? 1 : -1;
            switch (sortColumn) {
                case 'name':
                    return dir * a.name.localeCompare(b.name);
                case 'contact_name':
                    return dir * (a.contact_name || '').localeCompare(b.contact_name || '');
                case 'email':
                    return dir * (a.email || '').localeCompare(b.email || '');
                case 'status':
                    return dir * a.status.localeCompare(b.status);
                case 'rating':
                    return dir * ((a.rating || 0) - (b.rating || 0));
                case 'location':
                    return dir * (a.city || '').localeCompare(b.city || '');
                default:
                    return 0;
            }
        });
        return result;
    }, [suppliers, searchTerm, filterStatus, sortColumn, sortDirection]);

    // Stats
    const stats = useMemo(() => {
        const total = suppliers.length;
        const active = suppliers.filter(s => s.status === 'active').length;
        const inactive = suppliers.filter(s => s.status === 'inactive').length;
        const rated = suppliers.filter(s => s.rating && s.rating > 0);
        const avgRating = rated.length > 0
            ? (rated.reduce((sum, s) => sum + (s.rating || 0), 0) / rated.length).toFixed(1)
            : '--';
        return { total, active, inactive, avgRating };
    }, [suppliers]);

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
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

    const openEditModal = (supplier: Supplier, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedSupplier(supplier);
        setShowSupplierModal(true);
    };

    const openCreateModal = () => {
        setSelectedSupplier(undefined);
        setShowSupplierModal(true);
    };

    const handleSort = (columnId: string) => {
        if (sortColumn === columnId) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
    };

    const navigateToSupplier = (supplier: Supplier) => {
        navigate(`/dashboard/suppliers/${supplier.id}`);
    };

    const getPaymentTermLabel = (key?: string) => {
        if (!key) return '--';
        const match = PAYMENT_TERMS_OPTIONS.find(o => o.key === key);
        return match ? match.label : key;
    };

    // ── Table columns ──────────────────────────────────────────────────
    const columns: ColumnDef<Supplier>[] = useMemo(() => [
        {
            id: 'name',
            header: 'Name',
            defaultWidth: 220,
            minWidth: 140,
            render: (row) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs flex-shrink-0">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{row.name}</div>
                        {row.code && (
                            <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">{row.code}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: 'contact_name',
            header: 'Primary Contact',
            defaultWidth: 160,
            minWidth: 100,
            render: (row) => (
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {row.contact_name || '--'}
                </span>
            ),
        },
        {
            id: 'email',
            header: 'Email',
            defaultWidth: 200,
            minWidth: 120,
            render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {row.email || '--'}
                </span>
            ),
        },
        {
            id: 'phone',
            header: 'Phone',
            defaultWidth: 140,
            minWidth: 100,
            render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {row.phone || '--'}
                </span>
            ),
        },
        {
            id: 'location',
            header: 'Location',
            defaultWidth: 160,
            minWidth: 100,
            render: (row) => {
                const parts = [row.city, row.state || row.region, row.country].filter(Boolean);
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {parts.length > 0 ? parts.join(', ') : '--'}
                    </span>
                );
            },
        },
        {
            id: 'status',
            header: 'Status',
            defaultWidth: 100,
            minWidth: 80,
            align: 'center',
            render: (row) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[row.status] || STATUS_COLORS.inactive}`}>
                    {row.status}
                </span>
            ),
        },
        {
            id: 'rating',
            header: 'Rating',
            defaultWidth: 100,
            minWidth: 80,
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={11}
                            className={i < (row.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                        />
                    ))}
                </div>
            ),
        },
        {
            id: 'payment_terms',
            header: 'Payment Terms',
            defaultWidth: 130,
            minWidth: 90,
            render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {getPaymentTermLabel(row.payment_terms)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            defaultWidth: 70,
            minWidth: 60,
            resizable: false,
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={(e) => openEditModal(row, e)}
                        className="p-1 text-gray-400 hover:text-primary-600 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="Edit"
                    >
                        <Edit size={14} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(row.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ], []);

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <PageContainer>
            <Card className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
                        <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {labels.subtitle}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact'
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                                title="Table view"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                                title="Card view"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <Button
                            variant="primary"
                            onClick={openCreateModal}
                            className="flex items-center justify-center w-full md:w-auto"
                        >
                            <Plus size={20} className="mr-2" />
                            {labels.newButton}
                        </Button>
                    </div>
                </div>

                {/* Stats bar */}
                {suppliers.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 dark:text-gray-400">Total:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-gray-500 dark:text-gray-400">Active:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.active}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <span className="text-gray-500 dark:text-gray-400">Inactive:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.inactive}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-500 dark:text-gray-400">Avg Rating:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.avgRating}</span>
                        </div>
                    </div>
                )}

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
                                    ? 'w-full pl-10 pr-4 py-2 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] border-2 border-transparent focus:border-blue-500 transition-all text-gray-700 placeholder:text-gray-400'
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
                ) : viewMode === 'compact' ? (
                    /* ── Table View ───────────────────────────────── */
                    <Card className="p-0 overflow-hidden">
                        <ResizableTable<Supplier>
                            columns={columns}
                            data={filteredSuppliers}
                            onRowClick={navigateToSupplier}
                            onSort={handleSort}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            storageKey="suppliers-table"
                            maxHeight="calc(100vh - 380px)"
                        />
                    </Card>
                ) : (
                    /* ── Card Grid View ───────────────────────────── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <Card
                                key={supplier.id}
                                className="hover:shadow-lg transition-all border-l-4 border-l-primary-500 group cursor-pointer"
                                onClick={() => navigateToSupplier(supplier)}
                            >
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
                                            onClick={(e) => openEditModal(supplier, e)}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(supplier.id, e)}
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
                                            {[supplier.city, supplier.state || supplier.region, supplier.country].filter(Boolean).join(', ')}
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
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[supplier.status] || STATUS_COLORS.inactive}`}>
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
