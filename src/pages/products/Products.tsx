import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, Package, Upload } from 'lucide-react';
import { useProductStore } from '../../stores/productStore';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';

const Products: React.FC = () => {
  const { products, loading, error, fetchProducts, deleteProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { totalProducts } = useProductStore();
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts().catch(err => {
      toast.error('Failed to load products');
    });
  }, [fetchProducts]);
  const [uploading, setUploading] = useState(false);
  
  // Get unique categories for filter
  const categories = ['all', ...new Set(products.map(p => p.category || 'Uncategorized').filter(Boolean))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      (product.category === categoryFilter) || 
      (categoryFilter === 'Uncategorized' && !product.category);
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };
  
  const toggleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pId => pId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };
  
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };
  
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data, errors } = results;
          
          if (errors.length > 0) {
            toast.error('Error parsing CSV file');
            console.error('CSV parsing errors:', errors);
            return;
          }

          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              // Map CSV columns to product fields
              const productData = {
                name: row.name || row.product_name,
                sku: row.sku || row.product_sku,
                description: row.description,
                price: parseFloat(row.price) || 0,
                cost: parseFloat(row.cost) || 0,
                stock: parseInt(row.stock) || 0,
                category: row.category
              };

              // Validate required fields
              if (!productData.name || !productData.sku) {
                throw new Error('Name and SKU are required');
              }

              await createProduct(productData);
              successCount++;
            } catch (error) {
              console.error('Error importing product:', error);
              errorCount++;
            }
          }

          toast.success(`Imported ${successCount} products successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
          fetchProducts(); // Refresh the products list
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast.error('Failed to parse CSV file');
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <div className="flex space-x-2">
          <div className="relative hidden md:block">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
              id="csv-upload"
              disabled={uploading}
            />
            <label
              htmlFor="csv-upload"
              className="btn btn-secondary flex items-center space-x-2 cursor-pointer"
            >
              <Upload size={16} className={uploading ? 'animate-bounce' : ''} />
              <span>{uploading ? 'Importing...' : 'Import CSV'}</span>
            </label>
          </div>
          <Link to="/products/new" className="btn btn-primary flex items-center space-x-2">
            <Package size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select 
            className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading products...</p>
        </div>
      )}
      
      {/* Products table */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        {!loading && filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-white">
                            <Link to={`/products/${product.id}`} className="hover:text-primary-400">
                              {product.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-400">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">{product.category || 'Uncategorized'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${product.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${product.cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {product.stock || '0'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'In Stock' ? 'bg-green-900/30 text-green-400' : 
                        product.status === 'Low Stock' ? 'bg-yellow-900/30 text-yellow-400' : 
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/products/${product.id}`} className="text-gray-400 hover:text-white">
                          <Eye size={16} />
                        </Link>
                        <Link to={`/products/${product.id}/edit`} className="text-gray-400 hover:text-white">
                          <Edit size={16} />
                        </Link>
                        <button 
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <Package size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No products found</p>
              <p className="text-gray-500 text-sm mb-6">Get started by adding your first product</p>
              <Link to="/products/new" className="btn btn-primary flex items-center space-x-2">
                <Package size={16} />
                <span>Add Product</span>
              </Link>
            </div>
          </div>
        )}
        
        {/* Pagination - only show if there are products */}
        {filteredProducts.length > 0 && (
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="btn btn-secondary">Previous</button>
              <button className="btn btn-secondary">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProducts.length}</span> of{' '}
                  <span className="font-medium">{filteredProducts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-dark-600 bg-dark-700 text-sm font-medium text-gray-400 hover:bg-dark-600">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-dark-600 bg-dark-700 text-sm font-medium text-gray-400 hover:bg-dark-600">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-dark-600 bg-dark-700 text-sm font-medium text-gray-400 hover:bg-dark-600">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;