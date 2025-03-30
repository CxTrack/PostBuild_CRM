import { create } from 'zustand';
import { aiAgentService } from '../services/aiAgentService';
import { AIAgent, AIAgentLog } from '../types/database.types';

interface AIAgentState {
  agents: AIAgent[];
  logs: AIAgentLog[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<AIAgent>) => Promise<AIAgent>;
  updateAgent: (id: string, data: Partial<AIAgent>) => Promise<AIAgent>;
  deleteAgent: (id: string) => Promise<void>;
  fetchAgentLogs: (agentId: string) => Promise<void>;
  clearError: () => void;
}

export const useAIAgentStore = create<AIAgentState>((set, get) => ({
  agents: [],
  logs: [],
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const agents = await aiAgentService.getAgents();
      set({ agents, loading: false });
    } catch (error: any) {
      console.error('Error in fetchAgents:', error);
      set({ 
        error: error.message || 'Failed to fetch AI agents', 
        loading: false 
      });
    }
  },
  
  createAgent: async (data: Partial<AIAgent>) => {
    set({ loading: true, error: null });
    try {
      const newAgent = await aiAgentService.createAgent(data);
      
      const agents = [...get().agents, newAgent];
      set({ agents, loading: false });
      
      return newAgent;
    } catch (error: any) {
      console.error('Error in createAgent:', error);
      set({ 
        error: error.message || 'Failed to create AI agent', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateAgent: async (id: string, data: Partial<AIAgent>) => {
    set({ loading: true, error: null });
    try {
      const updatedAgent = await aiAgentService.updateAgent(id, data);
      
      const agents = get().agents.map(agent => 
        agent.id === id ? updatedAgent : agent
      );
      
      set({ agents, loading: false });
      return updatedAgent;
    } catch (error: any) {
      console.error('Error in updateAgent:', error);
      set({ 
        error: error.message || 'Failed to update AI agent', 
        loading: false 
      });
      throw error;
    }
  },
  
  deleteAgent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await aiAgentService.deleteAgent(id);
      
      const agents = get().agents.filter(agent => agent.id !== id);
      set({ agents, loading: false });
    } catch (error: any) {
      console.error('Error in deleteAgent:', error);
      set({ 
        error: error.message || 'Failed to delete AI agent', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchAgentLogs: async (agentId: string) => {
    set({ loading: true, error: null });
    try {
      const { data: logs, error } = await aiAgentService.getAgentLogs(agentId);
      if (error) throw error;
      
      set({ logs, loading: false });
    } catch (error: any) {
      console.error('Error in fetchAgentLogs:', error);
      set({ 
        error: error.message || 'Failed to fetch agent logs', 
        loading: false 
      });
    }
  }
}));