import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Save, UserPlus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProductStore } from '../../stores/productStore';
import { Invoice, InvoiceFormData } from '../../types/database.types';

const EditInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, updateInvoice, loading, error, clearError } = useInvoiceStore();
  const { customers, fetchCustomers, updateCustomer } = useCustomerStore();
  const { products, fetchProducts } = useProductStore();
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormData>();
  
  // Fetch invoice, customers and products when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch invoice details
        if (id) {
          const invoiceData = await getInvoiceById(id);
          if (invoiceData) {
            setInvoice(invoiceData);
            // Pre-fill form with invoice data
            reset({
              customer: invoiceData.customer_id,
              invoiceDate: invoiceData.date.split('T')[0],
              dueDate: invoiceData.due_date.split('T')[0],
              taxRate: invoiceData.tax_rate * 100,
              notes: invoiceData.notes || '',
              items: invoiceData.items.map(item => ({
                product: item.product_id || '',
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price
              }))
            });
          } else {
            toast.error('Invoice not found');
            navigate('/invoices');
          }
        }
        
        // Fetch customers and products
        await Promise.all([
          fetchCustomers(),
          fetchProducts()
        ]);
      } catch (err) {
        toast.error('Failed to load data');
      }
    };
    
    loadData();
  }, [id, getInvoiceById, fetchCustomers, fetchProducts, navigate, reset]);
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchItems = watch('items');
  const watchTaxRate = watch('taxRate');
  
  // Calculate subtotal, tax, and total
  const subtotal = watchItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const taxRate = parseFloat(watchTaxRate?.toString() || '0') / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  // Sort customers alphabetically and filter by search term
  const sortedAndFilteredCustomers = [...customers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(customer => 
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(customerSearchTerm))
    );
  
  // Filter products by search term
  const filteredProducts = [...products]
    .filter(product => 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(productSearchTerm.toLowerCase()))
    );
  
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };
  
  const onSubmit = async (data: InvoiceFormData) => {
    if (!id || !invoice) return;
    
    clearError();
    
    try {
      let customerUpdated = false;

      // Update customer information if changed
      if (data.newCustomer) {
        const customerId = invoice.customer_id;
        if (customerId) {
          const customerData = {
            name: data.newCustomer.name,
            email: data.newCustomer.email,
            phone: data.newCustomer.phone,
            address: data.newCustomer.address
          };
          
          await updateCustomer(customerId, customerData);
          customerUpdated = true;
        }
      }

      // Calculate totals
      const items = data.items.map(item => ({
        product_id: item.product || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice
      }));

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = parseFloat(data.taxRate.toString()) / 100;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Update the invoice with customer information if changed
      const updatedInvoice = await updateInvoice(id, {
        date: data.invoiceDate,
        due_date: data.dueDate,
        items,
        subtotal,
        tax_rate: taxRate,
        tax,
        total,
        notes: data.notes,
        customer_email: data.newCustomer?.email,
        customer_address: data.newCustomer?.address
      });
      
      if (customerUpdated) {
        toast.success('Invoice and customer information updated successfully!');
      } else {
        toast.success('Invoice updated successfully!');
      }

      navigate(`/invoices/${id}`);
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error('Failed to update invoice. Please try again.');
    }
  };
  
  if (loading || !invoice) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading invoice details...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to={`/invoices/${id}`} className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Invoice {invoice.invoice_number}</h1>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer and dates */}
          <div className="lg:col-span-2 card bg-dark-800 border border-dark-700">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Customer
                </label>
                
                {!showNewCustomerForm ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="input pl-10"
                          placeholder="Search customers..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(true)}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <UserPlus size={16} />
                        <span>Edit Customer</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <select
                        className="input"
                        {...register('customer')}
                        disabled
                      >
                        <option value={invoice.customer_id}>{invoice.customer_name}</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border border-dark-600 rounded-md p-4 bg-dark-700/50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-white">Edit Customer Details</h3>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(false)}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          id="customerName"
                          type="text"
                          className="input"
                          placeholder="Customer name"
                          defaultValue={invoice.customer_name}
                          {...register('newCustomer.name')}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          id="customerEmail"
                          type="email"
                          className="input"
                          placeholder="customer@example.com"
                          defaultValue={invoice.customer_email || ''}
                          {...register('newCustomer.email', { 
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                        />
                        {errors.newCustomer?.email && (
                          <p className="mt-1 text-sm text-red-400">{errors.newCustomer.email.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300 mb-1">
                          Phone
                        </label>
                        <input
                          id="customerPhone"
                          type="text"
                          className="input"
                          placeholder="(555) 123-4567"
                          {...register('newCustomer.phone')}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-300 mb-1">
                          Address
                        </label>
                        <input
                          id="customerAddress"
                          type="text"
                          className="input"
                          placeholder="123 Business St, City"
                          defaultValue={invoice.customer_address || ''}
                          {...register('newCustomer.address')}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-300 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    id="invoiceDate"
                    className="input"
                    {...register('invoiceDate', { required: 'Invoice date is required' })}
                  />
                  {errors.invoiceDate && (
                    <p className="mt-1 text-sm text-red-400">{errors.invoiceDate.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    className="input"
                    {...register('dueDate', { required: 'Due date is required' })}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-400">{errors.dueDate.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-300 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  id="taxRate"
                  className="input"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Enter tax rate percentage (e.g., 12 for 12%)"
                  {...register('taxRate', { 
                    required: 'Tax rate is required',
                    min: { value: 0, message: 'Tax rate cannot be negative' },
                    max: { value: 100, message: 'Tax rate cannot exceed 100%' },
                    valueAsNumber: true
                  })}
                />
                {errors.taxRate && (
                  <p className="mt-1 text-sm text-red-400">{errors.taxRate.message}</p>
                )}
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
                placeholder="Add notes to the customer..."
                {...register('notes')}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Invoice items */}
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Invoice Items</h2>
            <button
              type="button"
              onClick={() => append({ product: '', description: '', quantity: 1, unitPrice: 0 })}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
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
                        {...register(`items.${index}.product` as const)}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                      >
                        <option value="">Select a product</option>
                        {filteredProducts.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
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
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                    Tax ({parseFloat(watchTaxRate?.toString() || '0').toFixed(2)}%)
                  </td>
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
          <button 
            type="submit" 
            className="btn btn-primary flex items-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Update Invoice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;