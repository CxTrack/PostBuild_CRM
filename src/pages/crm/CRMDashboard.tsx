import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, FileText, Upload, CheckSquare, Link, TrendingUp, Users, ArrowDownRight, ArrowUpRight, ChevronDownSquare, Square, XSquare, Trash } from 'lucide-react';
import AddLeadModal from './components/AddLeadModal';
import AddTaskModal from './components/AddTaskModal';
import AddOpportunityModal from './components/AddOpportunityModal';
import EditLeadModal from './components/EditLeadModal';
import { useCustomerStore } from '../../stores/customerStore';
import { Customer } from '../../types/database.types';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast from 'react-hot-toast';
import QuoteStatusBadge from '../../components/QuoteStatusBadge';
import { useTaskStore } from '../../stores/taskStore';

type TabType = 'leads' | 'tasks' | 'opportunities';

const CRMDashboard: React.FC = () => {
  const { customers, loading, error, fetchCustomers, deleteCustomer } = useCustomerStore();

  const { tasks, fetchTasks, createTask, updateTaskStatus, deleteTask } = useTaskStore();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // const { quotes, loading, error, fetchQuotes, deleteQuote } = useLeadStore();
  const [statusLeadsFilter, setStatusLeadsFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [showLeadModal, setShowLeadModal] = useState(false);
  //const [showDeleteLeadModal, setDeleteLeadModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter leads based on pipeline stage and search term
  const filteredLeads = customers.filter(customer =>
    customer.pipeline_stage === 'lead' && (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Filter opportunities based on pipeline stage and search term
  const opportunities = customers.filter(customer =>
    customer.pipeline_stage === 'opportunity' && (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    fetchCustomers();
    fetchTasks();
  }, [fetchCustomers, fetchTasks]);

  const stats = {
    leads: {
      total: filteredLeads.length,
      new: 0,
      change: '+8%',
      trend: 'up'
    },
    tasks: {
      total: tasks.length,
      completed: tasks.filter(task => task.status === 'pending').length,
      change: '-5%',
      trend: 'down'
    },
    opportunities: {
      total: opportunities.length,
      value: `$${opportunities.reduce((sum, opp) => sum + (opp.opportunity_value || 0), 0).toLocaleString()}`,
      change: '+12%',
      trend: 'up'
    }
  };

  const handleDeleteLead = async (id: string) => {
    setLeadToDelete(id);
  };

  const handleDeleteTask = async (id: string) => {
    setTaskToDelete(id);
  };

  const confirmTaskDelete = async () => {
    if (!taskToDelete) return;

    try {
      deleteTask(taskToDelete);
      toast.success('Task deleted successfully');
      setTaskToDelete(null);
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const confirmLeadDelete = async () => {
    if (!leadToDelete) return;

    try {
      await deleteCustomer(leadToDelete); //-- TODO: implement for lead
      toast.success('Lead deleted successfully');
      setLeadToDelete(null);
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(q => q.id));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leads':
        return (
          <div className="space-y-6">

            {/* Filters and search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Leads..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowLeadModal(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Lead</span>
                </button>
              </div>

              {/* <div className="flex gap-2">
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
                <p className="mt-2 text-gray-400">Loading quotes...</p>
              </div>
            )}

            {/* Leads table */}
            <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
              {!loading && filteredLeads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark-700">
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                              checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                              onChange={toggleSelectAllLeads}
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-dark-700/50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                              checked={selectedLeads.includes(lead.id)}
                              //onChange={() => toggleSelectQuote(lead.id)}
                              onClick={() => setSelectedLead(lead)}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              className="text-gray-400 hover:text-red-500"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <div className="text-sm font-medium text-white">{lead.name}</div>
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{lead.company || '-'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{lead.email || '-'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{lead.phone || '-'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* <Eye to={`/leads/${lead.id}`} className="text-gray-400 hover:text-white" size={16}>
                              </Eye> */}
                              <Edit to={`/leads/${lead.id}/edit`} className="text-gray-400 hover:text-white" size={16}
                                onClick={() => setSelectedLead(lead)}
                              >
                              </Edit>
                              <button
                                className="text-gray-400 hover:text-red-500"
                                onClick={() => handleDeleteLead(lead.id)}
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
                    <p className="text-gray-400 text-lg mb-2">No quotes found</p>
                    <p className="text-gray-500 text-sm mb-6">Get started by creating your first quote</p>
                    <Link to="/quotes/create" className="btn btn-primary flex items-center space-x-2">
                      <Plus size={16} />
                      <span>Create Quote</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Pagination - only show if there are quotes */}
              {filteredLeads.length > 0 && (
                <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button className="btn btn-secondary">Previous</button>
                    <button className="btn btn-secondary">Next</button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-400">
                        Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLeads.length}</span> of{' '}
                        <span className="font-medium">{filteredLeads.length}</span> results
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
              isOpen={!!leadToDelete}
              onClose={() => setLeadToDelete(null)}
              onConfirm={confirmLeadDelete}
              title="Delete item?"
              message="Are you sure?"
              confirmButtonText="Delete"
              cancelButtonText="Cancel"
              isDanger={true}
            />
          </div>
        )

      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-500">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Tasks</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold text-white">{stats.tasks.completed}/{stats.tasks.total}</span>
                    {/* <div className={`flex items-center ml-2 ${stats.tasks.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.tasks.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span className="ml-1">{stats.tasks.change}</span>
                    </div> */}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Task</span>
              </button>
            </div>

            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
              {/* Tasks Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <TrendingUp size={48} className="text-gray-600 mb-4 mx-auto" />
                          <p className="text-gray-400 text-lg mb-2">No tasks found</p>
                          <p className="text-gray-500 text-sm mb-6">Add a new task</p>
                          <button
                            onClick={() => setShowTaskModal(true)}
                            className="btn btn-primary flex items-center space-x-2 mx-auto"
                          >
                            <Plus size={16} />
                            <span>Add Task</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-dark-700/50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{task.title}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">

                            <div className="text-sm font-medium text-white"> {new Date(task.due_date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{task.priority}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{task.status}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                className="text-gray-400 hover:text-green-500"
                                hidden={task.status === 'completed'}
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                              >
                                <ChevronDownSquare size={16} />
                              </button>
                              <button
                                className="text-gray-400 hover:text-red-500"
                                //onClick={() => deleteTask(task.id)}
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
              isOpen={!!taskToDelete}
              onClose={() => setTaskToDelete(null)}
              onConfirm={confirmTaskDelete}
              title="Delete item?"
              message="Are you sure?"
              confirmButtonText="Delete"
              cancelButtonText="Cancel"
              isDanger={true}
            />
          </div>
        );

      case 'opportunities':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Opportunities</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold text-white">{stats.opportunities.value}</span>
                    {/* <div className={`flex items-center ml-2 ${stats.opportunities.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.opportunities.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span className="ml-1">{stats.opportunities.change}</span>
                    </div> */}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowOpportunityModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Opportunity</span>
              </button>
            </div>

            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
              {/* Opportunities Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stage</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Probability</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expected Close</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {opportunities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <TrendingUp size={48} className="text-gray-600 mb-4 mx-auto" />
                          <p className="text-gray-400 text-lg mb-2">No opportunities found</p>
                          <p className="text-gray-500 text-sm mb-6">Convert leads to opportunities or add a new opportunity</p>
                          <button
                            onClick={() => setShowOpportunityModal(true)}
                            className="btn btn-primary flex items-center space-x-2 mx-auto"
                          >
                            <Plus size={16} />
                            <span>Add Opportunity</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      opportunities.map((opportunity) => (
                        <tr key={opportunity.id} className="hover:bg-dark-700/50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{opportunity.name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{opportunity.pipeline_stage}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-300">${opportunity.opportunity_value?.toLocaleString() || '0'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-300">{opportunity.opportunity_probability || 0}%</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {opportunity.opportunity_close_date ? new Date(opportunity.opportunity_close_date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">CRM Dashboard</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="input pl-10 w-64"
            />
          </div>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Leads</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.leads.total}</h3>
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

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.tasks.completed}/{stats.tasks.total}</h3>
              {/* <div className="flex items-center mt-2">
                {stats.tasks.trend === 'up' ? (
                  <ArrowUpRight size={16} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-500" />
                )}
                <span className={`text-sm ml-1 ${stats.tasks.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.tasks.change}
                </span>
                <span className="text-gray-500 text-sm ml-1">completion rate</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-500">
              <CheckSquare size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Pipeline Value</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.opportunities.value}</h3>
              {/* <div className="flex items-center mt-2">
                {stats.opportunities.trend === 'up' ? (
                  <ArrowUpRight size={16} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-500" />
                )}
                <span className={`text-sm ml-1 ${stats.opportunities.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.opportunities.change}
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'leads'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
          >
            Leads
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'opportunities'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
          >
            Opportunities
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Modals */}
      {selectedLead && (
        <EditLeadModal
          lead={selectedLead}
          onClose={() => {
            setSelectedLead(null);
            fetchCustomers(); // Refresh leads after editing
          }}
        />
      )}

      {showLeadModal && (
        <AddLeadModal
          onClose={() => {
            setShowLeadModal(false);
            fetchCustomers(); // Refresh leads after modal closes
          }}
        />
      )}

      {showTaskModal && (
        <AddTaskModal
          onClose={() => setShowTaskModal(false)}
          onSubmit={(data, calendarEvent) => {
            console.log('New task:', data);
            console.log('New event:', calendarEvent);
            createTask(data, calendarEvent.id);
            setShowTaskModal(false);
            // TODO: Implement task creation
          }}
        />
      )}

      {showOpportunityModal && (
        <AddOpportunityModal
          onClose={() => setShowOpportunityModal(false)}
          onSubmit={(data) => {
            console.log('New opportunity:', data);
            setShowOpportunityModal(false);
            // TODO: Implement opportunity creation
          }}
        />
      )}
    </div>
  );
};

export default CRMDashboard;