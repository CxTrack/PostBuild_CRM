import { supabase } from '../lib/supabase';
import { getAuthToken, getSupabaseUrl } from '../utils/auth.utils';

export interface TwilioSettings {
    id: string;
    organization_id: string;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    twilio_phone_number: string | null;
    is_configured: boolean;
    created_at: string;
    updated_at: string;
}

export interface CallResult {
    success: boolean;
    callSid?: string;
    status?: string;
    error?: string;
}

export interface SMSResult {
    success: boolean;
    messageSid?: string;
    status?: string;
    error?: string;
}

export const twilioService = {
    /**
     * Get Twilio settings for an organization
     */
    async getSettings(organizationId: string): Promise<TwilioSettings | null> {
        const { data, error } = await supabase
            .from('sms_settings')
            .select('id, organization_id, twilio_phone_number, is_configured, created_at, updated_at')
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Save Twilio credentials
     */
    async saveSettings(
        organizationId: string,
        settings: {
            twilio_account_sid: string;
            twilio_auth_token: string;
            twilio_phone_number: string;
        }
    ): Promise<TwilioSettings> {
        // Store credentials securely in Vault via RPC
        const { error: rpcError } = await supabase.rpc('save_sms_credentials', {
            p_organization_id: organizationId,
            p_twilio_account_sid: settings.twilio_account_sid,
            p_twilio_auth_token: settings.twilio_auth_token,
            p_twilio_phone_number: settings.twilio_phone_number,
        });

        if (rpcError) throw rpcError;

        // Fetch updated settings (without secrets)
        const updated = await this.getSettings(organizationId);
        if (!updated) throw new Error('Failed to retrieve updated Twilio settings');
        return updated;
    },

    /**
     * Test Twilio connection by verifying credentials
     */
    async testConnection(organizationId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const settings = await this.getSettings(organizationId);

            if (!settings || !settings.is_configured) {
                return { success: false, error: 'Twilio settings not configured' };
            }

            // For now, just verify credentials are present
            // In production, you could call Twilio's account API to verify
            if (settings.twilio_account_sid && settings.twilio_auth_token && settings.twilio_phone_number) {
                return { success: true };
            }

            return { success: false, error: 'Incomplete credentials' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Send SMS via Twilio Edge Function
     */
    async sendSMS(
        organizationId: string,
        to: string,
        body: string,
        options?: {
            documentType?: 'quote' | 'invoice';
            documentId?: string;
        }
    ): Promise<SMSResult> {
        try {
            const token = await getAuthToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await fetch(`${getSupabaseUrl()}/functions/v1/send-sms`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    body,
                    organizationId,
                    documentType: options?.documentType,
                    documentId: options?.documentId,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.error || `SMS failed (${response.status})` };
            }

            return data as SMSResult;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Initiate a voice call via Twilio Edge Function
     */
    async makeCall(
        organizationId: string,
        to: string,
        options?: {
            twimlUrl?: string;
            customerId?: string;
            callType?: 'outbound' | 'ai_agent';
        }
    ): Promise<CallResult> {
        try {
            const token = await getAuthToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await fetch(`${getSupabaseUrl()}/functions/v1/make-call`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    organizationId,
                    twimlUrl: options?.twimlUrl,
                    customerId: options?.customerId,
                    callType: options?.callType || 'outbound',
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.error || `Call failed (${response.status})` };
            }

            return data as CallResult;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Format phone number to E.164 format
     */
    formatPhoneNumber(phone: string): { valid: boolean; formatted: string; error?: string } {
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

        return { valid: true, formatted: `+${cleaned}` };
    },

    /**
     * Check if Twilio is configured for an organization
     */
    async isConfigured(organizationId: string): Promise<boolean> {
        try {
            const settings = await this.getSettings(organizationId);
            return settings?.is_configured ?? false;
        } catch {
            return false;
        }
    },
};
