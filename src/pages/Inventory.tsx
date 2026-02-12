import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Package, AlertTriangle, RefreshCw, BarChart2, History
} from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PageContainer, Card, IconBadge, Button } from '@/components/theme/ThemeComponents';
import StockMovementModal from '@/components/inventory/StockMovementModal';

export const Inventory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

    const { products, fetchProducts } = useProductStore();
    const { fetchAlerts } = useInventoryStore();
    const { currentOrganization } = useOrganizationStore();

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchProducts(currentOrganization.id);
            fetchAlerts(currentOrganization.id);
        }
    }, [currentOrganization?.id]);

    const inventoryProducts = useMemo(() => {
        return products.filter(p => p.track_inventory);
    }, [products]);

    const filteredProducts = useMemo(() => {
        return inventoryProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

            const isLow = p.quantity_on_hand <= (p.low_stock_threshold || 5);
            const isOut = p.quantity_on_hand <= 0;

            if (filterType === 'low') return matchesSearch && isLow;
            if (filterType === 'out') return matchesSearch && isOut;
            return matchesSearch;
        });
    }, [inventoryProducts, searchTerm, filterType]);

    const stats = useMemo(() => {
        const totalItems = inventoryProducts.reduce((sum, p) => sum + (p.quantity_on_hand || 0), 0);
        const lowStock = inventoryProducts.filter(p => p.quantity_on_hand <= (p.low_stock_threshold || 5) && p.quantity_on_hand > 0).length;
        const outOfStock = inventoryProducts.filter(p => p.quantity_on_hand <= 0).length;
        const totalValue = inventoryProducts.reduce((sum, p) => sum + (p.quantity_on_hand * (p.cost || 0)), 0);

        return { totalItems, lowStock, outOfStock, totalValue };
    }, [inventoryProducts]);

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Track stock levels, movements, and replenishment
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    <IconBadge icon={<BarChart2 size={20} className="text-emerald-600" />} gradient="bg-emerald-50" />
                    <div className="ml-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Inventory Value</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalValue.toLocaleString()}</h3>
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
                                                ) : product.quantity_on_hand <= (product.low_stock_threshold || 5) ? (
                                                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold uppercase rounded-lg">Low Stock</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-lg">Healthy</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-gray-900 dark:text-white">
                                                {product.quantity_on_hand}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm text-gray-500">
                                                {product.low_stock_threshold || 5}
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
                    </>
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <History size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Movement History Coming Soon</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">
                            We are working on a detailed log of all stock adjustments, purchases, and sales.
                        </p>
                    </div>
                )}
            </Card>

            {selectedProduct && (
                <StockMovementModal
                    isOpen={showMovementModal}
                    onClose={() => {
                        setShowMovementModal(false);
                        setSelectedProduct(null);
                        fetchProducts(currentOrganization?.id); // Refresh stock levels
                    }}
                    product={selectedProduct}
                />
            )}
        </PageContainer>
    );
};

export default Inventory;
