import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
//import Modal from 'react-modal';
import { useProfileStore } from '../../stores/profileStore';
import { supabase } from '../../lib/supabase';
import { Edit, Eye, Link, Trash2 } from 'lucide-react';
import { Agent } from 'retell-sdk/resources.mjs';

interface CallAgent {
  call_agent_id: string;
}

const CallAgentTab: React.FC = () => {
  const { profile, updateProfile, loading, error } = useProfileStore();
  const { user } = useAuthStore();
  const [callAgents, setCallAgents] = useState<CallAgent[]>([]);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [addingAgent, setAddingAgent] = useState(false);
  const [deletingAgent, setDeleteAgent] = useState(false);

  useEffect(() => {
    fetchCallAgents();
  }, [user]);


  const fetchCallAgents = async () => {
    if (!user) return;
    setLoadingAgents(true);

    const { data, error } = await supabase
      .from('user_calls')
      .select('call_agent_id')
      .eq('user_id', user.id);

    console.log(data);

    if (error) {
      console.error('Error fetching call agents:', error);
      toast.error('Failed to fetch call agents.');
    } else {
      console.log(data);

      setCallAgents(data as CallAgent[]);
    }

    setLoadingAgents(false);
  };


  const handleDeletAgent = async (agent: CallAgent) => {
    if (!user) {
      toast.error('User not logged in.');
      return;
    }

    console.log(agent.call_agent_id);


    setDeleteAgent(true);

    const { data, error } = await supabase
      .from('user_calls')
      .delete()
      .eq('call_agent_id', agent.call_agent_id);

    if (error) {
      console.error('Error deleting user_call record:', error.message);
      toast.error('Error deleting user_call record:');
    } else {
      console.log('Deleted record(s):', data);
      toast.success('Agent succesfully deleted.');
      fetchCallAgents();
    }

    setDeleteAgent(false);
  };

  const handleAddAgent = async () => {
    if (!user || !newAgentId) {
      toast.error('User not logged in or Agent ID is empty.');
      return;
    }

    setAddingAgent(true);
    const { data, error } = await supabase
      .from('user_calls')
      .insert([{ user_id: user.id, call_agent_id: newAgentId }]);

    if (error) {
      console.error('Error adding new agent:', error);
      toast.error('Failed to add new agent.');
    } else {
      toast.success('New agent added successfully!');
      setNewAgentId('');
      setShowAddAgentModal(false);
      fetchCallAgents(); // Refresh the list
    }
    setAddingAgent(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4">Call Agents</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={() => setShowAddAgentModal(true)}
        className="btn btn-primary mb-4"
      >
        Add New Agent
      </button>

      {loadingAgents ? (
        <p>Loading agents...</p>
      ) : (
        <table className="min-w-full bg-dark-800 border border-dark-700 rounded-md overflow-hidden">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 text-gray-300 border-b border-dark-700">Agent ID</th>
              <th className="text-left py-2 px-4 text-gray-300 border-b border-dark-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {callAgents.map((agent, index) => (
              <tr key={index} className="hover:bg-dark-700">
                <td className="py-2 px-4 text-gray-400 border-b border-dark-700">{agent.call_agent_id}</td>
                <td className="py-2 px-4 text-gray-400 border-b border-dark-700 text-right text-sm font-medium">
                  <div className="flex items-center justify space-x-2">
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDeletAgent(agent)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* <Modal
        isOpen={showAddAgentModal}
        onRequestClose={() => setShowAddAgentModal(false)}
        contentLabel="Add New Agent"
      >
        <h2 className="text-lg font-semibold mb-4">Add New Agent</h2>
        <input
          type="text"
          className="input mb-4"
          placeholder="Enter Agent ID"
          value={newAgentId}
          onChange={(e) => setNewAgentId(e.target.value)}
        />
        <button
          onClick={handleAddAgent}
          className="btn btn-primary"
          disabled={addingAgent}
        >
          {addingAgent ? 'Adding...' : 'Add Agent'}
        </button>
        <button
          onClick={() => setShowAddAgentModal(false)}
          className="btn btn-secondary ml-2"
          disabled={addingAgent}
        >
          Cancel
        </button>
      </Modal> */}
    </div>
  );
};

export default CallAgentTab;