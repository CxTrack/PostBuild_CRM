import { supabase } from '../lib/supabase';
import { Task, TaskFormData, TaskStatus } from '../types/database.types';
import { useCalendarStore } from '../stores/calendarStore';

export const tasksService = {

  // Get task by Id
  async getTask(id: string): Promise<Task> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching task:', error);
        throw error;
      }

      return task;
    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },

  async getTasks(): Promise<Task[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('status', { ascending: false }) // will sort 'pending' first than completed
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      return tasks || [];
    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },

  // Create a new task
  async createTask(taskData: TaskFormData, calendarEventId: string): Promise<Task> {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          user_id: userData.user.id,
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.due_date,
          status: 'pending',
          priority: taskData.priority,
          calendar_id: calendarEventId,
          customer_id: taskData.customer_id
        }])
        .select()
        .single();

      if (taskError) {
        console.log(taskError)
      }

      return newTask;

    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },

    // Create a new task
  async updateTask(task: TaskFormData, taskId: string): Promise<Task> {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    if (!task) {
      throw new Error('No taks for update');
    }

    try {
      const { data: updatedTask, error: taskError } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', taskId)
        .select()
        .single();

      if (taskError) {
        console.log(taskError)
      }

      return updatedTask;

    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },

  // Update task status
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {

      const task = await this.getTask(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }

      let eventId: string | null = null;

      if (status === 'pending') {

        const { addEvent } = useCalendarStore.getState();

        const startDate = new Date(task.due_date);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes in ms
        const newEventId = await addEvent({ id: crypto.randomUUID(), type: 'task', title: task.title, start: new Date(task.due_date), end: endDate });

        eventId = newEventId.id;

      } else if (status === 'completed') {

        await supabase
          .from('calendar_events')
          .delete()
          .eq('id', task.calendar_id);
      }

      const updateData: Partial<{ status: TaskStatus; calendar_id: string | null }> = { status };
      if (eventId !== null) {
        updateData.calendar_id = eventId;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    try {

      const task = await this.getTask(id);

      await supabase
        .from('calendar_events')
        .delete()
        .eq('id', task.calendar_id);


      let { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }


    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },
};

