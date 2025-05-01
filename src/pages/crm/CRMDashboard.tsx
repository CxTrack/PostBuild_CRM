import React, { useState, useEffect } from 'react';
import { Users, CheckSquare, TrendingUp, Search, Filter, Plus, ArrowUpRight, ArrowDownRight, Calendar, DollarSign } from 'lucide-react';
import AddLeadModal from './components/AddLeadModal';
import AddTaskModal from './components/AddTaskModal';
import AddOpportunityModal from './components/AddOpportunityModal';
import EditLeadModal from './components/EditLeadModal';
import { useCustomerStore } from '../../stores/customerStore';

type TabType = 'leads' | 'tasks' | 'opportunities';

const CRMDashboard: React.FC = () => {
  const { customers, fetchCustomers } = useCustomerStore();
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [showLeadModal, setShowLeadModal] = useState(false);
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
  }, [fetchCustomers]);

  const stats = {
    leads: {
      total: filteredLeads.length,
      new: 12,
      change: '+8%',
      trend: 'up'
    },
    tasks: {
      total: 45,
      completed: 28,
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leads':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-primary-500/20 text-primary-500">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Active Leads</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold text-white">{stats.leads.total}</span>
                    {/* <div className={`flex items-center ml-2 ${stats.leads.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.leads.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span className="ml-1">{stats.leads.change}</span>
                    </div> */}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowLeadModal(true)} 
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Lead</span>
              </button>
            </div>

            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
              {filteredLeads.length === 0 && (
                <div className="text-center py-12">
                  <Users size={48} className="text-gray-600 mb-4 mx-auto" />
                  <p className="text-gray-400 text-lg mb-2">No leads found</p>
                  <p className="text-gray-500 text-sm mb-6">
                    {searchTerm ? 'No leads match your search' : 'Get started by adding your first lead'}
                  </p>
                  <button 
                    onClick={() => setShowLeadModal(true)}
                    className="btn btn-primary flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={16} />
                    <span>Add Lead</span>
                  </button>
                </div>
              )}
              {filteredLeads.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {filteredLeads.map((lead) => (
                        <tr 
                          key={lead.id} 
                          className="hover:bg-dark-700/50 cursor-pointer" 
                          onClick={() => setSelectedLead(lead)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{lead.name}</div>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {/* Empty state */}
                  </tbody>
                </table>
              </div>

              <div className="text-center py-12">
                <CheckSquare size={48} className="text-gray-600 mb-4 mx-auto" />
                <p className="text-gray-400 text-lg mb-2">No tasks found</p>
                <p className="text-gray-500 text-sm mb-6">Get started by adding your first task</p>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="btn btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
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
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leads'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Leads
          </button>
          {/* <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'opportunities'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Opportunities
          </button> */}
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
          onSubmit={(data) => {
            console.log('New task:', data);
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