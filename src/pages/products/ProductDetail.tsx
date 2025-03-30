import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Package, Tag, DollarSign, 
  ShoppingCart, Layers, ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';
import { useProductStore } from '../../stores/productStore';
import { Product } from '../../types/database.types';
import { toast } from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, deleteProduct, updateStock, loading, error } = useProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  
  useEffect(() => {
    if (id) {
      getProductById(id)
        .then(data => {
          if (data) {
            setProduct(data);
          } else {
            toast.error('Product not found');
            navigate('/products');
          }
        })
        .catch(err => {
          toast.error('Failed to load product details');
        });
    }
  }, [id, getProductById, navigate]);
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
        navigate('/products');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };
  
  const handleStockAdjustment = async () => {
    if (!id || !adjustQuantity) return;
    
    try {
      const updatedProduct = await updateStock(id, adjustQuantity);
      setProduct(updatedProduct);
      toast.success(`Stock ${adjustQuantity > 0 ? 'increased' : 'decreased'} successfully`);
      setAdjustQuantity(0);
      setShowAdjustStock(false);
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading product details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
        <Link to="/products" className="btn btn-primary mt-4">Back to Products</Link>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Product not found</p>
        <Link to="/products" className="btn btn-primary mt-4">Back to Products</Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/products" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{product.name}</h1>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/products/${id}/edit`} className="btn btn-primary flex items-center space-x-2">
          <Edit size={16} />
          <span>Edit Product</span>
        </Link>
        <button 
          className="btn btn-secondary flex items-center space-x-2"
          onClick={() => setShowAdjustStock(!showAdjustStock)}
        >
          <Layers size={16} />
          <span>Adjust Stock</span>
        </button>
        <button 
          className="btn btn-danger flex items-center space-x-2"
          onClick={handleDelete}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
      
      {/* Stock adjustment form */}
      {showAdjustStock && (
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Adjust Stock</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="adjustQuantity" className="block text-sm font-medium text-gray-300 mb-1">
                Quantity Change
              </label>
              <div className="flex space-x-2">
                <input
                  id="adjustQuantity"
                  type="number"
                  className="input"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value))}
                  placeholder="Enter quantity (positive to add, negative to remove)"
                />
                <button 
                  className="btn btn-primary"
                  onClick={handleStockAdjustment}
                  disabled={!adjustQuantity}
                >
                  Apply
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Use positive numbers to add stock, negative to remove.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product info card */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Product Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Package size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-white">{product.name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Tag size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">SKU</p>
                <p className="text-white">{product.sku}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Layers size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Category</p>
                <p className="text-white">{product.category || 'Uncategorized'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.status === 'In Stock' ? 'bg-green-900/30 text-green-400' : 
                  product.status === 'Low Stock' ? 'bg-yellow-900/30 text-yellow-400' : 
                  'bg-red-900/30 text-red-400'
                }`}>
                  {product.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-medium text-white mb-2">Description</h3>
            <p className="text-gray-300 text-sm">{product.description || 'No description available'}</p>
          </div>
        </div>
        
        {/* Pricing and inventory */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h2>
          
          <div className="space-y-4">
            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-green-500/20 text-green-500">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Selling Price</p>
                  <p className="text-xl font-semibold text-white">${product.price?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-blue-500/20 text-blue-500">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cost Price</p>
                  <p className="text-xl font-semibold text-white">${product.cost?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-purple-500/20 text-purple-500">
                  <Layers size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Stock</p>
                  <p className="text-xl font-semibold text-white">{product.stock || 0} units</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-yellow-500/20 text-yellow-500">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Stock Value</p>
                  <p className="text-xl font-semibold text-white">
                    ${((product.stock || 0) * (product.cost || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stock Movement History */}
      <div className="card bg-dark-800 border border-dark-700">
        <h2 className="text-lg font-semibold text-white mb-4">Stock Movement History</h2>
        
        <div className="text-center py-6">
          <p className="text-gray-400">No stock movement history available yet</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;