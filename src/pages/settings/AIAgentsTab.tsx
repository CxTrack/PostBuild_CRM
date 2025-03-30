import React, { useEffect, useState } from 'react';
import { useAIAgentStore } from '../../stores/aiAgentStore';
import { AIAgent } from '../../types/database.types';
import { Bot, Plus, Settings, Activity, Clock, MessageSquare, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AIAgentsTab: React.FC = () => {
  const { agents, loading, error, fetchAgents, createAgent, updateAgent, deleteAgent } = useAIAgentStore();
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);
  
  const handleCreateAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createAgent({
        name: formData.get('name') as string,
        type: formData.get('type') as AIAgent['type'],
        settings: {
          tone: formData.get('tone') as AIAgent['settings']['tone'],
          communication_channels: formData.getAll('channels') as ('email' | 'sms')[],
          working_hours: {
            start: formData.get('workingHoursStart') as string,
            end: formData.get('workingHoursEnd') as string,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          reminder_schedule: {
            days_before: [1, 3, 7], // Default schedule
            follow_up_interval: 3 // Days between follow-ups
          }
        }
      });
      
      setShowNewAgentForm(false);
      toast.success('AI agent created successfully');
    } catch (error) {
      toast.error('Failed to create AI agent');
    }
  };
  
  const handleToggleAgent = async (agent: AIAgent) => {
    try {
      await updateAgent(agent.id, {
        status: agent.status === 'active' ? 'paused' : 'active'
      });
      toast.success(`Agent ${agent.status === 'active' ? 'paused' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };
  
  const handleDeleteAgent = async (agent: AIAgent) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await deleteAgent(agent.id);
        toast.success('Agent deleted successfully');
      } catch (error) {
        toast.error('Failed to delete agent');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-400">Loading AI agents...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">AI Agents</h2>
        {agents.length > 0 && (
          <button
            onClick={() => setShowNewAgentForm(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Create Agent</span>
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* New Agent Form */}
      {showNewAgentForm && (
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-white">Create New AI Agent</h3>
            <button
              onClick={() => setShowNewAgentForm(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="input"
                placeholder="e.g., Payment Reminder Agent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Agent Type
              </label>
              <select name="type" required className="input">
                <option value="invoice_reminder">Invoice Reminder</option>
                <option value="payment_collection">Payment Collection</option>
                <option value="customer_service">Customer Service</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Communication Tone
              </label>
              <select name="tone" required className="input">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Communication Channels
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="channels"
                    value="email"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-300">Email</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="channels"
                    value="sms"
                    className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-300">SMS</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Working Hours
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start</label>
                  <input
                    type="time"
                    name="workingHoursStart"
                    defaultValue="09:00"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End</label>
                  <input
                    type="time"
                    name="workingHoursEnd"
                    defaultValue="17:00"
                    required
                    className="input"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewAgentForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Agent
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Agents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="card bg-dark-800 border border-dark-700">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  agent.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{agent.name}</h3>
                  <p className="text-sm text-gray-400">{agent.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleAgent(agent)}
                  className={`btn ${agent.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="btn btn-secondary"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => handleDeleteAgent(agent)}
                  className="btn btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-dark-700 rounded-lg p-3">
                <div className="flex items-center text-gray-400 mb-1">
                  <Clock size={16} className="mr-1" />
                  <span className="text-xs">Working Hours</span>
                </div>
                <p className="text-sm text-white">
                  {agent.settings.working_hours.start} - {agent.settings.working_hours.end}
                </p>
              </div>
              
              <div className="bg-dark-700 rounded-lg p-3">
                <div className="flex items-center text-gray-400 mb-1">
                  <MessageSquare size={16} className="mr-1" />
                  <span className="text-xs">Communication</span>
                </div>
                <p className="text-sm text-white">
                  {agent.settings.communication_channels.join(', ')}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Activity size={16} className="mr-1" />
                <span className="text-xs">Recent Activity</span>
              </div>
              <div className="text-sm text-gray-300">
                No recent activity
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {agents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Bot size={48} className="text-gray-600 mb-4 mx-auto" />
          <p className="text-gray-400 text-lg mb-2">No AI agents found</p>
          <p className="text-gray-500 text-sm mb-6">Create your first AI agent to automate tasks</p>
          <button
            onClick={() => setShowNewAgentForm(true)}
            className="btn btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus size={16} />
            <span>Create Agent</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAgentsTab;