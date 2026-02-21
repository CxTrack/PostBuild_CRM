import { supabase } from '../lib/supabase';

export interface BusinessSettings {
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_postal_code: string | null;
  business_country: string | null;
  business_website: string | null;
  logo_url: string | null;
  primary_color: string;
  quote_prefix: string;
  invoice_prefix: string;
  default_payment_terms: string;
  default_quote_template_id: string | null;
  default_invoice_template_id: string | null;
  business_tax_id: string | null;
  default_tax_rate: number;
  tax_label: string;
}

export interface DocumentTemplate {
  id: string;
  organization_id: string;
  template_type: 'quote' | 'invoice';
  name: string;
  is_default: boolean;
  logo_url: string | null;
  color_scheme: {
    primary: string;
    accent: string;
  };
  font_family: string;
  layout_type: 'modern' | 'classic' | 'minimal' | 'creative';
  show_line_numbers: boolean;
  show_product_images: boolean;
  header_text: string | null;
  footer_text: string | null;
  terms_text: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationPDFInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  template_color?: string;
}

export const settingsService = {
  async getBusinessSettings(organizationId: string): Promise<BusinessSettings | null> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const stored = localStorage.getItem(storageKey);
    const token = stored ? JSON.parse(stored)?.access_token : null;

    if (!token) throw new Error('Not authenticated');

    const fields = [
      'business_email', 'business_phone', 'business_address', 'business_city',
      'business_state', 'business_postal_code', 'business_country', 'business_website',
      'logo_url', 'primary_color', 'quote_prefix', 'invoice_prefix',
      'default_payment_terms', 'default_quote_template_id', 'default_invoice_template_id',
      'business_tax_id', 'default_tax_rate', 'tax_label'
    ].join(',');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}&select=${fields}`,
      {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.pgrst.object+json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to load settings (${response.status})`);
    }

    return response.json();
  },

  async getOrganizationForPDF(organizationId: string): Promise<OrganizationPDFInfo> {

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        name,
        business_email,
        business_phone,
        business_address,
        business_city,
        business_state,
        business_postal_code,
        business_country,
        business_website,
        logo_url,
        default_quote_template_id,
        default_invoice_template_id
      `)
      .eq('id', organizationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Organization not found');
    }

    // Look up default template color (prefer quote template, fall back to invoice)
    let templateColor: string | undefined;
    const templateId = data.default_quote_template_id || data.default_invoice_template_id;
    if (templateId) {
      const { data: template } = await supabase
        .from('document_templates')
        .select('color_scheme')
        .eq('id', templateId)
        .maybeSingle();
      if (template?.color_scheme?.primary) {
        templateColor = template.color_scheme.primary;
      }
    }

    return {
      name: data.name,
      address: data.business_address || undefined,
      city: data.business_city || undefined,
      state: data.business_state || undefined,
      postal_code: data.business_postal_code || undefined,
      country: data.business_country || undefined,
      phone: data.business_phone || undefined,
      email: data.business_email || undefined,
      website: data.business_website || undefined,
      logo_url: data.logo_url || undefined,
      template_color: templateColor,
    };
  },

  async getOrganizationForPDFWithTemplate(
    organizationId: string,
    docType: 'quote' | 'invoice'
  ): Promise<OrganizationPDFInfo> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        name,
        business_email,
        business_phone,
        business_address,
        business_city,
        business_state,
        business_postal_code,
        business_country,
        business_website,
        logo_url,
        default_quote_template_id,
        default_invoice_template_id
      `)
      .eq('id', organizationId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Organization not found');

    // Look up the template for the specific document type
    let templateColor: string | undefined;
    const templateId = docType === 'quote'
      ? data.default_quote_template_id
      : data.default_invoice_template_id;

    if (templateId) {
      const { data: template } = await supabase
        .from('document_templates')
        .select('color_scheme')
        .eq('id', templateId)
        .maybeSingle();
      if (template?.color_scheme?.primary) {
        templateColor = template.color_scheme.primary;
      }
    }

    return {
      name: data.name,
      address: data.business_address || undefined,
      city: data.business_city || undefined,
      state: data.business_state || undefined,
      postal_code: data.business_postal_code || undefined,
      country: data.business_country || undefined,
      phone: data.business_phone || undefined,
      email: data.business_email || undefined,
      website: data.business_website || undefined,
      logo_url: data.logo_url || undefined,
      template_color: templateColor,
    };
  },

  async updateBusinessSettings(
    organizationId: string,
    settings: Partial<BusinessSettings>
  ): Promise<void> {
    // Use direct fetch to avoid Supabase JS AbortController bug
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const stored = localStorage.getItem(storageKey);
    const token = stored ? JSON.parse(stored)?.access_token : null;

    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to save settings (${response.status})`);
    }
  },

  async getTemplates(
    organizationId: string,
    type?: 'quote' | 'invoice'
  ): Promise<DocumentTemplate[]> {
    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('template_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createTemplate(
    organizationId: string,
    template: Omit<DocumentTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<DocumentTemplate> {
    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        ...template,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(
    templateId: string,
    updates: Partial<DocumentTemplate>
  ): Promise<void> {
    const { error } = await supabase
      .from('document_templates')
      .update(updates)
      .eq('id', templateId);

    if (error) throw error;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('document_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  async initializeDefaultTemplates(organizationId: string): Promise<void> {
    const quoteTemplates = [
      {
        template_type: 'quote' as const,
        name: 'Modern Blue',
        layout_type: 'modern' as const,
        color_scheme: { primary: '#3b82f6', accent: '#10b981' },
        font_family: 'Inter',
        show_line_numbers: true,
        show_product_images: false,
        is_default: true,
        header_text: null,
        footer_text: null,
        terms_text: null,
        custom_fields: {},
        logo_url: null,
      },
      {
        template_type: 'quote' as const,
        name: 'Classic Professional',
        layout_type: 'classic' as const,
        color_scheme: { primary: '#1e40af', accent: '#059669' },
        font_family: 'Inter',
        show_line_numbers: true,
        show_product_images: false,
        is_default: false,
        header_text: null,
        footer_text: null,
        terms_text: null,
        custom_fields: {},
        logo_url: null,
      },
      {
        template_type: 'quote' as const,
        name: 'Minimal White',
        layout_type: 'minimal' as const,
        color_scheme: { primary: '#374151', accent: '#6b7280' },
        font_family: 'Inter',
        show_line_numbers: false,
        show_product_images: false,
        is_default: false,
        header_text: null,
        footer_text: null,
        terms_text: null,
        custom_fields: {},
        logo_url: null,
      },
      {
        template_type: 'quote' as const,
        name: 'Professional Green',
        layout_type: 'modern' as const,
        color_scheme: { primary: '#059669', accent: '#3b82f6' },
        font_family: 'Inter',
        show_line_numbers: true,
        show_product_images: true,
        is_default: false,
        header_text: null,
        footer_text: null,
        terms_text: null,
        custom_fields: {},
        logo_url: null,
      },
    ];

    const invoiceTemplates = quoteTemplates.map(template => ({
      ...template,
      template_type: 'invoice' as const,
    }));

    const allTemplates = [...quoteTemplates, ...invoiceTemplates];

    for (const template of allTemplates) {
      await this.createTemplate(organizationId, template);
    }
  },
};
