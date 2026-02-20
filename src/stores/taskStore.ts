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
  reset: () => void;
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

const initialTaskState = {
  tasks: [] as Task[],
  loading: false,
  error: null as string | null,
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  ...initialTaskState,

  reset: () => set(initialTaskState),

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
        // Normalize due_date from timestamp (2026-02-28T00:00:00+00:00) to plain date (2026-02-28)
        due_date: task.due_date ? task.due_date.split('T')[0].split(' ')[0] : task.due_date,
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

      // Map lowercase priorities from UI to title-case DB CHECK constraint values
      const priorityMap: Record<string, string> = {
        low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
      };
      const dbPriority = priorityMap[(data.priority || 'medium').toLowerCase()] || 'Medium';

      const insertData: Record<string, any> = {
        title: data.title || 'Untitled Task',
        description: data.description || null,
        category: data.type || 'other',
        type: data.type || 'other',
        priority: dbPriority,
        status: 'pending',
        due_date: data.due_date || new Date().toISOString().split('T')[0],
        due_time: data.start_time || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        duration: data.duration || 30,
        show_on_calendar: data.show_on_calendar || false,
        outcome: data.outcome || null,
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
        type: (taskData.type || taskData.category) as TaskType,
        status: taskData.status as TaskStatus,
        show_on_calendar: taskData.show_on_calendar || false,
        customer_name: taskData.customer?.name || '',
        due_date: taskData.due_date ? taskData.due_date.split('T')[0].split(' ')[0] : taskData.due_date,
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
      const priorityMap: Record<string, string> = {
        low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
      };

      const updateData: Record<string, any> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) {
        updateData.category = data.type;
        updateData.type = data.type;
      }
      if (data.priority !== undefined) {
        updateData.priority = priorityMap[data.priority.toLowerCase()] || data.priority;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      if (data.start_time !== undefined) {
        updateData.start_time = data.start_time;
        updateData.due_time = data.start_time;
      }
      if (data.end_time !== undefined) updateData.end_time = data.end_time;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.show_on_calendar !== undefined) updateData.show_on_calendar = data.show_on_calendar;
      if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
      if (data.outcome !== undefined) {
        updateData.outcome = data.outcome;
        updateData.notes = data.outcome;
      }

      const { data: taskData, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`*, customer:customers(id, name)`)
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        ...taskData,
        type: (taskData.type || taskData.category) as TaskType,
        status: taskData.status as TaskStatus,
        show_on_calendar: taskData.show_on_calendar || false,
        customer_name: taskData.customer?.name || '',
        due_date: taskData.due_date ? taskData.due_date.split('T')[0].split(' ')[0] : taskData.due_date,
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
