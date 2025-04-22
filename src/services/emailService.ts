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

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  type: string;
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
      console.log('Saving email settings:', {
        ...settings,
        smtp_password: '***REDACTED***'
      });
      
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
      const portNumber = typeof settings.smtp_port === 'string' ? 
        parseInt(settings.smtp_port) : settings.smtp_port;
        
      if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
        throw new Error('SMTP port must be between 1 and 65535');
      }

      // Use upsert instead of insert to handle existing settings
      const { error } = await supabase 
        .from('email_settings')
        .upsert({
          user_id: userId, 
          smtp_host: settings.smtp_host,
          smtp_port: portNumber,
          smtp_username: settings.smtp_username,
          smtp_password: settings.smtp_password,
          from_email: settings.from_email,
          from_name: settings.from_name,
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
      console.log('Testing email settings:', {
        ...settings,
        smtp_password: '***REDACTED***'
      });
      
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
      const body = { 
        settings: {
          ...settings,
          smtp_port: typeof settings.smtp_port === 'number' ? 
            settings.smtp_port.toString() : settings.smtp_port
        }
      };
      
      console.log('Sending request to test-email-settings:', JSON.stringify({
        ...body,
        settings: {
          ...body.settings,
          smtp_password: '***REDACTED***'
        }
      }));
      
      const { data, error } = await supabase.functions.invoke('test-email-settings', { 
        body,
        headers: {
          'Content-Type': 'application/json',
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
    emailSettings?: EmailSettings,
    attachments?: Attachment[]
  ): Promise<boolean> {
    try {
      console.log('Sending email to:', to, 'subject:', subject);
      
      // If email settings weren't provided, try to fetch them
      if (!emailSettings) {
        emailSettings = await this.getEmailSettings(userId);
      }
      
      if (!emailSettings) {
        throw new Error('Please configure your email settings in your profile before sending emails');
      }

      // Prepare email data
      const emailData = {
        to: to,
        subject: subject,
        html: body,
        from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
        reply_to: emailSettings.from_email
      };
      
      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments;
      }

      // Prepare the request body
      const requestBody = {
        to: to,
        subject: subject,
        body: body,
        sender: userId,
        settings: {
          smtp_host: emailSettings.smtp_host,
          smtp_port: typeof emailSettings.smtp_port === 'number' ? 
            emailSettings.smtp_port.toString() : emailSettings.smtp_port,
          smtp_username: emailSettings.smtp_username,
          smtp_password: emailSettings.smtp_password,
          from_email: emailSettings.from_email,
          from_name: emailSettings.from_name
        }
      };

      try {
        // Use Supabase Edge Function to proxy the Resend API call
        // This avoids CORS issues by making the request server-side
        const { data, error: functionError } = await supabase.functions.invoke('send-email-resend', { 
          body: emailData 
        });

        if (functionError) {
          console.error('Error sending email through edge function:', functionError);
          throw functionError;
        }

        if (!data?.id) {
          throw new Error('Failed to send email through Resend');
        }

        return true;
      } catch (err) {
        console.error('Error sending email:', err);
        throw err instanceof Error 
          ? err 
          : new Error('Failed to send email. Please try again or contact support.');
      }

    } catch (e) {
      console.error('Email service error:', e);
      throw e instanceof Error 
        ? e 
        : new Error('Failed to send email. Please try again or contact support.');
    }
  },

  // Get email templates
  getQuoteEmailTemplate(quoteNumber: string, amount: number): EmailTemplate {
    return {
      subject: `Quote ${quoteNumber} from CxTrack`,
      body: `
Dear Customer,
<br>
Please find attached quote <b>${quoteNumber}</b> for <b>$${amount.toFixed(2)}</b>.
<br>
You can view the quote using the following link:
[Quote Link]
<br>
If you have any questions or would like to discuss this quote further, please don't hesitate to contact us.
<br>
Thank you for considering our services!
<br>
<br>
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
<br>
Please find attached invoice <b>${invoiceNumber}</b> for <b>$${amount.toFixed(2)}</b>.
<br>
If you have any questions, please don't hesitate to contact us.
<br>
Thank you for your business!
<br>
<br>
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
<br>
This is a courteous reminder that invoice <b>${invoiceNumber}</b> for <b>$${amount.toFixed(2)}</b> is due on <b>${dueDate}</b>.
<br>
If you have already made the payment, please disregard this reminder.
<br>
Thank you for your business!
<br>
<br>
Best regards,
CxTrack Team
      `.trim()
    };
  }
};