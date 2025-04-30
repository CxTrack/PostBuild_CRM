import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSupplierStore } from '../../stores/supplierStore';
import { useProductStore } from '../../stores/productStore';

interface PurchaseFormData {
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  items: {
    product: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes: string;
}

const CreatePurchase: React.FC = () => {
  const navigate = useNavigate();
  const {suppliers} = useSupplierStore();
  const {products} = useProductStore();
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PurchaseFormData>({
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ product: '', description: '', quantity: 1, unitPrice: 0 }],
      notes: 'Please deliver as soon as possible.',
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchItems = watch('items');
  
  // Calculate subtotal, tax, and total
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxRate = 0.0; // 0% tax rate
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };
  
  const onSubmit = (data: PurchaseFormData) => {
    // In a real app, this would send the data to your backend
    console.log('Purchase order data:', data);
    
    // Show success message
    toast.success('Purchase order created successfully!');
    
    // Navigate back to purchases list
    navigate('/purchases');
  };
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/purchases" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Create Purchase Order</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supplier and dates */}
          <div className="lg:col-span-2 card bg-dark-800 border border-dark-700">
            <h2 className="text-lg font-semibold text-white mb-4">Purchase Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 mb-1">
                  Supplier
                </label>
                <select
                  id="supplier"
                  className="input"
                  {...register('supplier', { required: 'Supplier is required' })}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.company}</option>
                  ))}
                </select>
                {errors.supplier && (
                  <p className="mt-1 text-sm text-red-400">{errors.supplier.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="orderDate" className="block text-sm font-medium text-gray-300 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    id="orderDate"
                    className="input"
                    {...register('orderDate', { required: 'Order date is required' })}
                  />
                  {errors.orderDate && (
                    <p className="mt-1 text-sm text-red-400">{errors.orderDate.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="expectedDelivery" className="block text-sm font-medium text-gray-300 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    id="expectedDelivery"
                    className="input"
                    {...register('expectedDelivery', { required: 'Expected delivery date is required' })}
                  />
                  {errors.expectedDelivery && (
                    <p className="mt-1 text-sm text-red-400">{errors.expectedDelivery.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="card bg-dark-800 border border-dark-700">
            <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
            
            <div>
              <textarea
                rows={5}
                className="input"
                placeholder="Add notes to the supplier..."
                {...register('notes')}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Purchase items */}
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Purchase Items</h2>
            <button
              type="button"
              onClick={() => append({ product: '', description: '', quantity: 1, unitPrice: 0 })}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4">
                      <select
                        className="input"
                        {...register(`items.${index}.product` as const, { required: 'Product is required' })}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                      {errors.items?.[index]?.product && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.product?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        className="input"
                        placeholder="Description"
                        {...register(`items.${index}.description` as const, { required: 'Description is required' })}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.description?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="1"
                        className="input text-right"
                        {...register(`items.${index}.quantity` as const, { 
                          required: 'Quantity is required',
                          min: { value: 1, message: 'Minimum quantity is 1' },
                          valueAsNumber: true
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input text-right"
                        {...register(`items.${index}.unitPrice` as const, { 
                          required: 'Unit price is required',
                          min: { value: 0, message: 'Minimum price is 0' },
                          valueAsNumber: true
                        })}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.unitPrice?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-white">
                      ${(watchItems[index]?.quantity * watchItems[index]?.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className={`text-gray-400 hover:text-red-500 ${fields.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-dark-700/50">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Subtotal</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-white">${subtotal.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="bg-dark-700/50">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Tax ({(taxRate * 100).toFixed(0)}%)</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-white">${tax.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="bg-dark-700">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-white">${total.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary flex items-center space-x-2">
            <Save size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchase;