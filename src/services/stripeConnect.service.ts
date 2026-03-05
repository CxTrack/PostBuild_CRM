/**
 * Stripe Connect Service
 * Uses direct fetch() to Supabase Edge Functions (AbortController workaround)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/stripe-connect`;

function getAuthToken(): string | null {
  // Read token from localStorage (AbortController workaround)
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

export interface StripeConnectStatus {
  connected: boolean;
  account_id?: string;
  status: 'disconnected' | 'pending' | 'active' | 'restricted';
  platform_fee_pct: number;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

export const stripeConnectService = {
  /**
   * Generate OAuth URL for connecting a Stripe account
   */
  async createOAuthLink(organizationId: string): Promise<string> {
    const data = await callEdgeFunction('create_oauth_link', { organization_id: organizationId });
    return data.url;
  },

  /**
   * Complete OAuth flow - exchange auth code for connected account
   */
  async completeOAuth(code: string, organizationId: string): Promise<{ account_id: string }> {
    const data = await callEdgeFunction('complete_oauth', {
      code,
      organization_id: organizationId,
    });
    return data;
  },

  /**
   * Get the current connection status of the org's Stripe account
   */
  async getAccountStatus(organizationId: string): Promise<StripeConnectStatus> {
    const data = await callEdgeFunction('get_account_status', {
      organization_id: organizationId,
    });
    return data;
  },

  /**
   * Create a Stripe Checkout Session for an invoice payment
   */
  async createCheckoutSession(
    invoiceId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<{ url: string; session_id: string }> {
    const data = await callEdgeFunction('create_checkout_session', {
      invoice_id: invoiceId,
      amount,
      currency,
    });
    return data;
  },

  /**
   * Disconnect the org's Stripe account
   */
  async disconnect(organizationId: string): Promise<void> {
    await callEdgeFunction('disconnect', { organization_id: organizationId });
  },

  /**
   * Get payment link history for an invoice
   */
  async getPaymentLinks(invoiceId: string): Promise<any[]> {
    const data = await callEdgeFunction('get_payment_links', {
      invoice_id: invoiceId,
    });
    return data.payment_links || [];
  },
};
