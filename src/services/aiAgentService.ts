import { supabase } from '../lib/supabase';
import { AIAgent, AIAgentLog, Invoice } from '../types/database.types';
import { emailService } from './emailService';

// Create OpenAI client lazily to ensure environment variables are loaded
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please check your environment variables.');
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Please check your key.');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    maxRetries: 3,
    timeout: 30000
  });
};

export const aiAgentService = {
  // Create a new AI agent
  async createAgent(agentData: Partial<AIAgent>): Promise<AIAgent> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ai_agents')
        .insert([{
          ...agentData,
          user_id: userData.user.id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating AI agent:', error);
      throw error;
    }
  },

  // Get all AI agents for the current user
  async getAgents(): Promise<AIAgent[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI agents:', error);
      throw error;
    }
  },

  // Update an AI agent
  async updateAgent(id: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AI agent:', error);
      throw error;
    }
  },

  // Delete an AI agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting AI agent:', error);
      throw error;
    }
  },

  // Log agent activity
  async logAgentActivity(logData: Partial<AIAgentLog>): Promise<AIAgentLog> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_logs')
        .insert([{
          ...logData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging agent activity:', error);
      throw error;
    }
  },

  // Process invoice reminders
  async processInvoiceReminders(agent: AIAgent): Promise<void> {
    try {
      // Get overdue invoices or invoices approaching due date
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, customers(*)')
        .eq('status', 'Issued')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const reminderPromises = invoices.map(async (invoice: Invoice) => {
        const dueDate = new Date(invoice.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we should send a reminder based on agent settings
        if (agent.settings.reminder_schedule.days_before.includes(daysUntilDue)) {
          // Generate reminder message using AI
          const message = await this.generateReminderMessage(agent, invoice);

          // Send reminder based on configured channels
          for (const channel of agent.settings.communication_channels) {
            try {
              if (channel === 'email' && invoice.customer_email) {
                await emailService.sendEmail(
                  invoice.customer_email,
                  `Payment Reminder: Invoice ${invoice.invoice_number}`,
                  message,
                  agent.user_id
                );
              } else if (channel === 'sms' && invoice.customer?.phone) {
                // Implement SMS sending here
                // await smsService.sendSMS(invoice.customer.phone, message);
              }

              // Log successful reminder
              await this.logAgentActivity({
                agent_id: agent.id,
                action_type: 'reminder_sent',
                channel,
                customer_id: invoice.customer_id,
                invoice_id: invoice.id,
                message,
                status: 'success'
              });
            } catch (error) {
              console.error(`Error sending ${channel} reminder:`, error);
              
              // Log failed reminder
              await this.logAgentActivity({
                agent_id: agent.id,
                action_type: 'reminder_sent',
                channel,
                customer_id: invoice.customer_id,
                invoice_id: invoice.id,
                message,
                status: 'failed'
              });
            }
          }
        }
      });

      await Promise.all(reminderPromises);
    } catch (error) {
      console.error('Error processing invoice reminders:', error);
      throw error;
    }
  },

  // Generate AI message for reminders
  async generateReminderMessage(agent: AIAgent, invoice: Invoice): Promise<string> {
    try {
      const openai = getOpenAIClient();
      
      // Validate API key by making a test request
      try {
        await openai.models.list();
      } catch (error: any) {
        if (error?.status === 401) {
          throw new Error('Invalid API key or insufficient permissions. Please check your OpenAI API key and organization settings.');
        }
        throw error;
      }
      
      // Generate message using AI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional accounts receivable agent. Your tone is ${agent.settings.tone}. You need to write a payment reminder for an invoice.`
          },
          {
            role: "user", 
            content: `Write a payment reminder for invoice ${invoice.invoice_number} for ${invoice.customer_name}. The amount is $${invoice.total.toFixed(2)} and it's due on ${new Date(invoice.due_date).toLocaleDateString()}.`
          }
        ]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI message:', error);
      
      // Fallback to template system if AI fails
      const templates = {
        professional: `Dear ${invoice.customer_name},\n\nThis is a reminder that invoice ${invoice.invoice_number} for $${invoice.total.toFixed(2)} is due on ${new Date(invoice.due_date).toLocaleDateString()}. Please ensure timely payment to maintain our excellent business relationship.\n\nBest regards,\nYour Account Manager`,
        friendly: `Hi ${invoice.customer_name}! 👋\n\nJust a friendly reminder about invoice ${invoice.invoice_number} for $${invoice.total.toFixed(2)} that's due on ${new Date(invoice.due_date).toLocaleDateString()}. Would really appreciate if you could take care of this when you get a chance!\n\nThanks so much!\nYour Account Manager`,
        formal: `Dear ${invoice.customer_name},\n\nThis correspondence serves as a formal reminder regarding Invoice ${invoice.invoice_number}, amounting to $${invoice.total.toFixed(2)}, which is due for payment on ${new Date(invoice.due_date).toLocaleDateString()}. Your prompt attention to this matter would be greatly appreciated.\n\nYours sincerely,\nYour Account Manager`
      };

      return templates[agent.settings.tone];
    }
  }
};