import { Invoice, Quote } from '../types/database.types';
import { generateInvoicePDF, generateQuotePDF } from './pdfUtils';
import { emailService } from '../services/emailService';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { userService } from '../services/usersService';

export const sendInvoiceEmail = async (invoice: Invoice, additionalMessage: string = '', attachPdf: boolean = true): Promise<boolean> => {
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

    // Generate PDF for attachment
    let pdfAttachment = null;
    if (attachPdf) {
      const doc = generateInvoicePDF(invoice);
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      pdfAttachment = {
        filename: `Invoice-${invoice.invoice_number}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        type: 'application/pdf'
      };
    }

    try {
      // Send the email with the user's ID for SMTP configuration
      const success = await emailService.sendEmail(
        invoice.customer_email,
        template.subject,
        emailBody,
        pdfAttachment ? [pdfAttachment] : undefined
      );

      return success;
    } catch (e) {
      console.error('Error sending invoice email:', e);
      throw e instanceof Error 
        ? e 
        : new Error('Failed to send invoice email');
    }
  } catch (e) {
    console.error('Error sending invoice email:', e);
    throw e instanceof Error 
      ? e 
      : new Error('Failed to send invoice email');
  }
};

export const sendQuoteEmail = async (quote: Quote, additionalMessage: string = '', attachPdf: boolean = true, subject: string): Promise<boolean> => {
  try {
    if (!quote.customer_email) {
      throw new Error('Customer email is not available');
    }

    // Get the current user
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    var profile = await userService.getProfile();

    // Check if user has configured email settings
    const hasEmailConfig = await emailService.checkEmailConfiguration(user.id);
    if (!hasEmailConfig) {
      throw new Error('Please configure your email settings in your profile before sending emails');
    }

    
    // Generate email content
    const template = emailService.getQuoteEmailTemplate(quote.quote_number, quote.total, profile, additionalMessage, subject);
    const emailBody = `${template.body}`;

    // Generate PDF for attachment
    let pdfAttachment = null;
    if (attachPdf) {
      const doc = generateQuotePDF(quote);
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      pdfAttachment = {
        filename: `Quote-${quote.quote_number}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        type: 'application/pdf'
      };
    }

    try {
      const success = await emailService.sendEmail(
        quote.customer_email,
        subject,
        emailBody,
        pdfAttachment ? [pdfAttachment] : undefined
      );

      return success;
    } catch (e) {
      console.error('Error sending quote email:', e);
      throw e instanceof Error 
        ? e 
        : new Error('Failed to send quote email');
    }
  } catch (e) {
    console.error('Error sending quote email:', e);
    throw e instanceof Error 
      ? e 
      : new Error('Failed to send quote email');
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
  } catch (e) {
    console.error('Error setting up payment reminder:', e);
    throw e instanceof Error 
      ? e 
      : new Error('Failed to send payment reminder');
  }
};