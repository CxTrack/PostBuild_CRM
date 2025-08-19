import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, UserPlus, Upload, Bell, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../../stores/userStore';
import { formatService } from '../../services/formatService';
import { useNotificationStore } from '../../stores/notificationStore';
import SendUserNotificationModal from '../../components/SendUserNotificationModal';

const AdminUsers: React.FC = () => {
  //const { customers, loading, error, fetchCustomers, deleteCustomer } = useCustomerStore();
  const { users, loading, error, fetchUsers, } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const { notifyUser } = useNotificationStore();
  const [notificaitonModalActive, setNotificaitonModalActive] = useState(false);
  const [userId, setUserId] = useState('');

  // Fetch customers on component mount
  useEffect(() => {
    fetchUsers().catch(err => {
      toast.error('Failed to load users');
    });

    fetchUsers();
  }, [fetchUsers]);

  const filteredCustomers = users.filter(user =>
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  async function handleSentNotification(id: any): Promise<void> {
    setNotificaitonModalActive(true);
    setUserId(id);
  }

  return (
    <div className="space-y-6">

      <SendUserNotificationModal
        isOpen={notificaitonModalActive}
        onClose={() => { setNotificaitonModalActive(!notificaitonModalActive); }}
        title="" userId={userId} />

      {/* Filters and search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Users</p>
              <h3 className="text-2xl font-bold text-white mt-1">{users.length}</h3>
              {/* <div className="flex items-center mt-2">
                {stats.leads.trend === 'up' ? (
                  <ArrowUpRight size={16} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-500" />
                )}
                <span className={`text-sm ml-1 ${stats.leads.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.leads.change}
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-primary-500/20 text-primary-500">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div> */}
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
          <p className="mt-2 text-gray-400">Loading users...</p>
        </div>
      )}

      {/* Customers table */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Id</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Is Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.user_id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span>{customer.user_id}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span>{customer.email}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{customer.is_admin == true ? '✅' : '❌'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">{formatService.formatDate(customer.created_at)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {/* <button
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => handleSentNotification(customer.user_id)}
                      >
                        <Bell size={16} />
                      </button> */}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
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

export default AdminUsers;