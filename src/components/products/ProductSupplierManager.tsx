import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Star, Save, Trash2, Edit2, Package } from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import type { ProductSupplier } from '@/types/app.types';
import type { ProductSupplierWithDetails } from '@/stores/supplierStore';
import toast from 'react-hot-toast';

interface ProductSupplierManagerProps {
    productId: string;
    organizationId: string;
    readOnly?: boolean;
}

interface LinkFormState {
    supplier_id: string;
    supplier_sku: string;
    unit_cost: number | '';
    minimum_order_quantity: number | '';
    is_preferred: boolean;
}

const EMPTY_FORM: LinkFormState = {
    supplier_id: '',
    supplier_sku: '',
    unit_cost: '',
    minimum_order_quantity: '',
    is_preferred: false,
};

const ProductSupplierManager: React.FC<ProductSupplierManagerProps> = ({
    productId,
    organizationId,
    readOnly = false,
}) => {
    const {
        suppliers,
        productSuppliers,
        fetchSuppliers,
        fetchProductSuppliers,
        linkProduct,
        updateProductLink,
        unlinkProduct,
    } = useSupplierStore();
    const { currentOrganization } = useOrganizationStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<LinkFormState>({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        await Promise.all([
            fetchProductSuppliers(productId),
            fetchSuppliers(currentOrganization?.id),
        ]);
    }, [productId, currentOrganization?.id, fetchProductSuppliers, fetchSuppliers]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter out already-linked suppliers for the add dropdown
    const linkedSupplierIds = new Set(productSuppliers.map(ps => ps.supplier_id));
    const availableSuppliers = suppliers.filter(s => !linkedSupplierIds.has(s.id) && s.status === 'active');

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!form.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }
        setSaving(true);
        try {
            const result = await linkProduct({
                organization_id: organizationId,
                product_id: productId,
                supplier_id: form.supplier_id,
                supplier_sku: form.supplier_sku || undefined,
                unit_cost: Number(form.unit_cost) || 0,
                minimum_order_quantity: Number(form.minimum_order_quantity) || 1,
                is_preferred: form.is_preferred,
            } as Omit<ProductSupplier, 'id' | 'created_at'>);
            if (result) {
                toast.success('Supplier linked successfully');
                resetForm();
                await fetchProductSuppliers(productId);
            }
        } catch {
            toast.error('Failed to link supplier');
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
            toast.success('Supplier link updated');
            resetForm();
            await fetchProductSuppliers(productId);
        } catch {
            toast.error('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleUnlink = async (id: string, supplierName?: string) => {
        if (!confirm(`Remove ${supplierName || 'this supplier'} from this product?`)) return;
        try {
            await unlinkProduct(id);
            toast.success('Supplier unlinked');
        } catch {
            toast.error('Failed to unlink supplier');
        }
    };

    const startEdit = (ps: ProductSupplierWithDetails) => {
        setEditingId(ps.id);
        setIsAdding(false);
        setForm({
            supplier_id: ps.supplier_id,
            supplier_sku: ps.supplier_sku || '',
            unit_cost: ps.unit_cost || '',
            minimum_order_quantity: ps.minimum_order_quantity || '',
            is_preferred: ps.is_preferred,
        });
    };

    const togglePreferred = async (ps: ProductSupplierWithDetails) => {
        await updateProductLink(ps.id, { is_preferred: !ps.is_preferred });
        await fetchProductSuppliers(productId);
    };

    const inputClass = 'w-full px-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white';

    const renderForm = (mode: 'add' | 'edit') => (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
            {mode === 'add' && (
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Supplier</label>
                    <select
                        value={form.supplier_id}
                        onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                        className={inputClass}
                    >
                        <option value="">Select a supplier...</option>
                        {availableSuppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    {availableSuppliers.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            No available suppliers. Create suppliers first in the Suppliers page.
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
                    disabled={saving || (mode === 'add' && !form.supplier_id)}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                    <Save size={14} />
                    {saving ? 'Saving...' : mode === 'add' ? 'Link Supplier' : 'Save Changes'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Package size={16} className="text-indigo-500" />
                    Suppliers ({productSuppliers.length})
                </h3>
                {!readOnly && !isAdding && !editingId && (
                    <button
                        type="button"
                        onClick={() => { setIsAdding(true); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
                    >
                        <Plus size={14} /> Add Supplier
                    </button>
                )}
            </div>

            {isAdding && renderForm('add')}

            {productSuppliers.length === 0 && !isAdding && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No suppliers linked to this product yet.</p>
                    {!readOnly && (
                        <p className="text-xs mt-1">Click "Add Supplier" to link one.</p>
                    )}
                </div>
            )}

            {productSuppliers.map((ps) =>
                editingId === ps.id ? (
                    <div key={ps.id}>{renderForm('edit')}</div>
                ) : (
                    <div
                        key={ps.id}
                        className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => !readOnly && togglePreferred(ps)}
                                disabled={readOnly}
                                className="flex-shrink-0"
                                title={ps.is_preferred ? 'Preferred supplier' : 'Set as preferred'}
                            >
                                <Star
                                    size={16}
                                    className={ps.is_preferred
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 transition-colors'
                                    }
                                />
                            </button>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {ps.supplier_name || 'Unknown Supplier'}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    {ps.supplier_sku && <span>SKU: {ps.supplier_sku}</span>}
                                    {ps.unit_cost != null && ps.unit_cost > 0 && (
                                        <span>Cost: ${Number(ps.unit_cost).toFixed(2)}</span>
                                    )}
                                    {ps.minimum_order_quantity != null && ps.minimum_order_quantity > 0 && (
                                        <span>MOQ: {ps.minimum_order_quantity}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {!readOnly && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => startEdit(ps)}
                                    className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                    title="Edit"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnlink(ps.id, ps.supplier_name)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                    title="Unlink"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

export default ProductSupplierManager;
