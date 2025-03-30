import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Save, UserPlus, Search, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProductStore } from '../../stores/productStore';
import { InvoiceFormData } from '../../types/database.types';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { createInvoice, loading: invoiceLoading, error: invoiceError, clearError } = useInvoiceStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { products, fetchProducts, createProduct } = useProductStore();
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    sku: 'SKU-',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: ''
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch customers and products when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCustomers(),
          fetchProducts()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load required data');
      }
    };
    
    loadData();
    clearError();
  }, [fetchCustomers, fetchProducts, clearError]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ product: '', description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0,
      notes: 'Thank you for your business!'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchTaxRate = watch('taxRate');

  // Calculate subtotal, tax, and total
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxRate = parseFloat(watchTaxRate.toString()) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Filter and sort customers
  const sortedAndFilteredCustomers = [...customers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(customer => 
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(customerSearchTerm))
    );

  // Filter products
  const filteredProducts = [...products]
    .filter(product => 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(productSearchTerm.toLowerCase()))
    );

  const handleProductChange = async (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newProductData.name || !newProductData.sku) {
        toast.error('Product name and SKU are required');
        return;
      }

      const newProduct = await createProduct(newProductData);
      toast.success('Product created successfully');
      setShowNewProductForm(false);
      setNewProductData({
        name: '',
        sku: 'SKU-',
        description: '',
        price: 0,
        cost: 0,
        stock: 0,
        category: ''
      });

      // Add the new product to the current invoice item
      const currentItemIndex = fields.length - 1;
      setValue(`items.${currentItemIndex}.product`, newProduct.id);
      setValue(`items.${currentItemIndex}.description`, newProduct.name);
      setValue(`items.${currentItemIndex}.unitPrice`, newProduct.price);

    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
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
        if (!item.unitPrice || item.unitPrice <= 0) {
          throw new Error(`Please enter a valid price for item ${index + 1}`);
        }
      });

      // Create the invoice
      const newInvoice = await createInvoice(data);
      toast.success('Invoice created successfully!');
      navigate(`/invoices/${newInvoice.id}`);
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'mobile-form-screen' : ''}`}>
      {/* Header with back button */}
      <div className={`flex items-center space-x-4 ${isMobile ? 'mobile-form-header' : ''}`}>
        <Link to="/invoices" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Invoice</h1>
      </div>
      
      {/* Error message */}
      {invoiceError && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {invoiceError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className={`${isMobile ? 'mobile-form-content pb-24' : 'space-y-6'}`}>
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
                        <span>New Customer</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <select
                        className="input"
                        {...register('customer', { required: !showNewCustomerForm })}
                      >
                        <option value="">Select a customer</option>
                        {sortedAndFilteredCustomers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.email ? `(${customer.email})` : ''}
                          </option>
                        ))}
                      </select>
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
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="customerName"
                          type="text"
                          className="input"
                          placeholder="Customer name"
                          {...register('newCustomer.name', { required: 'Customer name is required' })}
                        />
                        {errors.newCustomer?.name && (
                          <p className="mt-1 text-sm text-red-400">{errors.newCustomer.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="customerEmail"
                          type="email"
                          className="input"
                          placeholder="customer@example.com"
                          {...register('newCustomer.email', { 
                            required: 'Email is required',
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
                        <label htmlFor="customerType" className="block text-sm font-medium text-gray-300 mb-1">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="customerType"
                          className="input"
                          {...register('newCustomer.type', { required: 'Customer type is required' })}
                        >
                          <option value="Individual">Individual</option>
                          <option value="Business">Business</option>
                          <option value="Government">Government</option>
                          <option value="Non-Profit">Non-Profit</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="customerCompany" className="block text-sm font-medium text-gray-300 mb-1">
                          Company
                        </label>
                        <input
                          id="customerCompany"
                          type="text"
                          className="input"
                          placeholder="Company name"
                          {...register('newCustomer.company')}
                        />
                      </div>

                      <div>
                        <label htmlFor="customerTitle" className="block text-sm font-medium text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          id="customerTitle"
                          type="text"
                          className="input"
                          placeholder="Job title"
                          {...register('newCustomer.title')}
                        />
                      </div>
                      
                      <div className="col-span-2">
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
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowNewProductForm(true)}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Package size={16} />
                <span>New Product</span>
              </button>
              <button
                type="button"
                onClick={() => append({ product: '', description: '', quantity: 1, unitPrice: 0 })}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>
          </div>
          
          {/* New Product Form */}
          {showNewProductForm && (
            <div className="mb-6 p-4 border border-dark-600 rounded-lg bg-dark-700/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-white">New Product</h3>
                <button
                  type="button"
                  onClick={() => setShowNewProductForm(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                    placeholder="Product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newProductData.sku}
                    onChange={(e) => setNewProductData({...newProductData, sku: e.target.value})}
                    placeholder="SKU-12345"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={newProductData.price}
                    onChange={(e) => setNewProductData({...newProductData, price: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={newProductData.cost}
                    onChange={(e) => setNewProductData({...newProductData, cost: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={newProductData.stock}
                    onChange={(e) => setNewProductData({...newProductData, stock: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newProductData.category}
                    onChange={(e) => setNewProductData({...newProductData, category: e.target.value})}
                    placeholder="Category"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input"
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({...newProductData, description: e.target.value})}
                    placeholder="Product description"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateProduct}
                  className="btn btn-primary"
                >
                  Create Product
                </button>
              </div>
            </div>
          )}
          
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
          
          <div className={`overflow-x-auto ${isMobile ? 'mobile-table' : ''}`}>
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
                    <td className="px-4 py-4" data-label="Product">
                      <select
                        className="input"
                        {...register(`items.${index}.product`)}
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
                    <td className="px-4 py-4" data-label="Description">
                      <input
                        type="text"
                        className="input"
                        placeholder="Description"
                        {...register(`items.${index}.description`, { required: 'Description is required' })}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.description?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4" data-label="Quantity">
                      <input
                        type="number"
                        min="1"
                        className="input text-right"
                        {...register(`items.${index}.quantity`, { 
                          required: 'Quantity is required',
                          min: { value: 1, message: 'Minimum quantity is 1' },
                          valueAsNumber: true
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4" data-label="Unit Price">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input text-right"
                        {...register(`items.${index}.unitPrice`, { 
                          required: 'Unit price is required',
                          min: { value: 0, message: 'Minimum price is 0' },
                          valueAsNumber: true
                        })}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="mt-1 text-sm text-red-400">{errors.items[index]?.unitPrice?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-white" data-label="Total">
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
        <div className={`${isMobile ? 'mobile-form-footer' : 'flex justify-end'}`}>
          <button 
            type="submit" 
            className={`btn btn-primary flex items-center justify-center space-x-2 ${isMobile ? 'w-full' : ''}`}
            disabled={invoiceLoading}
          >
            {invoiceLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Create Invoice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;