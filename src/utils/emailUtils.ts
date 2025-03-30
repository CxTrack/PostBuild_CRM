import { Invoice, Quote } from '../types/database.types';
import { generateInvoicePDF, generateQuotePDF } from './pdfUtils';
import { emailService } from '../services/emailService';
import { useAuthStore } from '../stores/authStore';

export const sendInvoiceEmail = async (invoice: Invoice, additionalMessage: string = ''): Promise<boolean> => {
  try {
    if (!invoice.customer_email) {
      throw new Error('Customer email is not available');
    }

    // Get the current user
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has configured email settings
    const hasEmailConfig = await emailService.checkEmailConfiguration(user.id);
    if (!hasEmailConfig) {
      throw new Error('Please configure your email settings in your profile before sending emails');
    }

    // Generate email content
    const template = emailService.getInvoiceEmailTemplate(invoice.invoice_number, invoice.total);
    const emailBody = `${template.body}\n\n${additionalMessage}`;

    // Generate PDF (in a real app, you'd attach this to the email)
    const doc = generateInvoicePDF(invoice);
    const pdfBlob = doc.output('blob');

    // Send the email with the user's ID for SMTP configuration
    const success = await emailService.sendEmail(
      invoice.customer_email,
      template.subject,
      emailBody,
      user.id
    );

    return success;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error; // Re-throw to handle in the UI
  }
};

export const sendQuoteEmail = async (quote: Quote, additionalMessage: string = ''): Promise<boolean> => {
  try {
    if (!quote.customer_email) {
      throw new Error('Customer email is not available');
    }

    // Get the current user
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has configured email settings
    const hasEmailConfig = await emailService.checkEmailConfiguration(user.id);
    if (!hasEmailConfig) {
      throw new Error('Please configure your email settings in your profile before sending emails');
    }

    // Generate email content
    const template = emailService.getQuoteEmailTemplate(quote.quote_number, quote.total);
    const emailBody = `${template.body}\n\n${additionalMessage}`;

    // Generate PDF (in a real app, you'd attach this to the email)
    const doc = generateQuotePDF(quote);
    const pdfBlob = doc.output('blob');

    // Send the email with the user's ID for SMTP configuration
    const success = await emailService.sendEmail(
      quote.customer_email,
      template.subject,
      emailBody,
      user.id
    );

    return success;
  } catch (error) {
    console.error('Error sending quote email:', error);
    throw error; // Re-throw to handle in the UI
  }
};

export const sendPaymentReminder = async (
  invoice: Invoice, 
  email: string, 
  daysBeforeDue: number
): Promise<boolean> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if email settings are configured
    const emailSettings = await emailService.getEmailSettings(user.id);
    if (!emailSettings) {
      throw new Error('Please configure your email settings in your profile before sending emails');
    }

    // Generate email content
    const template = emailService.getPaymentReminderTemplate(
      invoice.invoice_number, 
      invoice.total,
      new Date(invoice.due_date).toLocaleDateString()
    );

    return await emailService.sendEmail(
      email,
      template.subject,
      template.body,
      user.id,
      emailSettings
    );
  } catch (error) {
    console.error('Error setting up payment reminder:', error);
    throw error;
  }
};