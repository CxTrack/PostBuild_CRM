import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Package, AlertTriangle, RefreshCw, History, TrendingUp, DollarSign,
    ArrowUp, ArrowDown, RotateCcw, Filter, Loader2
} from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PageContainer, Card, IconBadge, Button } from '@/components/theme/ThemeComponents';
import StockMovementModal from '@/components/inventory/StockMovementModal';
import { usePageLabels } from '@/hooks/usePageLabels';
import type { MovementType } from '@/types/app.types';

const MOVEMENT_CONFIG: Record<MovementType, { label: string; icon: React.ElementType; color: string; bg: string; sign: string }> = {
    in: { label: 'Stock In', icon: ArrowUp, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', sign: '+' },
    out: { label: 'Stock Out', icon: ArrowDown, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', sign: '-' },
    adjustment: { label: 'Adjustment', icon: RefreshCw, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', sign: '~' },
    return: { label: 'Return', icon: RotateCcw, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', sign: '+' },
};

export const Inventory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

    // Movement History filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | MovementType>('all');
    const [historyProductFilter, setHistoryProductFilter] = useState<string>('all');

    const { products, fetchProducts } = useProductStore();
    const { fetchAlerts, fetchAllMovements, allMovements, movementsLoading } = useInventoryStore();
    const { currentOrganization } = useOrganizationStore();
    const labels = usePageLabels('inventory');

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchProducts(currentOrganization.id);
            fetchAlerts(currentOrganization.id);
        }
    }, [currentOrganization?.id]);

    // Fetch movements when history tab is activated
    useEffect(() => {
        if (activeTab === 'history' && currentOrganization?.id) {
            fetchAllMovements(currentOrganization.id);
        }
    }, [activeTab, currentOrganization?.id]);

    const inventoryProducts = useMemo(() => {
        return products.filter(p => p.track_inventory);
    }, [products]);

    // Product name lookup map
    const productMap = useMemo(() => {
        const map = new Map<string, { name: string; sku: string }>();
        products.forEach(p => map.set(p.id, { name: p.name, sku: p.sku || '' }));
        return map;
    }, [products]);

    const filteredProducts = useMemo(() => {
        return inventoryProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

            const isLow = p.quantity_on_hand <= (p.low_stock_threshold ?? 5);
            const isOut = p.quantity_on_hand <= 0;

            if (filterType === 'low') return matchesSearch && isLow;
            if (filterType === 'out') return matchesSearch && isOut;
            return matchesSearch;
        });
    }, [inventoryProducts, searchTerm, filterType]);

    // Filtered movement history
    const filteredMovements = useMemo(() => {
        return allMovements.filter(m => {
            if (historyTypeFilter !== 'all' && m.movement_type !== historyTypeFilter) return false;
            if (historyProductFilter !== 'all' && m.product_id !== historyProductFilter) return false;
            if (historySearch) {
                const product = productMap.get(m.product_id);
                const productName = product?.name?.toLowerCase() || '';
                const productSku = product?.sku?.toLowerCase() || '';
                const search = historySearch.toLowerCase();
                if (!productName.includes(search) && !productSku.includes(search) && !(m.reason || '').toLowerCase().includes(search)) {
                    return false;
                }
            }
            return true;
        });
    }, [allMovements, historyTypeFilter, historyProductFilter, historySearch, productMap]);

    const stats = useMemo(() => {
        const totalItems = inventoryProducts.reduce((sum, p) => sum + (p.quantity_on_hand || 0), 0);
        const lowStock = inventoryProducts.filter(p => p.quantity_on_hand <= (p.low_stock_threshold ?? 5) && p.quantity_on_hand > 0).length;
        const outOfStock = inventoryProducts.filter(p => p.quantity_on_hand <= 0).length;
        const totalCost = inventoryProducts.reduce((sum, p) => sum + ((p.quantity_on_hand || 0) * (p.cost || 0)), 0);
        const totalRevenue = inventoryProducts.reduce((sum, p) => sum + ((p.quantity_on_hand || 0) * (p.price || 0)), 0);

        return { totalItems, lowStock, outOfStock, totalCost, totalRevenue };
    }, [inventoryProducts]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {labels.subtitle}
                    </p>
                </div>
            </div>

            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="flex items-center p-4">
                    <IconBadge icon={<Package size={20} className="text-blue-600" />} gradient="bg-blue-50" />
                    <div className="ml-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Total Stock</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</h3>
                    </div>
                </Card>
                <Card className="flex items-center p-4">
                    <IconBadge icon={<AlertTriangle size={20} className="text-orange-600" />} gradient="bg-orange-50" />
                    <div className="ml-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Low Stock</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stats.lowStock}</h3>
                    </div>
                </Card>
                <Card className="flex items-center p-4 text-rose-600">
                    <IconBadge icon={<AlertTriangle size={20} className="text-rose-600" />} gradient="bg-rose-50" />
                    <div className="ml-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Out of Stock</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stats.outOfStock}</h3>
                    </div>
                </Card>
                <Card className="flex items-center p-4">
                    <IconBadge icon={<DollarSign size={20} className="text-amber-600" />} gradient="bg-amber-50" />
                    <div className="ml-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Inventory Cost</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalCost.toLocaleString()}</h3>
                    </div>
                </Card>
                <Card className="flex items-center p-4">
                    <IconBadge icon={<TrendingUp size={20} className="text-emerald-600" />} gradient="bg-emerald-50" />
                    <div className="ml-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Potential Revenue</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </Card>
            </div>

            <Card className="mb-6">
                <div className="flex items-center space-x-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'stock' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
                            }`}
                    >
                        Current Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
                            }`}
                    >
                        Movement History
                    </button>
                </div>

                {activeTab === 'stock' ? (
                    <>
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by product name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                                />
                            </div>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                {(['all', 'low', 'out'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterType === type ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {type === 'all' ? 'All Items' : type === 'low' ? 'Low Stock' : 'Out of Stock'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">In Stock</th>
                                        <th className="px-4 py-3 text-center">Threshold</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                <div className="text-xs text-gray-500">{product.category}</div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-mono text-gray-500">{product.sku || 'N/A'}</td>
                                            <td className="px-4 py-4 text-center">
                                                {product.quantity_on_hand <= 0 ? (
                                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase rounded-lg">Out of Stock</span>
                                                ) : product.quantity_on_hand <= (product.low_stock_threshold ?? 5) ? (
                                                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold uppercase rounded-lg">Low Stock</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-lg">Healthy</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-gray-900 dark:text-white">
                                                {product.quantity_on_hand}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm text-gray-500">
                                                {product.low_stock_threshold ?? 5}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setShowMovementModal(true);
                                                    }}
                                                    className="flex items-center ml-auto"
                                                >
                                                    <RefreshCw size={14} className="mr-1" />
                                                    Adjust
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16">
                                <Package size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {searchTerm || filterType !== 'all' ? 'No products match your filters.' : 'No inventory-tracked products yet.'}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    /* ── Movement History Tab ── */
                    <>
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-3 mb-6">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by product, SKU, or reason..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-gray-400 shrink-0" />
                                <select
                                    value={historyProductFilter}
                                    onChange={(e) => setHistoryProductFilter(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="all">All Products</option>
                                    {inventoryProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={historyTypeFilter}
                                    onChange={(e) => setHistoryTypeFilter(e.target.value as 'all' | MovementType)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="in">Stock In</option>
                                    <option value="out">Stock Out</option>
                                    <option value="adjustment">Adjustment</option>
                                    <option value="return">Return</option>
                                </select>
                            </div>
                        </div>

                        {movementsLoading ? (
                            <div className="text-center py-20">
                                <Loader2 size={32} className="mx-auto text-primary-500 animate-spin mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading movement history...</p>
                            </div>
                        ) : filteredMovements.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <History size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Movement History</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mt-1">
                                    {allMovements.length > 0
                                        ? 'No movements match your current filters.'
                                        : 'Stock adjustments will appear here once you make changes via the "Adjust" button on the Current Stock tab.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3 text-center">Type</th>
                                            <th className="px-4 py-3 text-center">Change</th>
                                            <th className="px-4 py-3 text-center hidden md:table-cell">Stock Level</th>
                                            <th className="px-4 py-3">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredMovements.map((movement) => {
                                            const config = MOVEMENT_CONFIG[movement.movement_type] || MOVEMENT_CONFIG.adjustment;
                                            const Icon = config.icon;
                                            const product = productMap.get(movement.product_id);
                                            const qtyChange = movement.quantity;
                                            const isPositive = movement.movement_type === 'in' || movement.movement_type === 'return';

                                            return (
                                                <tr key={movement.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {formatDate(movement.created_at)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatTime(movement.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {product?.name || 'Unknown Product'}
                                                        </div>
                                                        {product?.sku && (
                                                            <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>
                                                            <Icon size={12} />
                                                            {config.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-sm font-bold ${
                                                            movement.movement_type === 'adjustment'
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : isPositive
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                            {movement.movement_type === 'adjustment'
                                                                ? (qtyChange >= 0 ? `+${qtyChange}` : qtyChange)
                                                                : isPositive
                                                                    ? `+${Math.abs(qtyChange)}`
                                                                    : `-${Math.abs(qtyChange)}`
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center hidden md:table-cell">
                                                        <span className="text-xs text-gray-500">
                                                            {movement.previous_quantity}
                                                            <span className="mx-1 text-gray-400">&rarr;</span>
                                                            <span className="font-bold text-gray-900 dark:text-white">{movement.new_quantity}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                                            {movement.reason || '—'}
                                                        </div>
                                                        {movement.notes && (
                                                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                                                                {movement.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                                    Showing {filteredMovements.length} movement{filteredMovements.length !== 1 ? 's' : ''}
                                    {allMovements.length !== filteredMovements.length && ` of ${allMovements.length} total`}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {selectedProduct && (
                <StockMovementModal
                    isOpen={showMovementModal}
                    onClose={() => {
                        setShowMovementModal(false);
                        setSelectedProduct(null);
                        fetchProducts(currentOrganization?.id); // Refresh stock levels
                        if (activeTab === 'history' && currentOrganization?.id) {
                            fetchAllMovements(currentOrganization.id); // Refresh history
                        }
                    }}
                    product={selectedProduct}
                />
            )}
        </PageContainer>
    );
};

export default Inventory;
