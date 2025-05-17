import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Edit, Trash2, Mail, Phone, MapPin, Building, User, FileText,
  ShoppingCart, Clock, Calendar, DollarSign, ArrowLeft, Eye, Star, Briefcase, UserPlus
} from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';
import { Customer } from '../../types/database.types';
import { toast } from 'react-hot-toast';
import { formatPhoneNumber } from '../../utils/formatters';
import { useCallStore } from '../../stores/callStore';
import RecentCallsTable from '../../components/calls/RecentCallsTable';
import { formatService } from '../../services/formatService';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomerById, updateCustomer, deleteCustomer, loading, error } = useCustomerStore();
  const { calls, fetchCustomerCalls } = useCallStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {

    const loadData = async () => {
      if (id) {
        getCustomerById(id)
          .then(async data => {
            if (data) {
              setCustomer(data);
              await fetchCustomerCalls(id);
              console.log(calls);

            } else {
              toast.error('Customer not found');
              navigate('/customers');
            }
          })
          .catch(err => {
            toast.error('Failed to load customer details');
          });
      }
    };

    loadData();
  }, [id, getCustomerById, navigate]);

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted successfully');
        navigate('/customers');
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveEdit = async (field: string) => {
    if (!id || !customer) return;

    try {
      const updatedCustomer = await updateCustomer(id, { [field]: editValue });
      setCustomer(updatedCustomer);
      setEditingField(null);
      setEditValue('');
      toast.success('Updated successfully');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(field);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading customer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
        <Link to="/customers" className="btn btn-primary mt-4">Back to Customers</Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Customer not found</p>
        <Link to="/customers" className="btn btn-primary mt-4">Back to Customers</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/customers" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/customers/${id}/edit`} className="btn btn-primary flex items-center space-x-2">
          <Edit size={16} />
          <span>Edit Customer</span>
        </Link>
        <Link to={`/crm?customer=${id}&action=create-lead`} className="btn btn-secondary flex items-center space-x-2">
          <UserPlus size={16} />
          <span>Create Lead</span>
        </Link>
        <Link to={`/invoices/create?customer=${id}`} className="btn btn-secondary flex items-center space-x-2">
          <FileText size={16} />
          <span>Create Invoice</span>
        </Link>
        <button
          className="btn btn-danger flex items-center space-x-2"
          onClick={handleDelete}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer info card */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                {customer.type === 'Business' ? <Building size={18} /> : <User size={18} />}
              </div>
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('name', customer.name)}
                >
                  {editingField === 'name' ? (
                    <input
                      type="text"
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('name')}
                      onKeyDown={(e) => handleKeyPress(e, 'name')}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white font-medium hover:text-primary-400">
                      {customer.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Building size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Company</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('company', customer.company || '')}
                >
                  {editingField === 'company' ? (
                    <input
                      type="text"
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('company')}
                      onKeyDown={(e) => handleKeyPress(e, 'company')}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white hover:text-primary-400">
                      {customer.company || 'No company'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Title</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('title', customer.title || '')}
                >
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('title')}
                      onKeyDown={(e) => handleKeyPress(e, 'title')}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white hover:text-primary-400">
                      {customer.title || 'No title'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('email', customer.email || '')}
                >
                  {editingField === 'email' ? (
                    <input
                      type="email"
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('email')}
                      onKeyDown={(e) => handleKeyPress(e, 'email')}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white hover:text-primary-400">
                      {customer.email || 'No email provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('phone', customer.phone || '')}
                >
                  {editingField === 'phone' ? (
                    <input
                      type="tel"
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('phone')}
                      onKeyDown={(e) => handleKeyPress(e, 'phone')}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white hover:text-primary-400">
                      {formatPhoneNumber(customer.phone) || 'No phone provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('type', customer.type)}
                >
                  {editingField === 'type' ? (
                    <select
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('type')}
                      autoFocus
                    >
                      <option value="Individual">Individual</option>
                      <option value="Business">Business</option>
                      <option value="Government">Government</option>
                      <option value="Non-Profit">Non-Profit</option>
                    </select>
                  ) : (
                    <p className="text-white hover:text-primary-400">
                      {customer.type}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Star size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Priority</p>
                <div
                  className="cursor-pointer"
                  onClick={() => handleStartEdit('priority', customer.priority || 'Low')}
                >
                  {editingField === 'priority' ? (
                    <select
                      className="input py-1 px-2"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit('priority')}
                      autoFocus
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.priority === 'High' ? 'bg-red-900/30 text-red-400' :
                      customer.priority === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-blue-900/30 text-blue-400'
                      }`}>
                      {customer.priority || 'Low'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Customer Since</p>
                <p className="text-white">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.status === 'Active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700/30 text-gray-400'
                  }`}>
                  {customer.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-md font-medium text-white mb-2">Notes</h3>
            <p className="text-gray-300 text-sm">{customer.notes || 'No notes available'}</p>
          </div>
        </div>

        {/* Financial summary */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Financial Summary</h2>

          <div className="space-y-4">
            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-primary-500/20 text-primary-500">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-xl font-semibold text-white">${customer.total_spent?.toLocaleString() || '0.00'}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-green-500/20 text-green-500">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Invoices</p>
                  <p className="text-xl font-semibold text-white">0</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-blue-500/20 text-blue-500">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Purchases</p>
                  <p className="text-xl font-semibold text-white">0</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-700 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-purple-500/20 text-purple-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Last Purchase</p>
                  <p className="text-white">{customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>

          <div className="text-center py-6">
            <p className="text-gray-400">No recent activity</p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      {/* <div className="card bg-dark-800 border border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Invoices</h2>
          <Link to={`/invoices/create?customer=${id}`} className="btn btn-primary flex items-center space-x-2">
            <FileText size={16} />
            <span>Create Invoice</span>
          </Link>
        </div>
        
        <div className="text-center py-6">
          <p className="text-gray-400">No invoices found for this customer</p>
        </div>
      </div> */}

      <div className="card bg-dark-800 border border-dark-700">
        <div className="text-left py-6">
          {/* Recent Calls Table */}
          <RecentCallsTable
            currentCalls={calls}
            formatPhoneNumber={formatService.formatPhoneNumber}
            formatDate={formatService.formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;