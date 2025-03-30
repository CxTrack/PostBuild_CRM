import React, { useState } from 'react';
import { Download, Database, FileText, Users, Package, ShoppingCart, Receipt, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useCustomerStore } from '../../stores/customerStore';
import { useProductStore } from '../../stores/productStore';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useQuoteStore } from '../../stores/quoteStore';
import { toast } from 'react-hot-toast';

const DataExportTab: React.FC = () => {
  const { customers } = useCustomerStore();
  const { products } = useProductStore();
  const { invoices } = useInvoiceStore();
  const { quotes } = useQuoteStore();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      let data: any[] = [];
      let fields: string[] = [];

      switch (type) {
        case 'customers':
          data = customers.map(customer => ({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            type: customer.type,
            status: customer.status,
            total_spent: customer.total_spent,
            created_at: customer.created_at
          }));
          fields = ['name', 'email', 'phone', 'address', 'type', 'status', 'total_spent', 'created_at'];
          break;

        case 'products':
          data = products.map(product => ({
            name: product.name,
            sku: product.sku,
            description: product.description || '',
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            category: product.category || '',
            status: product.status
          }));
          fields = ['name', 'sku', 'description', 'price', 'cost', 'stock', 'category', 'status'];
          break;

        case 'invoices':
          data = invoices.map(invoice => ({
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name,
            date: invoice.date,
            due_date: invoice.due_date,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            total: invoice.total,
            status: invoice.status
          }));
          fields = ['invoice_number', 'customer_name', 'date', 'due_date', 'subtotal', 'tax', 'total', 'status'];
          break;

        case 'quotes':
          data = quotes.map(quote => ({
            quote_number: quote.quote_number,
            customer_name: quote.customer_name,
            date: quote.date,
            expiry_date: quote.expiry_date,
            subtotal: quote.subtotal,
            tax: quote.tax,
            total: quote.total,
            status: quote.status
          }));
          fields = ['quote_number', 'customer_name', 'date', 'expiry_date', 'subtotal', 'tax', 'total', 'status'];
          break;
      }

      const csv = Papa.unparse({
        fields,
        data
      });

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      toast.error(`Failed to export ${type} data`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="hidden md:block space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Export Data</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Database size={16} />
          <span>Download your data in CSV format</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customers Export */}
        <div className="card bg-dark-800 border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-blue-500/20 text-blue-500">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Customers</h3>
                <p className="text-sm text-gray-400">{customers.length} customers</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('customers')}
              disabled={exporting === 'customers'}
              className="btn btn-secondary"
            >
              {exporting === 'customers' ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Download size={16} />
                  <span>Export CSV</span>
                </span>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Includes customer details, contact information, and purchase history.
          </p>
        </div>

        {/* Products Export */}
        <div className="card bg-dark-800 border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-purple-500/20 text-purple-500">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Products</h3>
                <p className="text-sm text-gray-400">{products.length} products</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('products')}
              disabled={exporting === 'products'}
              className="btn btn-secondary"
            >
              {exporting === 'products' ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Download size={16} />
                  <span>Export CSV</span>
                </span>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Includes product details, pricing, inventory levels, and categories.
          </p>
        </div>

        {/* Invoices Export */}
        <div className="card bg-dark-800 border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-green-500/20 text-green-500">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Invoices</h3>
                <p className="text-sm text-gray-400">{invoices.length} invoices</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('invoices')}
              disabled={exporting === 'invoices'}
              className="btn btn-secondary"
            >
              {exporting === 'invoices' ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Download size={16} />
                  <span>Export CSV</span>
                </span>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Includes invoice details, items, payments, and status information.
          </p>
        </div>

        {/* Quotes Export */}
        <div className="card bg-dark-800 border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-yellow-500/20 text-yellow-500">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Quotes</h3>
                <p className="text-sm text-gray-400">{quotes.length} quotes</p>
              </div>
            </div>
            <button
              onClick={() => handleExport('quotes')}
              disabled={exporting === 'quotes'}
              className="btn btn-secondary"
            >
              {exporting === 'quotes' ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Download size={16} />
                  <span>Export CSV</span>
                </span>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Includes quote details, items, and status information.
          </p>
        </div>
      </div>

      <div className="bg-primary-900/20 border border-primary-800/50 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle size={20} className="text-primary-400 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-white mb-1">About Data Exports</h4>
            <p className="text-sm text-gray-400">
              Exports are generated in CSV format and can be opened in spreadsheet applications like Microsoft Excel or Google Sheets. 
              All dates are in ISO format (YYYY-MM-DD) and numerical values use period (.) as decimal separator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportTab;