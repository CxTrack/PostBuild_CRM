import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Trash2, Edit, Eye, UserPlus, Upload } from 'lucide-react';
import { useSupplierStore } from '../../stores/supplierStore';
import { toast } from 'react-hot-toast';

const Suppliers: React.FC = () => {
  const { suppliers, loading, error, fetchSuppliers, deleteSupplier } = useSupplierStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedSuppliers] = useState<string[]>([]);
  
  // Fetch customers on component mount
  useEffect(() => {
    fetchSuppliers().catch(err => {
      toast.error('Failed to load suppliers');
    });
  }, [fetchSuppliers]);
  
  const filteredCustomers = suppliers.filter(supplier => 
    supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.phone?.includes(searchTerm)
  );
  
  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredCustomers.map(c => c.id));
    }
  };
  
  const toggleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedSuppliers(selectedCustomers.filter(cId => cId !== id));
    } else {
      setSelectedSuppliers([...selectedCustomers, id]);
    }
  };
  
  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        toast.success('Supplier deleted successfully');
      } catch (error) {
        toast.error('Failed to delete supplier');
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Suppliers</h1>
        <div className="flex space-x-2">
          <Link to="/settings?tab=integrations" className="hidden md:flex btn btn-secondary items-center space-x-2">
            <Upload size={16} />
            <span>Import CSV</span>
          </Link>
          <Link to="/suppliers/new" className="btn btn-primary flex items-center space-x-2">
            <UserPlus size={16} />
            <span>Add Supplier</span>
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
            placeholder="Search suppliers..."
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
          <p className="mt-2 text-gray-400">Loading suppliers...</p>
        </div>
      )}
      
      {/* Suppliers table */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        {!loading && filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredCustomers.map((suppler) => (
                  <tr key={suppler.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedCustomers.includes(suppler.id)}
                        onChange={() => toggleSelectCustomer(suppler.id)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link to={`/suppliers/${suppler.id}`} className="text-white font-medium hover:text-primary-400">
                        {suppler.company}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{suppler.email || 'No email'}</div>
                      <div className="text-sm text-gray-400">{suppler.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/suppliers/${suppler.id}`} className="text-gray-400 hover:text-white">
                          <Eye size={16} />
                        </Link>
                        <Link to={`/suppliers/${suppler.id}/edit`} className="text-gray-400 hover:text-white">
                          <Edit size={16} />
                        </Link>
                        <button 
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteCustomer(suppler.id)}
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
              <UserPlus size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No suppliers found</p>
              <p className="text-gray-500 text-sm mb-6">Get started by adding your first supplier</p>
              <Link to="/suppliers/new" className="btn btn-primary flex items-center space-x-2">
                <UserPlus size={16} />
                <span>Add Supplier</span>
              </Link>
            </div>
          </div>
        )}
        
        {/* Pagination - only show if there are customers */}
        {filteredCustomers.length > 0 && (
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="btn btn-secondary">Previous</button>
              <button className="btn btn-secondary">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCustomers.length}</span> of{' '}
                  <span className="font-medium">{filteredCustomers.length}</span> results
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
export default Suppliers;