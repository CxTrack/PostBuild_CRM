import { supabase } from '../lib/supabase';
import { PipelineItem } from '../types/database.types';

export const piplelineService = {

  // Get pipeline by Id
  async getPipelineItem(id: string): Promise<PipelineItem> {
    try {
      const { data: pipeline, error } = await supabase
        .from('pipeline_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching pipiline item:', error);
        throw error;
      }

      return pipeline;
    } catch (error) {
      console.error('Pipeline service error:', error);
      throw error;
    }
  },

  async getPipelines(): Promise<PipelineItem[]> {
    try {

      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data: pipelines, error } = await supabase
        .from('pipeline_items')
        .select(`*,
                customers:customer_id (
                  id,
                  name,
                  email,
                  phone,
                  address,
                  company
                )
          `)
        .eq('user_id', userData.user.id);
      //.order('status', { ascending: false }) // will sort 'pending' first than completed
      //.order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching pipline items:', error);
        throw error;
      }

      return pipelines || [];
    } catch (error) {
      console.error('Pipeline service error:', error);
      throw error;
    }
  },

  // Create a new pipeline
  async createPipeline(taskData: PipelineItem): Promise<PipelineItem> {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: newPipelineItem, error: taskError } = await supabase
        .from('pipeline_items')
        .insert([{
          user_id: userData.user.id,
          customer_id: taskData.customer_id,
          stage: taskData.stage,
          closing_date: taskData.closing_date,
          closing_probability: taskData.closing_probability,
          dollar_value: taskData.dollar_value,
        }])
        .select()
        .single();

      if (taskError) {
        console.log(taskError)
      }

      return newPipelineItem;

    } catch (error) {
      console.error('Task service error:', error);
      throw error;
    }
  },

  async updatePipelineItem(item: PipelineItem): Promise<PipelineItem> {
    try {

      const task = await this.getPipelineItem(item.id);
      if (!task) {
        throw new Error(`PipelineItem with id ${item.id} was not found`);
      }

      const { customers, ...updateData } = item; // remove joined object

      const { data, error } = await supabase
        .from('pipeline_items')
        .update(updateData)
        .eq('id', item.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Pipeline service error:', error);
      throw error;
    }
  },

  // Delete a pipeline item
  async deletePipelineItems(id: string): Promise<void> {
    try {

      console.log(id);

      const { error } = await supabase
        .from('pipeline_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pipeline item:', error);
        throw error;
      }

    } catch (error) {
      console.error('Pipleine service error:', error);
      throw error;
    }
  },

  // Delete a customer's pipeline item
  async deleteCustomerPipelineItems(customer_id: string): Promise<void> {
    try {

      await supabase
        .from('pipeline_items')
        .delete()
        .eq('customer_id', customer_id);

    } catch (error) {
      //console.error('Pipleine service error:', error);
      throw error;
    }
  },
};

