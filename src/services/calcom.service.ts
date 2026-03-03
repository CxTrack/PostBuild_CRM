import { supabase } from '@/lib/supabase';

const CALCOM_AUTH_URL = 'https://app.cal.com/auth/oauth2/authorize';
const CALCOM_API_BASE = 'https://api.cal.com/v2';
const CALCOM_CLIENT_ID = '35fdb9a86313a5ae4b15d2152c214281ca2bd56f32bf01e60b7dbc6708bcfcfb';
const REDIRECT_URI = `${window.location.origin}/dashboard/settings/calcom-callback`;

interface CalComSettings {
  id: string;
  organization_id: string;
  connection_status: 'connected' | 'disconnected' | 'expired';
  calcom_user_email: string | null;
  calcom_username: string | null;
  default_event_type_id: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  auto_sync: boolean;
}

interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description: string | null;
}

class CalComOAuthService {
  /**
   * Generate the Cal.com OAuth authorization URL
   */
  getAuthUrl(organizationId: string): string {
    const params = new URLSearchParams({
      client_id: CALCOM_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state: organizationId,
    });
    return `${CALCOM_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens via edge function
   */
  async exchangeCode(code: string, organizationId: string): Promise<{ email?: string; username?: string }> {
    const token = await this.getAuthToken();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const resp = await fetch(`${supabaseUrl}/functions/v1/calcom-oauth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        code,
        organization_id: organizationId,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to connect Cal.com');
    return data;
  }

  /**
   * Disconnect Cal.com from the organization
   */
  async disconnect(organizationId: string): Promise<void> {
    const token = await this.getAuthToken();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const resp = await fetch(`${supabaseUrl}/functions/v1/calcom-oauth/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ organization_id: organizationId }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to disconnect Cal.com');
  }

  /**
   * Get Cal.com connection settings for the current org
   */
  async getSettings(organizationId: string): Promise<CalComSettings | null> {
    const { data, error } = await supabase
      .from('calcom_settings')
      .select('id, organization_id, connection_status, calcom_user_email, calcom_username, default_event_type_id, access_token, token_expires_at, auto_sync')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error || !data) return null;
    return data as CalComSettings;
  }

  /**
   * Get a valid access token, refreshing if expired
   */
  async getValidToken(organizationId: string): Promise<string | null> {
    const settings = await this.getSettings(organizationId);
    if (!settings?.access_token) return null;

    // Check if token is expired (with 2-minute buffer)
    if (settings.token_expires_at) {
      const expiresAt = new Date(settings.token_expires_at).getTime();
      const now = Date.now() + 2 * 60 * 1000; // 2 min buffer
      if (now >= expiresAt) {
        return this.refreshToken(organizationId);
      }
    }

    return settings.access_token;
  }

  /**
   * Refresh an expired access token via edge function
   */
  private async refreshToken(organizationId: string): Promise<string | null> {
    try {
      const token = await this.getAuthToken();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const resp = await fetch(`${supabaseUrl}/functions/v1/calcom-oauth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ organization_id: organizationId }),
      });

      const data = await resp.json();
      if (!resp.ok) return null;
      return data.access_token;
    } catch {
      return null;
    }
  }

  /**
   * Fetch event types from Cal.com using OAuth token
   */
  async getEventTypes(organizationId: string): Promise<CalComEventType[]> {
    const accessToken = await this.getValidToken(organizationId);
    if (!accessToken) return [];

    try {
      const resp = await fetch(`${CALCOM_API_BASE}/event-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.data || data.event_types || []).map((et: any) => ({
        id: et.id,
        title: et.title || et.slug,
        slug: et.slug,
        length: et.length || 30,
        description: et.description || null,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Update the default event type ID for an organization
   */
  async setDefaultEventType(organizationId: string, eventTypeId: string): Promise<void> {
    await supabase
      .from('calcom_settings')
      .update({
        default_event_type_id: eventTypeId,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);
  }

  /**
   * Get the current user's auth token from Supabase session
   */
  private async getAuthToken(): Promise<string> {
    // Read from localStorage to avoid AbortController issues
    const ref = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
    const stored = localStorage.getItem(`sb-${ref}-auth-token`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.access_token;
    }
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }
}

export const calComOAuthService = new CalComOAuthService();
