import { supabase, supabaseUrl } from '../lib/supabase';
import { twilioService } from './twilio.service';

export interface SMSSettings {
  id: string;
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  is_configured: boolean;
  sms_enabled: boolean;
  pipeline_sms_enabled: boolean;
  pipeline_stages_to_notify: string[];
  default_sender_name: string | null;
  signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface SMSLog {
  id: string;
  organization_id: string;
  document_type: 'quote' | 'invoice' | 'call_summary' | 'custom' | 'pipeline' | 'reminder';
  document_id: string | null;
  customer_id: string | null;
  sent_by: string | null;
  template_key: string | null;
  recipient_phone: string;
  message_body: string;
  message_sid: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export interface SMSTemplate {
  id: string;
  industry: string;
  template_key: string;
  category: string;
  name: string;
  body: string;
  is_active: boolean;
  sort_order: number;
}

// Read auth token from localStorage (AbortController workaround)
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

function validatePhoneNumber(phone: string): { valid: boolean; formatted: string; error?: string } {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 10) {
    return { valid: false, formatted: phone, error: 'Phone number must be at least 10 digits' };
  }

  if (cleaned.length === 10) {
    return { valid: true, formatted: `+1${cleaned}` };
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return { valid: true, formatted: `+${cleaned}` };
  }

  if (cleaned.startsWith('+')) {
    return { valid: true, formatted: phone };
  }

  return { valid: true, formatted: `+${cleaned}` };
}

// Substitute template variables like {{customer_name}}, {{business_name}}, etc.
export function substituteTemplateVars(
  body: string,
  vars: Record<string, string>
): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export const smsService = {
  async getSMSSettings(organizationId: string): Promise<SMSSettings | null> {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveSMSSettings(
    organizationId: string,
    settings: {
      twilio_account_sid: string;
      twilio_auth_token: string;
      twilio_phone_number: string;
    }
  ): Promise<SMSSettings> {
    const existing = await this.getSMSSettings(organizationId);

    const settingsData = {
      organization_id: organizationId,
      twilio_account_sid: settings.twilio_account_sid,
      twilio_auth_token: settings.twilio_auth_token,
      twilio_phone_number: settings.twilio_phone_number,
      is_configured: !!(
        settings.twilio_account_sid &&
        settings.twilio_auth_token &&
        settings.twilio_phone_number
      ),
    };

    if (existing) {
      const { data, error } = await supabase
        .from('sms_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('sms_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async updateSMSPreferences(
    organizationId: string,
    prefs: {
      sms_enabled?: boolean;
      pipeline_sms_enabled?: boolean;
      pipeline_stages_to_notify?: string[];
      default_sender_name?: string;
      signature?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('sms_settings')
      .upsert(
        { organization_id: organizationId, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: 'organization_id' }
      );

    if (error) throw error;
  },

  async testConnection(organizationId: string): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getSMSSettings(organizationId);

    if (!settings || !settings.is_configured) {
      return { success: false, error: 'SMS settings not configured' };
    }

    return { success: true };
  },

  validatePhoneNumber,

  // Check if org has any phone number (provisioned or manual)
  async hasPhoneNumber(organizationId: string): Promise<boolean> {
    // Check provisioned numbers first
    const { data: provNumbers } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .limit(1);

    if (provNumbers && provNumbers.length > 0) return true;

    // Check sms_settings
    const settings = await this.getSMSSettings(organizationId);
    return settings?.is_configured ?? false;
  },

  // Send custom/free-form SMS via edge function (uses direct fetch)
  async sendCustomSMS(
    organizationId: string,
    to: string,
    body: string,
    options?: {
      customerId?: string;
      documentType?: string;
      documentId?: string;
      templateKey?: string;
      templateVariables?: Record<string, string>;
    }
  ): Promise<{ success: boolean; error?: string; messageSid?: string }> {
    const phoneValidation = validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          to: phoneValidation.formatted,
          body,
          organizationId,
          documentType: options?.documentType || 'custom',
          documentId: options?.documentId,
          customerId: options?.customerId,
          templateKey: options?.templateKey,
          templateVariables: options?.templateVariables,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Fetch industry SMS templates
  async fetchTemplates(industry: string): Promise<SMSTemplate[]> {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('industry', industry)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendQuoteSMS(
    organizationId: string,
    quoteId: string,
    quoteNumber: string,
    recipientPhone: string,
    shareLink: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string; messageSid?: string }> {
    const message = `You have a new quote ${quoteNumber} from ${companyName}. View it here: ${shareLink}`;

    return this.sendCustomSMS(organizationId, recipientPhone, message, {
      documentType: 'quote',
      documentId: quoteId,
    });
  },

  async sendInvoiceSMS(
    organizationId: string,
    invoiceId: string,
    invoiceNumber: string,
    recipientPhone: string,
    shareLink: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string; messageSid?: string }> {
    const message = `You have a new invoice ${invoiceNumber} from ${companyName}. View it here: ${shareLink}`;

    return this.sendCustomSMS(organizationId, recipientPhone, message, {
      documentType: 'invoice',
      documentId: invoiceId,
    });
  },

  async getSMSLog(organizationId: string, customerId?: string): Promise<SMSLog[]> {
    let query = supabase
      .from('sms_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  formatMessagePreview(
    documentType: 'quote' | 'invoice',
    documentNumber: string,
    shareLink: string,
    companyName: string
  ): { message: string; charCount: number } {
    const message = `You have a new ${documentType} ${documentNumber} from ${companyName}. View it here: ${shareLink}`;
    return {
      message,
      charCount: message.length,
    };
  },
};
