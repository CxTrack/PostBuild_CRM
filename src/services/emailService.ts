import { supabase } from '../lib/supabase';

interface EmailTemplate {
  subject: string;
  body: string;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

export const emailService = {
  // Get email settings for a user
  async getEmailSettings(userId: string): Promise<EmailSettings | null> {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching email settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      return null;
    }
  },

  // Check if a user has configured email settings
  async checkEmailConfiguration(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking email configuration:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  },

  // Save email settings for a user
  async saveEmailSettings(userId: string, settings: EmailSettings): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate settings first
      if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_username || 
          !settings.smtp_password || !settings.from_email || !settings.from_name) {
        throw new Error('Missing required email settings');
      }

      // Validate email format
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(settings.from_email)) {
        throw new Error('Invalid email format');
      }

      // Validate port range
      if (settings.smtp_port < 1 || settings.smtp_port > 65535) {
        throw new Error('SMTP port must be between 1 and 65535');
      }

      // Use upsert instead of insert to handle existing settings
      const { error } = await supabase 
        .from('email_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        throw new Error(`Failed to save email settings: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to save email settings');
    }
  },

  // Test email settings
  async testEmailSettings(userId: string, settings: EmailSettings): Promise<boolean> {
    try {
      // Validate required settings
      if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_username || 
          !settings.smtp_password || !settings.from_email || !settings.from_name) {
        throw new Error('All email settings fields are required');
      }

      // Validate email format
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(settings.from_email)) {
        throw new Error('Invalid email format');
      }

      // Validate port range
      if (settings.smtp_port < 1 || settings.smtp_port > 65535) {
        throw new Error('SMTP port must be between 1 and 65535');
      }

      // Call Supabase Edge Function to test settings
      const { data, error } = await supabase.functions.invoke('test-email-settings', {
        body: { 
          settings: {
            ...settings,
            smtp_port: settings.smtp_port.toString()
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(
          error instanceof Error 
            ? error.message 
            : 'Failed to connect to email server. Please verify your settings.'
        );
      }

      if (!data?.success) {
        console.error('Edge function response:', data);
        throw new Error(
          data?.error || 
          'Failed to verify email settings. Please check your SMTP credentials.'
        );
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while testing email settings');
    }
  },

  // Send an email
  async sendEmail(
    to: string, 
    subject: string, 
    body: string, 
    userId: string,
    emailSettings?: EmailSettings
  ): Promise<boolean> {
    try {
      // If email settings weren't provided, try to fetch them
      if (!emailSettings) {
        emailSettings = await this.getEmailSettings(userId);
      }
      
      if (!emailSettings) {
        throw new Error('Please configure your email settings in your profile before sending emails');
      }

      // Call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          to,
          subject,
          body,
          sender: userId,
          settings: emailSettings
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        throw new Error(error.message || 'Failed to send email. Please check your email settings.');
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Failed to send email. Please try again or contact support.');
    }
  },

  // Get email templates
  getQuoteEmailTemplate(quoteNumber: string, amount: number): EmailTemplate {
    return {
      subject: `Quote ${quoteNumber} from CxTrack`,
      body: `
Dear Customer,

Please find attached quote ${quoteNumber} for $${amount.toFixed(2)}.

You can view the quote using the following link:
[Quote Link]

If you have any questions or would like to discuss this quote further, please don't hesitate to contact us.

Thank you for considering our services!

Best regards,
CxTrack Team
      `.trim()
    };
  },

  getInvoiceEmailTemplate(invoiceNumber: string, amount: number): EmailTemplate {
    return {
      subject: `Invoice ${invoiceNumber} from CxTrack`,
      body: `
Dear Customer,

Please find attached invoice ${invoiceNumber} for $${amount.toFixed(2)}.

You can view and pay your invoice online using the following link:
[Payment Link]

If you have any questions, please don't hesitate to contact us.

Thank you for your business!

Best regards,
CxTrack Team
      `.trim()
    };
  },

  getPaymentReminderTemplate(invoiceNumber: string, amount: number, dueDate: string): EmailTemplate {
    return {
      subject: `Payment Reminder: Invoice ${invoiceNumber}`,
      body: `
Dear Customer,

This is a friendly reminder that invoice ${invoiceNumber} for $${amount.toFixed(2)} is due on ${dueDate}.

You can view and pay your invoice online using the following link:
[Payment Link]

If you have already made the payment, please disregard this reminder.

Thank you for your business!

Best regards,
CxTrack Team
      `.trim()
    };
  }
};