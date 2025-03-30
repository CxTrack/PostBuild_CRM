import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, Check, 
  ShoppingCart, Calendar, Clock, User, DollarSign, Building
} from 'lucide-react';

// Sample purchase data
const PURCHASES = [
  {
    id: 'PO-2023-001',
    supplier: {
      name: 'Global Supplies Inc',
      email: 'orders@globalsupplies.com',
      address: '456 Supplier Ave, Suite 200, Chicago, IL 60601',
      phone: '(555) 987-6543',
    },
    date: '2023-06-01',
    expectedDelivery: '2023-06-15',
    items: [
      { id: 1, description: 'Premium Widget Components', quantity: 50, unitPrice: 50.00, total: 2500.00 },
      { id: 2, description: 'Deluxe Gadget Parts', quantity: 25, unitPrice: 40.00, total: 1000.00 },
      { id: 3, description: 'Shipping & Handling', quantity: 1, unitPrice: 250.00, total: 250.00 },
    ],
    subtotal: 3750.00,
    tax: 0.00,
    total: 3750.00,
    status: 'Received',
    receivedDate: '2023-06-12',
    notes: 'Priority order for Q3 manufacturing.',
  },
  // Other purchases would be here
];

const PurchaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const purchase = PURCHASES.find(po => po.id === id);
  
  if (!purchase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Purchase order not found</p>
        <Link to="/purchases" className="btn btn-primary mt-4">Back to Purchases</Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/purchases" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Purchase Order {purchase.id}</h1>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/purchases/${id}/edit`} className="btn btn-primary flex items-center space-x-2">
          <Edit size={16} />
          <span>Edit</span>
        </Link>
        <button className="btn btn-secondary flex items-center space-x-2">
          <Printer size={16} />
          <span>Print</span>
        </button>
        <button className="btn btn-secondary flex items-center space-x-2">
          <Download size={16} />
          <span>Download PDF</span>
        </button>
        {purchase.status !== 'Received' && (
          <button className="btn btn-secondary flex items-center space-x-2">
            <Check size={16} />
            <span>Mark as Received</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase status card */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Purchase Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <ShoppingCart size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  purchase.status === 'Received' ? 'bg-green-900/30 text-green-400' : 
                  purchase.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-400' : 
                  'bg-red-900/30 text-red-400'
                }`}>
                  {purchase.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Order Date</p>
                <p className="text-white">{new Date(purchase.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Expected Delivery</p>
                <p className="text-white">{new Date(purchase.expectedDelivery).toLocaleDateString()}</p>
              </div>
            </div>
            
            {purchase.status === 'Received' && purchase.receivedDate && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-400">
                  <Check size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Received Date</p>
                  <p className="text-white">{new Date(purchase.receivedDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Amount</p>
                <p className="text-xl font-semibold text-white">${purchase.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Supplier info */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Supplier Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Building size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Supplier</p>
                <p className="text-white font-medium">{purchase.supplier.name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{purchase.supplier.email}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-white">{purchase.supplier.phone}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="text-white">{purchase.supplier.address}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
          <p className="text-gray-300">{purchase.notes}</p>
        </div>
      </div>
      
      {/* Purchase items */}
      <div className="card bg-dark-800 border border-dark-700">
        <h2 className="text-lg font-semibold text-white mb-4">Purchase Items</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {purchase.items.map((item) => (
                <tr key={item.id} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">{item.description}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-dark-700/50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Subtotal</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-white">${purchase.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-dark-700/50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Tax</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-white">${purchase.tax.toFixed(2)}</td>
              </tr>
              <tr className="bg-dark-700">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total</td>
                <td className="px-4 py-3 text-right text-base font-bold text-white">${purchase.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetail;