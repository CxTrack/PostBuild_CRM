import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowUpRight, ArrowDownRight, Calendar, Download, Filter } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';

const Revenue: React.FC = () => {
  const { invoices } = useInvoiceStore();

  // Calculate total revenue from paid invoices
  const totalRevenue = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Calculate month-over-month growth
  const currentMonth = new Date().getMonth();
  const currentMonthRevenue = invoices
    .filter(inv => 
      inv.status === 'Paid' && 
      new Date(inv.payment_date!).getMonth() === currentMonth
    )
    .reduce((sum, inv) => sum + inv.total, 0);

  const lastMonthRevenue = invoices
    .filter(inv => 
      inv.status === 'Paid' && 
      new Date(inv.payment_date!).getMonth() === currentMonth - 1
    )
    .reduce((sum, inv) => sum + inv.total, 0);

  const growthRate = lastMonthRevenue ? 
    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 
    0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <div className="flex space-x-2">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Calendar size={16} />
            <span>Filter by Date</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${totalRevenue.toLocaleString()}
              </h3>
              <div className="flex items-center mt-2">
                {growthRate >= 0 ? (
                  <ArrowUpRight size={16} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-500" />
                )}
                <span className={`text-sm ml-1 ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(growthRate).toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Current Month</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${currentMonthRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Last Month</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${lastMonthRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-500">
              <Calendar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="card bg-dark-800 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Revenue History</h2>
          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary flex items-center space-x-2">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {invoices
                .filter(inv => inv.status === 'Paid')
                .sort((a, b) => new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime())
                .map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link to={`/invoices/${invoice.id}`} className="text-white hover:text-primary-400">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                      {invoice.customer_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                      {new Date(invoice.payment_date!).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-gray-300">
                      ${invoice.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {invoices.filter(inv => inv.status === 'Paid').length === 0 && (
            <div className="text-center py-12">
              <DollarSign size={48} className="text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400 text-lg mb-2">No revenue data yet</p>
              <p className="text-gray-500 text-sm">Start collecting payments to see your revenue history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Revenue;