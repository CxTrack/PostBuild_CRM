import React, { useState } from 'react';
import { X, Save, ArrowDown, ArrowUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Card, Button } from '@/components/theme/ThemeComponents';
import type { Product, MovementType } from '@/types/app.types';
import toast from 'react-hot-toast';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({ isOpen, onClose, product }) => {
    const { addMovement } = useInventoryStore();

    const [movementType, setMovementType] = useState<MovementType>('adjustment');
    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity === 0 && movementType !== 'adjustment') {
            toast.error('Quantity must be greater than 0');
            return;
        }

        setIsSubmitting(true);
        try {
            const prevQty = product.quantity_on_hand || 0;
            let newQty = prevQty;

            if (movementType === 'in' || movementType === 'return') {
                newQty += quantity;
            } else if (movementType === 'out') {
                newQty -= quantity;
            } else if (movementType === 'adjustment') {
                newQty = quantity;
            }

            await addMovement({
                organization_id: product.organization_id,
                product_id: product.id,
                movement_type: movementType,
                quantity: movementType === 'adjustment' ? quantity - prevQty : quantity,
                previous_quantity: prevQty,
                new_quantity: newQty,
                reason,
                performed_by: '00000000-0000-0000-0000-000000000000', // Placeholder
            });

            toast.success('Inventory updated successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to update inventory');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <RefreshCw size={24} className="mr-2" />
                        Stock Adjustment
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Product</p>
                        <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock: <span className="font-bold">{product.quantity_on_hand}</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'in', label: 'Stock In', icon: ArrowUp, color: 'text-green-600', bg: 'bg-green-50' },
                            { id: 'out', label: 'Stock Out', icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-50' },
                            { id: 'adjustment', label: 'Set Total', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { id: 'return', label: 'Return', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setMovementType(type.id as MovementType)}
                                className={`flex items-center p-3 rounded-xl border-2 transition-all ${movementType === type.id
                                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-sm scale-[1.02]'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${type.bg} ${type.color} mr-3`}>
                                    <type.icon size={18} />
                                </div>
                                <span className={`text-sm font-bold ${movementType === type.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {type.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {movementType === 'adjustment' ? 'New Total Quantity' : 'Quantity to Change'}
                        </label>
                        <input
                            type="number"
                            required
                            min={0}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value || '0'))}
                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Reason / Reference
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Purchase order #123, Damaged goods"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting} className="flex items-center">
                            <Save size={18} className="mr-2" />
                            {isSubmitting ? 'Updating...' : 'Update Inventory'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default StockMovementModal;
