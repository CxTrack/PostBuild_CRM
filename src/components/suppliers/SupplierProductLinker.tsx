import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Star, Save, Trash2, Edit2, Package, X } from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useProductStore } from '@/stores/productStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import type { ProductSupplier } from '@/types/app.types';
import type { ProductSupplierWithDetails } from '@/stores/supplierStore';
import toast from 'react-hot-toast';

interface SupplierProductLinkerProps {
    supplierId: string;
    organizationId: string;
}

interface LinkFormState {
    product_id: string;
    supplier_sku: string;
    unit_cost: number | '';
    minimum_order_quantity: number | '';
    is_preferred: boolean;
}

const EMPTY_FORM: LinkFormState = {
    product_id: '',
    supplier_sku: '',
    unit_cost: '',
    minimum_order_quantity: '',
    is_preferred: false,
};

const SupplierProductLinker: React.FC<SupplierProductLinkerProps> = ({
    supplierId,
    organizationId,
}) => {
    const {
        relatedProducts,
        fetchRelatedProducts,
        linkProduct,
        updateProductLink,
        unlinkProduct,
    } = useSupplierStore();
    const { products, fetchProducts } = useProductStore();
    const { currentOrganization } = useOrganizationStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<LinkFormState>({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        await Promise.all([
            fetchRelatedProducts(supplierId),
            fetchProducts(currentOrganization?.id),
        ]);
    }, [supplierId, currentOrganization?.id, fetchRelatedProducts, fetchProducts]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter out already-linked products
    const linkedProductIds = new Set(relatedProducts.map(rp => rp.product_id));
    const availableProducts = products.filter(p => !linkedProductIds.has(p.id) && p.is_active !== false);

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!form.product_id) {
            toast.error('Please select a product');
            return;
        }
        setSaving(true);
        try {
            const result = await linkProduct({
                organization_id: organizationId,
                product_id: form.product_id,
                supplier_id: supplierId,
                supplier_sku: form.supplier_sku || undefined,
                unit_cost: Number(form.unit_cost) || 0,
                minimum_order_quantity: Number(form.minimum_order_quantity) || 1,
                is_preferred: form.is_preferred,
            } as Omit<ProductSupplier, 'id' | 'created_at'>);
            if (result) {
                toast.success('Product linked successfully');
                resetForm();
                await fetchRelatedProducts(supplierId);
            }
        } catch {
            toast.error('Failed to link product');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            await updateProductLink(editingId, {
                supplier_sku: form.supplier_sku || undefined,
                unit_cost: Number(form.unit_cost) || 0,
                minimum_order_quantity: Number(form.minimum_order_quantity) || 1,
                is_preferred: form.is_preferred,
            });
            toast.success('Product link updated');
            resetForm();
            await fetchRelatedProducts(supplierId);
        } catch {
            toast.error('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleUnlink = async (id: string, productName?: string) => {
        if (!confirm(`Remove ${productName || 'this product'} from this supplier?`)) return;
        try {
            await unlinkProduct(id);
            toast.success('Product unlinked');
        } catch {
            toast.error('Failed to unlink product');
        }
    };

    const startEdit = (rp: ProductSupplierWithDetails) => {
        setEditingId(rp.id);
        setIsAdding(false);
        setForm({
            product_id: rp.product_id,
            supplier_sku: rp.supplier_sku || '',
            unit_cost: rp.unit_cost || '',
            minimum_order_quantity: rp.minimum_order_quantity || '',
            is_preferred: rp.is_preferred,
        });
    };

    const togglePreferred = async (rp: ProductSupplierWithDetails) => {
        await updateProductLink(rp.id, { is_preferred: !rp.is_preferred });
        await fetchRelatedProducts(supplierId);
    };

    const inputClass = 'w-full px-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white';

    const renderForm = (mode: 'add' | 'edit') => (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 mx-4 mb-4">
            {mode === 'add' && (
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Product</label>
                    <select
                        value={form.product_id}
                        onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                        className={inputClass}
                    >
                        <option value="">Select a product...</option>
                        {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                        ))}
                    </select>
                    {availableProducts.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            No available products to link. All products are already linked or create new products first.
                        </p>
                    )}
                </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Supplier SKU</label>
                    <input
                        type="text"
                        placeholder="e.g. SUP-001"
                        value={form.supplier_sku}
                        onChange={(e) => setForm({ ...form, supplier_sku: e.target.value })}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Unit Cost</label>
                    <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={form.unit_cost}
                        onChange={(e) => setForm({ ...form, unit_cost: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min Order Qty</label>
                    <input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={form.minimum_order_quantity}
                        onChange={(e) => setForm({ ...form, minimum_order_quantity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        className={inputClass}
                    />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={form.is_preferred}
                            onChange={(e) => setForm({ ...form, is_preferred: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <Star size={14} className={form.is_preferred ? 'text-amber-500 fill-amber-500' : 'text-gray-400'} />
                        Preferred
                    </label>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={mode === 'add' ? handleAdd : handleUpdate}
                    disabled={saving || (mode === 'add' && !form.product_id)}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                    <Save size={14} />
                    {saving ? 'Saving...' : mode === 'add' ? 'Link Product' : 'Save Changes'}
                </button>
            </div>
        </div>
    );

    return (
        <div>
            {/* Header with Add button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Package size={16} className="text-indigo-500" />
                    Linked Products ({relatedProducts.length})
                </h3>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => { setIsAdding(true); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
                    >
                        <Plus size={14} /> Link Product
                    </button>
                )}
            </div>

            {/* Add form */}
            {isAdding && <div className="pt-4">{renderForm('add')}</div>}

            {/* Empty state */}
            {relatedProducts.length === 0 && !isAdding && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Package size={40} className="text-gray-400 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No linked products</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click "Link Product" to associate products with this supplier.
                    </p>
                </div>
            )}

            {/* Product table */}
            {relatedProducts.length > 0 && (
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
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedProducts.map(rp =>
                                editingId === rp.id ? (
                                    <tr key={rp.id}>
                                        <td colSpan={7} className="p-0">
                                            {renderForm('edit')}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={rp.id} className="group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                                            <button onClick={() => togglePreferred(rp)} className="mx-auto block">
                                                {rp.is_preferred ? (
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                ) : (
                                                    <Star size={14} className="text-gray-300 dark:text-gray-600 hover:text-yellow-400 transition-colors" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(rp)}
                                                    className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleUnlink(rp.id, rp.product_name)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                                    title="Unlink"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SupplierProductLinker;
