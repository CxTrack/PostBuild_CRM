import { create } from 'zustand';
import { Task, TaskFormData, TaskStatus } from '../types/database.types';
import { tasksService } from '../services/tasksService';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (data: TaskFormData, calendarEventId: string) => Promise<Task>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  // clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksService.getTasks();
      set({ tasks, loading: false });
    } catch (error: any) {
      console.error('Error in fetchTasks:', error);
      set({
        error: error.message || 'Failed to fetch tasks',
        loading: false
      });
    }
  },

  createTask: async (data: TaskFormData, calendarEventId: string) => {
    set({ loading: true, error: null });
    try {
      const newTask = await tasksService.createTask(data, calendarEventId);

      const tasks = [...get().tasks, newTask];
      set({ tasks, loading: false });

      return newTask;
    } catch (error: any) {
      console.error('Error in createTask:', error);
      set({
        error: error.message || 'Failed to create task',
        loading: false
      });
      throw error;
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    set({ loading: true, error: null });
    try {
      const updatedTask = await tasksService.updateTaskStatus(id, status);

      const tasks = get().tasks.map(task =>
        task.id === id ? updatedTask : task
      );

      set({ tasks, loading: false });
      return updatedTask;
    } catch (error: any) {
      console.error('Error in updateTaskStatus:', error);
      set({
        error: error.message || 'Failed to update task status',
        loading: false
      });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await tasksService.deleteTask(id);

      const quotaskses = get().tasks.filter(task => task.id !== id);
      set({ tasks: quotaskses, loading: false });
    } catch (error: any) {
      console.error('Error in deleteTask:', error);
      set({
        error: error.message || 'Failed to delete task',
        loading: false
      });
      throw error;
    }
  }
}));