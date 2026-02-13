import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';

export type TaskType = 'call' | 'email' | 'sms' | 'follow_up' | 'meeting' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  show_on_calendar?: boolean;
  start_time?: string;
  end_time?: string;
  duration?: number;
  customer_id: string;
  customer_name: string;
  assigned_to?: string;
  outcome?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, outcome: string) => Promise<Task>;
  getTasksByCustomer: (customerId: string) => Task[];
  getTasksByDate: (date: string) => Task[];
  getPendingTasks: () => Task[];
  getOverdueTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });

    try {
      const organizationId = useOrganizationStore.getState().currentOrganization?.id;
      if (!organizationId) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select(`*, customer:customers(id, name)`)
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const formattedTasks = (data || []).map(task => ({
        ...task,
        customer_name: task.customer?.name || '',
      }));

      set({ tasks: formattedTasks });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (data) => {
    set({ loading: true, error: null });

    try {
      if (!data.customer_id) {
        throw new Error('Task must be linked to a customer');
      }

      const organizationId = useOrganizationStore.getState().currentOrganization?.id;
      if (!organizationId) {
        throw new Error('No organization found');
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const insertData = {
        title: data.title || 'Untitled Task',
        description: data.description,
        category: data.type || 'other',
        priority: data.priority || 'medium',
        status: 'todo',
        due_date: data.due_date || new Date().toISOString().split('T')[0],
        due_time: data.start_time,
        customer_id: data.customer_id,
        assigned_to: data.assigned_to || userId,
        organization_id: organizationId,
        user_id: userId,
      };

      const { data: taskData, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select(`*, customer:customers(id, name)`)
        .single();

      if (error) throw error;

      const newTask: Task = {
        ...taskData,
        type: taskData.category as TaskType,
        status: taskData.status === 'todo' ? 'pending' : taskData.status as TaskStatus,
        show_on_calendar: false,
        customer_name: taskData.customer?.name || '',
      };

      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));

      return newTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id, data) => {
    set({ loading: true, error: null });

    try {
      const updateData: Record<string, any> = {};
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.type) updateData.category = data.type;
      if (data.priority) updateData.priority = data.priority;
      if (data.status) {
        updateData.status = data.status === 'pending' ? 'todo' : data.status;
        if (data.status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (data.due_date) updateData.due_date = data.due_date;
      if (data.start_time) updateData.due_time = data.start_time;
      if (data.assigned_to) updateData.assigned_to = data.assigned_to;
      if (data.outcome) updateData.notes = data.outcome;

      const { data: taskData, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`*, customer:customers(id, name)`)
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        ...taskData,
        type: taskData.category as TaskType,
        status: taskData.status === 'todo' ? 'pending' : taskData.status as TaskStatus,
        show_on_calendar: false,
        customer_name: taskData.customer?.name || '',
      };

      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
      }));

      return updatedTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  completeTask: async (id, outcome) => {
    return get().updateTask(id, {
      status: 'completed',
      outcome,
      completed_at: new Date().toISOString(),
    });
  },

  getTasksByCustomer: (customerId) => {
    return get().tasks.filter(task => task.customer_id === customerId);
  },

  getTasksByDate: (date) => {
    return get().tasks.filter(task => task.due_date === date);
  },

  getPendingTasks: () => {
    return get().tasks.filter(task =>
      task.status === 'pending' || task.status === 'in_progress'
    );
  },

  getOverdueTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task =>
      (task.status === 'pending' || task.status === 'in_progress') &&
      task.due_date < today
    );
  },
}));
