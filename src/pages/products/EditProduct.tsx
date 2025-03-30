import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProductStore } from '../../stores/productStore';
import { Product } from '../../types/database.types';

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, updateProduct, loading, error, clearError } = useProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Partial<Product>>();
  
  useEffect(() => {
    if (id) {
      getProductById(id)
        .then(data => {
          if (data) {
            setProduct(data);
            reset(data);
          } else {
            toast.error('Product not found');
            navigate('/products');
          }
        })
        .catch(err => {
          toast.error('Failed to load product details');
        });
    }
  }, [id, getProductById, navigate, reset]);
  
  const onSubmit = async (data: Partial<Product>) => {
    if (!id) return;
    
    clearError();
    
    try {
      // Update the product in the database
      await updateProduct(id, data);
      
      // Show success message
      toast.success('Product updated successfully!');
      
      // Navigate to the product detail page
      navigate(`/products/${id}`);
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Failed to update product. Please try again.');
    }
  };
  
  if (loading && !product) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading product details...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to={`/products/${id}`} className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Product</h1>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {product && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="card bg-dark-800 border border-dark-700">
              <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    placeholder="Product name"
                    {...register('name', { required: 'Product name is required' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-300 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sku"
                    type="text"
                    className="input"
                    placeholder="SKU-12345"
                    {...register('sku', { required: 'SKU is required' })}
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-400">{errors.sku.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    className="input"
                    placeholder="Category"
                    {...register('category')}
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="input"
                    placeholder="Product description"
                    {...register('description')}
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Pricing and Inventory */}
            <div className="card bg-dark-800 border border-dark-700">
              <h2 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">$</span>
                    </div>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="input pl-8"
                      placeholder="0.00"
                      {...register('price', { 
                        required: 'Price is required',
                        min: { value: 0, message: 'Price cannot be negative' },
                        valueAsNumber: true
                      })}
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-300 mb-1">
                    Cost Price
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">$</span>
                    </div>
                    <input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="input pl-8"
                      placeholder="0.00"
                      {...register('cost', { 
                        min: { value: 0, message: 'Cost cannot be negative' },
                        valueAsNumber: true
                      })}
                    />
                  </div>
                  {errors.cost && (
                    <p className="mt-1 text-sm text-red-400">{errors.cost.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-300 mb-1">
                    Current Stock
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    placeholder="0"
                    {...register('stock', { 
                      min: { value: 0, message: 'Stock cannot be negative' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-400">{errors.stock.message}</p>
                  )}
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-gray-400 mb-2">Stock Status</p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'In Stock' ? 'bg-green-900/30 text-green-400' : 
                      product.status === 'Low Stock' ? 'bg-yellow-900/30 text-yellow-400' : 
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {product.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      (Will update automatically based on stock level)
                    </span>
                  </div>
                </div>
              </div>
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
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditProduct;