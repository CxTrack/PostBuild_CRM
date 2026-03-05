/**
 * Stripe Billing Service
 * Fetches subscription invoices and manages customer billing portal.
 * Uses direct fetch() to Supabase Edge Functions (AbortController workaround).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/stripe-billing`;

function getAuthToken(): string | null {
  const ref = SUPABASE_URL?.split('//')[1]?.split('.')[0];
  const key = ref ? `sb-${ref}-auth-token` : Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  if (!key) return null;
  const stored = localStorage.getItem(typeof key === 'string' ? key : '');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed.access_token || null;
  } catch {
    return null;
  }
}

async function callEdgeFunction(action: string, payload: Record<string, any> = {}): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export interface StripeInvoice {
  id: string;
  number: string | null;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  period_start: number;
  period_end: number;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  created: number;
}

export const stripeBillingService = {
  async getInvoices(organizationId: string): Promise<StripeInvoice[]> {
    const data = await callEdgeFunction('get_invoices', { organization_id: organizationId });
    return data.invoices || [];
  },

  async getCustomerPortalUrl(organizationId: string): Promise<string> {
    const data = await callEdgeFunction('get_customer_portal_url', { organization_id: organizationId });
    return data.url;
  },

  /**
   * Create a Stripe Checkout Session for subscribing to a plan.
   * Returns the Stripe-hosted checkout URL to redirect to.
   */
  async createCheckoutSession(
    planId: string,
    successUrl: string,
    cancelUrl: string,
    organizationId?: string
  ): Promise<{ url: string; sessionId: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/stripe-checkout`;
    const response = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_checkout_session',
        planId,
        successUrl,
        cancelUrl,
        organizationId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  },
};
