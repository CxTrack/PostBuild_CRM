import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, Package, ArrowUp, ArrowDown, RefreshCw, Upload } from 'lucide-react';
import { useProductStore } from '../../stores/productStore';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { TooltipButton } from '../../components/ToolTip';
import { Product } from '../../types/database.types';
import { useActivityStore } from '../../stores/activitiesStore';
import ConfirmationModal from '../../components/ConfirmationModal';
import OneMetricWidget from '../../components/widgets/generic/OneMetricWidget';

const Inventory: React.FC = () => {
  const { products, loading, error, fetchProducts, deleteProduct, updateProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  // const { totalProducts } = useProductStore();
  const [uploading, setUploading] = useState(false);
  const { addActivity } = useActivityStore();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts().catch(err => {
      toast.error('Failed to load products');
    });
  }, [fetchProducts]);

  const filteredInventory = products.filter(product =>
    product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   setUploading(true);

  //   try {
  //     const text = await file.text();

  //     Papa.parse(text, {
  //       header: true,
  //       skipEmptyLines: true,
  //       complete: async (results) => {
  //         const { data, errors } = results;

  //         if (errors.length > 0) {
  //           toast.error('Error parsing CSV file');
  //           console.error('CSV parsing errors:', errors);
  //           return;
  //         }

  //         let successCount = 0;
  //         let errorCount = 0;

  //         for (const row of data) {
  //           try {
  //             // Map CSV columns to inventory fields
  //             const inventoryData = {
  //               product_id: row.product_id,
  //               quantity: parseInt(row.quantity) || 0,
  //               location: row.location,
  //               notes: row.notes
  //             };

  //             // Add validation and processing logic here
  //             successCount++;
  //           } catch (error) {
  //             console.error('Error importing inventory:', error);
  //             errorCount++;
  //           }
  //         }

  //         toast.success(`Imported ${successCount} items successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
  //       }
  //     });
  //   } catch (error) {
  //     console.error('File upload error:', error);
  //     toast.error('Failed to upload file');
  //   } finally {
  //     setUploading(false);
  //     event.target.value = '';
  //   }
  // };

  const handleStartEdit = (id: string, field: string, value: string | number) => {
    setEditingCell({ id, field });
    setEditValue(value.toString());
  };

  const handleSaveEdit = async (id: string, field: string) => {
    try {
      const value = field === 'stock' ? parseInt(editValue) : editValue;
      await updateProduct(id, { [field]: value, updated_at: new Date().toISOString() });

      // log it
      //await addActivity(`Product “${product.name}” is deleted`, 'product', null);

      setEditingCell(null);
      setEditValue('');
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // const handleStockAdjustment = async (id: string, adjustment: number) => {
  //   const product = products.find(p => p.id === id);
  //   if (!product) return;

  //   const newStock = Math.max(0, (product.stock || 0) + adjustment);
  //   try {
  //     await updateProduct(id, {
  //       stock: newStock,
  //       updated_at: new Date().toISOString()
  //     });
  //     toast.success(`Stock ${adjustment > 0 ? 'increased' : 'decreased'} successfully`);
  //   } catch (error) {
  //     console.error('Error adjusting stock:', error);
  //     toast.error('Failed to adjust stock');
  //   }
  // };

  const confirmProductDelete = async () => {

    if (!productToDelete) {
      toast.error(`Unable to delete product ${productToDelete!.name}`);
      return;
    }

    try {

      await deleteProduct(productToDelete.id);

      // log it
      await addActivity(`Product “${productToDelete.name}” is deleted`, 'product', null);

      toast.success(`Product ${productToDelete.name} is deleted successfully`);

      setProductToDelete(null);
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };


  // const handleDelete = async (product: Product) => {
  //   await deleteProduct(product.id);

  //   // log it
  //   await addActivity(`Product “${product.name}” is deleted`, 'product', null);

  //   toast.success(`Product ${product.name} is deleted successfully`);
  // }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <div className="flex space-x-2">
          {/* <div className="relative">
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
          </div> */}
          {/* <button className="btn btn-primary flex items-center space-x-2">
            <RefreshCw size={16} />
            <span>Sync with Shopify</span>
          </button> */}
          {/* <button className="btn btn-secondary flex items-center space-x-2">
            <Package size={16} />
            <span>Adjust Stock</span>
          </button> */}
        </div>
      </div>

      {/* Inventory summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <OneMetricWidget name={'Total Products'} top_value={products.length.toString()} icon={Package} color='blue'></OneMetricWidget>

        <OneMetricWidget name={'Low Stock Items'} top_value={products.filter(p => p.status == 'Low Stock').length.toString()} icon={ArrowDown} color='orange'></OneMetricWidget>

        <OneMetricWidget name={'Out of Stock Items'} top_value={products.filter(p => p.status == 'Out of Stock').length.toString()} icon={Package} color='red'></OneMetricWidget>
        
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search inventory..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Link to="/products/new" className="btn btn-primary flex items-center space-x-2">
            <Package size={16} />
            <span>Add Product</span>
          </Link>
          {/* <button className="btn btn-secondary flex items-center space-x-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button> */}
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        {filteredInventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Stock</th>
                  {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Min Stock</th> */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div
                            className="text-sm font-medium text-white cursor-pointer hover:text-primary-400"
                            onClick={() => handleStartEdit(item.id, 'name', item.name)}
                          >
                            {editingCell?.id === item.id && editingCell.field === 'name' ? (
                              <input
                                type="text"
                                className="input py-1 px-2"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveEdit(item.id, 'name')}
                                onKeyDown={(e) => handleKeyPress(e, item.id, 'name')}
                                autoFocus
                              />
                            ) : (
                              item.name
                            )}
                          </div>
                          <div className="text-sm text-gray-400">SKU: {item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div
                        className="text-sm text-gray-300 cursor-pointer hover:text-primary-400"
                        onClick={() => handleStartEdit(item.id, 'category', item.category || '')}
                      >
                        {editingCell?.id === item.id && editingCell.field === 'category' ? (
                          <input
                            type="text"
                            className="input py-1 px-2"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(item.id, 'category')}
                            onKeyDown={(e) => handleKeyPress(e, item.id, 'category')}
                            autoFocus
                          />
                        ) : (
                          item.category || 'Uncategorized'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div
                        className="cursor-pointer hover:text-primary-400"
                        onClick={() => handleStartEdit(item.id, 'stock', item.stock || 0)}
                      >
                        {editingCell?.id === item.id && editingCell.field === 'stock' ? (
                          <input
                            type="number"
                            min="0"
                            className="input py-1 px-2 w-24 text-right"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(item.id, 'stock')}
                            onKeyDown={(e) => handleKeyPress(e, item.id, 'stock')}
                            autoFocus
                          />
                        ) : (
                          item.stock || 0
                        )}
                      </div>
                    </td>
                    {/* <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div
                        className="cursor-pointer hover:text-primary-400"
                        onClick={() => handleStartEdit(item.id, 'minStock', item.stock || 0)}
                      >
                        {editingCell?.id === item.id && editingCell.field === 'minStock' ? (
                          <input
                            type="number"
                            min="0"
                            className="input py-1 px-2 w-24 text-right"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(item.id, 'minStock')}
                            onKeyDown={(e) => handleKeyPress(e, item.id, 'minStock')}
                            autoFocus
                          />
                        ) : (
                          item.stock || 0
                        )}
                      </div>
                    </td> */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'In Stock' ? 'bg-green-900/30 text-green-400' :
                        item.status === 'Low Stock' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-4">
                        {/* <button
                          className="text-gray-400 hover:text-green-500"
                          onClick={() => handleStockAdjustment(item.id, 1)}
                          title="Increase stock"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleStockAdjustment(item.id, -1)}
                          title="Decrease stock"
                        >
                          <ArrowDown size={16} />
                        </button> */}
                        {/* <button className="text-gray-400 hover:text-white">
                          <Edit size={16} />
                        </button> */}

                        <TooltipButton
                          tooltip="Delete"
                          icon={<Trash2 size={16} />}
                          isDisabled={false}
                          isHidden={false}
                          onClick={() => setProductToDelete(item)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <Package size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No inventory items found</p>
              <p className="text-gray-500 text-sm mb-6">Add products to your inventory to get started</p>
              <Link to="/products/new" className="btn btn-primary flex items-center space-x-2">
                <Package size={16} />
                <span>Add Product</span>
              </Link>
            </div>
          </div>
        )}

        {/* Pagination - only show if there are items */}
        {filteredInventory.length > 0 && (
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="btn btn-secondary">Previous</button>
              <button className="btn btn-secondary">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredInventory.length}</span> of{' '}
                  <span className="font-medium">{filteredInventory.length}</span> results
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
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => confirmProductDelete()}
        title="Delete item?"
        message="Are you sure?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default Inventory;