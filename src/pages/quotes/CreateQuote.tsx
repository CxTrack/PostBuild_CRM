import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Save, UserPlus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuoteStore } from '../../stores/quoteStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProductStore } from '../../stores/productStore';
import { QuoteFormData } from '../../types/database.types';

const CreateQuote: React.FC = () => {
  const navigate = useNavigate();
  const { createQuote, loading: quoteLoading, error: quoteError, clearError } = useQuoteStore();
  const { customers, fetchCustomers, loading: customersLoading, error: customersError } = useCustomerStore();
  const { products, fetchProducts, loading: productsLoading, error: productsError } = useProductStore();
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ product: '', description: '', quantity: 1, unit_price: 0 }],
      tax_rate: 0,
      message: 'Thank you for your interest in our products/services.',
      newCustomer: {
        name: '',
        email: '',
        phone: '',
        address: ''
      }
    }
  });
  
  // Fetch customers and products when component mounts
  useEffect(() => {
    fetchCustomers().catch(err => {
      toast.error('Failed to load customers');
    });
    
    fetchProducts().catch(err => {
      toast.error('Failed to load products');
    });
    
    clearError();
  }, [fetchCustomers, fetchProducts, clearError]);
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchItems = watch('items');
  const watchTaxRate = watch('tax_rate');
  
  // Calculate subtotal, tax, and total
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxRate = parseFloat(watchTaxRate.toString()) / 100;
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
      setValue(`items.${index}.unit_price`, product.price);
    }
  };
  
  const onSubmit = async (data: QuoteFormData) => {
    clearError();
    
    try {
      // Validate required fields
      if (!data.customer && !data.newCustomer?.name) {
        throw new Error('Please select a customer or create a new one');
      }

      if (!data.items?.length) {
        throw new Error('Please add at least one item');
      }

      // Validate each item
      data.items.forEach((item, index) => {
        if (!item.description) {
          throw new Error(`Please enter a description for item ${index + 1}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Please enter a valid quantity for item ${index + 1}`);
        }
        if (!item.unit_price || item.unit_price <= 0) {
          throw new Error(`Please enter a valid price for item ${index + 1}`);
        }
      });

      // Create the quote in the database
      const newQuote = await createQuote(data);
      
      // Show success message
      toast.success('Quote created successfully!');
      
      // Navigate to the quote detail page
      navigate(`/quotes/${newQuote.id}`);
    } catch (err) {
      console.error('Error creating quote:', err);
      // Display a more specific error message if available
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Failed to create quote. Please try again.');
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/quotes" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Quote</h1>
      </div>
      
      {/* Error message */}
      {quoteError && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {quoteError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer and dates */}
          <div className="lg:col-span-2 card bg-dark-800 border border-dark-700">
            <h2 className="text-lg font-semibold text-white mb-4">Quote Details</h2>
            
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
                        <span>New Customer</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      {customersLoading ? (
                        <div className="input flex items-center justify-center py-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                          <span className="ml-2 text-gray-400">Loading customers...</span>
                        </div>
                      ) : sortedAndFilteredCustomers.length > 0 ? (
                        <select
                          className="input"
                          {...register('customer', { required: !showNewCustomerForm ? 'Customer is required' : false })}
                        >
                          <option value="">Select a customer</option>
                          {sortedAndFilteredCustomers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} {customer.email ? `(${customer.email})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="input flex items-center justify-between text-gray-400">
                          <span>No customers available</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border border-dark-600 rounded-md p-4 bg-dark-700/50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-white">New Customer Details</h3>
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
                          {...register('newCustomer.name', { required: showNewCustomerForm ? 'Customer name is required' : false })}
                        />
                        {errors.newCustomer?.name && (
                          <p className="mt-1 text-sm text-red-400">{errors.newCustomer.name.message}</p>
                        )}
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
                          {...register('newCustomer.email', { 
                            required: showNewCustomerForm ? 'Email is required' : false,
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
                          {...register('newCustomer.address')}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {!showNewCustomerForm && errors.customer && (
                  <p className="mt-1 text-sm text-red-400">{errors.customer.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
                    Quote Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="input"
                    {...register('date', { required: 'Quote date is required' })}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-400">{errors.date.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiry_date"
                    className="input"
                    {...register('expiry_date', { required: 'Expiry date is required' })}
                  />
                  {errors.expiry_date && (
                    <p className="mt-1 text-sm text-red-400">{errors.expiry_date.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-300 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  id="tax_rate"
                  className="input"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Enter tax rate percentage (e.g., 12 for 12%)"
                  {...register('tax_rate', { 
                    required: 'Tax rate is required',
                    min: { value: 0, message: 'Tax rate cannot be negative' },
                    max: { value: 100, message: 'Tax rate cannot exceed 100%' },
                    valueAsNumber: true
                  })}
                />
                {errors.tax_rate && (
                  <p className="mt-1 text-sm text-red-400">{errors.tax_rate.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Message and Notes */}
          <div className="card bg-dark-800 border border-dark-700">
            <h2 className="text-lg font-semibold text-white mb-4">Message & Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  Message to Customer
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="input"
                  placeholder="Add a message to the customer..."
                  {...register('message')}
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  className="input"
                  placeholder="Add internal notes..."
                  {...register('notes')}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quote items */}
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Quote Items</h2>
            <button
              type="button"
              onClick={() => append({ product: '', description: '', quantity: 1, unit_price: 0 })}
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
                      {productsLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                      ) : (
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
                        {...register(`items.${index}.unit_price` as const, { 
                          required: 'Unit price is required',
                          min: { value: 0, message: 'Minimum price is 0' },
                          valueAsNumber: true
                        })}
                      />
                      {errors.items?.[index]?.unit_price && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.unit_price?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-white">
                      ${(watchItems[index]?.quantity * watchItems[index]?.unit_price || 0).toFixed(2)}
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
                    Tax ({(taxRate * 100).toFixed(2)}%)
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
            disabled={quoteLoading}
          >
            {quoteLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Create Quote</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuote;