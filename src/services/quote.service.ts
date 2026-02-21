import { supabase } from '../lib/supabase';

export interface QuoteLineItem {
  id?: string;
  product_id?: string;
  product_type?: 'product' | 'service' | 'bundle';
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_rate?: number;
  line_total: number;
  is_optional?: boolean;
  sort_order: number;
}

// Real estate specific fields stored in custom_fields
export interface RealEstateProposalFields {
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  property_type?: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial' | 'other';
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: string;
  year_built?: number;
  listing_price?: number;
  commission_rate?: number;
  commission_amount?: number;
  marketing_budget?: number;
  listing_type?: 'exclusive' | 'open' | 'net';
  listing_duration?: number; // months
  property_highlights?: string;
  marketing_plan?: string;
  comparable_sales?: string;
}

export interface QuoteFormData {
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: any;
  quote_date: string;
  expiry_date?: string;
  items: QuoteLineItem[];
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  tax_amount: number;
  total_amount: number;
  payment_terms?: string;
  notes?: string;
  terms?: string;
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';
  custom_fields?: RealEstateProposalFields | Record<string, any>;
}

export interface Quote extends QuoteFormData {
  id: string;
  organization_id: string;
  quote_number: string;
  version: number;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  converted_to_invoice_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const quoteService = {
  async generateQuoteNumber(organizationId: string, prefix: string = 'QT'): Promise<string> {
    const { data, error } = await supabase
      .from('quotes')
      .select('quote_number')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(data.quote_number.split('-')[1] || '0');
    return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
  },

  async createQuote(
    organizationId: string,
    userId: string,
    quoteData: QuoteFormData
  ): Promise<Quote> {
    const quoteNumber = await this.generateQuoteNumber(organizationId);

    const quoteInsertData: any = {
      organization_id: organizationId,
      quote_number: quoteNumber,
      customer_id: quoteData.customer_id,
      customer_name: quoteData.customer_name,
      customer_email: quoteData.customer_email,
      customer_phone: quoteData.customer_phone || null,
      customer_address: quoteData.customer_address,
      quote_date: quoteData.quote_date,
      expiry_date: quoteData.expiry_date,
      subtotal: quoteData.subtotal,
      discount_amount: quoteData.discount_amount || 0,
      discount_percentage: quoteData.discount_percentage || 0,
      tax_amount: quoteData.tax_amount,
      total_amount: quoteData.total_amount,
      payment_terms: quoteData.payment_terms,
      notes: quoteData.notes,
      terms: quoteData.terms,
      status: quoteData.status || 'draft',
      custom_fields: quoteData.custom_fields || {},
    };

    if (userId && userId !== '00000000-0000-0000-0000-000000000001') {
      quoteInsertData.created_by = userId;
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteInsertData)
      .select()
      .single();

    if (quoteError) throw quoteError;

    const items = quoteData.items.map(item => ({
      quote_id: quote.id,
      product_id: item.product_id,
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      discount_amount: item.discount_amount || 0,
      tax_rate: item.tax_rate || 0,
      line_total: item.line_total,
      is_optional: item.is_optional || false,
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return { ...quote, items: quoteData.items };
  },

  async getQuote(quoteId: string, organizationId?: string): Promise<Quote | null> {
    let query = supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId);

    // Add organization filter if provided (required for security)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: quote, error: quoteError } = await query.maybeSingle();

    if (quoteError) throw quoteError;
    if (!quote) return null;

    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('sort_order');

    if (itemsError) throw itemsError;

    return { ...quote, items: items || [] };
  },

  async getQuotes(organizationId: string): Promise<Quote[]> {
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*, quote_items(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (quotesError) throw quotesError;

    return quotes.map((quote: any) => ({
      ...quote,
      items: quote.quote_items || [],
    }));
  },

  async updateQuote(
    quoteId: string,
    updates: Partial<QuoteFormData>,
    organizationId: string
  ): Promise<void> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        customer_id: updates.customer_id,
        customer_name: updates.customer_name,
        customer_email: updates.customer_email,
        customer_phone: updates.customer_phone || null,
        customer_address: updates.customer_address,
        quote_date: updates.quote_date,
        expiry_date: updates.expiry_date,
        subtotal: updates.subtotal,
        discount_amount: updates.discount_amount,
        discount_percentage: updates.discount_percentage,
        tax_amount: updates.tax_amount,
        total_amount: updates.total_amount,
        payment_terms: updates.payment_terms,
        notes: updates.notes,
        terms: updates.terms,
        status: updates.status,
        custom_fields: updates.custom_fields,
      })
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (quoteError) throw quoteError;

    if (updates.items) {
      // Fetch existing items first for potential rollback
      const { data: existingItems } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);

      // Prepare new items
      const newItems = updates.items.map(item => ({
        quote_id: quoteId,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate || 0,
        line_total: item.line_total,
        is_optional: item.is_optional || false,
        sort_order: item.sort_order,
      }));

      // Delete existing items
      await supabase.from('quote_items').delete().eq('quote_id', quoteId);

      // Insert new items
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(newItems);

      if (itemsError) {
        // Attempt to restore old items on failure
        if (existingItems && existingItems.length > 0) {
          const restoredItems = existingItems.map(({ id, ...rest }) => rest);
          await supabase.from('quote_items').insert(restoredItems);
        }
        throw new Error(`Failed to update quote items: ${itemsError.message}`);
      }
    }
  },

  async deleteQuote(quoteId: string, organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  async sendQuote(quoteId: string, organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  async markAsViewed(quoteId: string, organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  async acceptQuote(quoteId: string, organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  async declineQuote(quoteId: string, organizationId: string, reason?: string): Promise<void> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason,
      })
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },
};
