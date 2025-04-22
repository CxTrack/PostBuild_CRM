import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, FileText, Upload } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import InvoiceStatusBadge from '../../components/InvoiceStatusBadge';

const Invoices: React.FC = () => {
  const { invoices, loading, error, fetchInvoices, deleteInvoice } = useInvoiceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  
  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices().catch(err => {
      toast.error('Failed to load invoices');
    });
  }, [fetchInvoices]);
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(i => i.id));
    }
  };
  
  const toggleSelectInvoice = (id: string) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(iId => iId !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };
  
  const handleDeleteInvoice = async (id: string) => {
    setInvoiceToDelete(id);
  };
  
  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await deleteInvoice(invoiceToDelete);
      toast.success('Invoice deleted successfully');
      setInvoiceToDelete(null);
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleMassDelete = async () => {
    if (selectedInvoices.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice${selectedInvoices.length > 1 ? 's' : ''}?`)) {
      try {
        await Promise.all(selectedInvoices.map(id => deleteInvoice(id)));
        toast.success(`Successfully deleted ${selectedInvoices.length} invoice${selectedInvoices.length > 1 ? 's' : ''}`);
        setSelectedInvoices([]);
      } catch (error) {
        console.error('Error deleting invoices:', error);
        toast.error('Failed to delete some invoices');
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
              // Map CSV columns to invoice fields
              const invoiceData = {
                customer_name: row.customer_name,
                customer_email: row.customer_email,
                date: row.date,
                due_date: row.due_date,
                items: JSON.parse(row.items || '[]'),
                tax_rate: parseFloat(row.tax_rate) || 0,
                notes: row.notes
              };

              // Add validation and processing logic here
              successCount++;
            } catch (error) {
              console.error('Error importing invoice:', error);
              errorCount++;
            }
          }

          toast.success(`Imported ${successCount} invoices successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
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
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <div className="flex space-x-2">
          {selectedInvoices.length > 0 && (
            <button
              onClick={handleMassDelete}
              className="btn btn-danger flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Delete Selected ({selectedInvoices.length})</span>
            </button>
          )}
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
          <Link to="/invoices/create" className="btn btn-primary flex items-center space-x-2">
            <Plus size={16} />
            <span>Create Invoice</span>
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
            placeholder="Search invoices..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Issued">Issued</option>
            <option value="Paid">Paid</option>
            <option value="Part paid">Part paid</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Disputed">Disputed</option>
            <option value="On hold">On hold</option>
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
          <p className="mt-2 text-gray-400">Loading invoices...</p>
        </div>
      )}
      
      {/* Invoices table */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        {!loading && filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleSelectInvoice(invoice.id)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link to={`/invoices/${invoice.id}`} className="text-white font-medium hover:text-primary-400">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">{invoice.customer_name}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${invoice.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/invoices/${invoice.id}`} className="text-gray-400 hover:text-white">
                          <Eye size={16} />
                        </Link>
                        <Link to={`/invoices/${invoice.id}/edit`} className="text-gray-400 hover:text-white">
                          <Edit size={16} />
                        </Link>
                        <button 
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteInvoice(invoice.id)}
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
              <FileText size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No invoices found</p>
              <p className="text-gray-500 text-sm mb-6">Get started by creating your first invoice</p>
              <Link to="/invoices/create" className="btn btn-primary flex items-center space-x-2">
                <Plus size={16} />
                <span>Create Invoice</span>
              </Link>
            </div>
          </div>
        )}
        
        {/* Pagination - only show if there are invoices */}
        {filteredInvoices.length > 0 && (
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="btn btn-secondary">Previous</button>
              <button className="btn btn-secondary">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredInvoices.length}</span> of{' '}
                  <span className="font-medium">{filteredInvoices.length}</span> results
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete item?"
        message="Are you sure?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default Invoices;