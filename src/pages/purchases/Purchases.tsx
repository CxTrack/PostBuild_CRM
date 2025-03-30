import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, ShoppingCart, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';

// Empty purchase data for a clean slate
const PURCHASES: any[] = [];

const Purchases: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const filteredPurchases = PURCHASES.filter(purchase => 
    purchase.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleSelectAll = () => {
    if (selectedPurchases.length === filteredPurchases.length) {
      setSelectedPurchases([]);
    } else {
      setSelectedPurchases(filteredPurchases.map(p => p.id));
    }
  };
  
  const toggleSelectPurchase = (id: string) => {
    if (selectedPurchases.includes(id)) {
      setSelectedPurchases(selectedPurchases.filter(pId => pId !== id));
    } else {
      setSelectedPurchases([...selectedPurchases, id]);
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
              // Map CSV columns to purchase fields
              const purchaseData = {
                supplier: row.supplier,
                order_date: row.order_date,
                expected_delivery: row.expected_delivery,
                items: JSON.parse(row.items || '[]'),
                notes: row.notes
              };

              // Add validation and processing logic here
              successCount++;
            } catch (error) {
              console.error('Error importing purchase:', error);
              errorCount++;
            }
          }

          toast.success(`Imported ${successCount} purchases successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Purchases</h1>
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
          <Link to="/purchases/create" className="btn btn-primary flex items-center space-x-2">
            <Plus size={16} />
            <span>Create Purchase Order</span>
          </Link>
        </div>
      </div>
      
      {/* Purchase summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Purchases</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>
        
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Received</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>
        
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-500">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>
        
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Cancelled</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-3 rounded-lg bg-red-500/20 text-red-500">
              <ShoppingCart size={24} />
            </div>
          </div>
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
            placeholder="Search purchases..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Purchases table */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        {filteredPurchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedPurchases.length === filteredPurchases.length && filteredPurchases.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Purchase #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedPurchases.includes(purchase.id)}
                        onChange={() => toggleSelectPurchase(purchase.id)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link to={`/purchases/${purchase.id}`} className="text-white font-medium hover:text-primary-400">
                        {purchase.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">{purchase.supplier}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {purchase.date ? new Date(purchase.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${purchase.amount?.toLocaleString() || '0.00'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        purchase.status === 'Received' ? 'bg-green-900/30 text-green-400' : 
                        purchase.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-400' : 
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/purchases/${purchase.id}`} className="text-gray-400 hover:text-white">
                          <Eye size={16} />
                        </Link>
                        <Link to={`/purchases/${purchase.id}/edit`} className="text-gray-400 hover:text-white">
                          <Edit size={16} />
                        </Link>
                        <button className="text-gray-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
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
              <ShoppingCart size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No purchases found</p>
              <p className="text-gray-500 text-sm mb-6">Get started by creating your first purchase order</p>
              <Link to="/purchases/create" className="btn btn-primary flex items-center space-x-2">
                <Plus size={16} />
                <span>Create Purchase Order</span>
              </Link>
            </div>
          </div>
        )}
        
        {/* Pagination - only show if there are purchases */}
        {filteredPurchases.length > 0 && (
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="btn btn-secondary">Previous</button>
              <button className="btn btn-secondary">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredPurchases.length}</span> of{' '}
                  <span className="font-medium">{filteredPurchases.length}</span> results
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

export default Purchases;