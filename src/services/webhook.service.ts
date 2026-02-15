import { supabase } from '../lib/supabase';

export interface Webhook {
    id: string;
    organization_id: string;
    url: string;
    events: string[];
    is_active: boolean;
    secret: string;
    created_at: string;
}

export const webhookService = {
    async getWebhooks(organizationId: string): Promise<Webhook[]> {
        const { data, error } = await supabase
            .from('webhooks')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createWebhook(organizationId: string, webhook: Omit<Webhook, 'id' | 'organization_id' | 'created_at' | 'secret'>): Promise<Webhook> {
        const { data, error } = await supabase
            .from('webhooks')
            .insert({
                ...webhook,
                organization_id: organizationId,
                secret: `whsec_${Math.random().toString(36).substring(2, 15)}`, // Mock secret generation
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateWebhook(webhookId: string, updates: Partial<Webhook>): Promise<void> {
        const { error } = await supabase
            .from('webhooks')
            .update(updates)
            .eq('id', webhookId);

        if (error) throw error;
    },

    async deleteWebhook(webhookId: string): Promise<void> {
        const { error } = await supabase
            .from('webhooks')
            .delete()
            .eq('id', webhookId);

        if (error) throw error;
    },

    async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
        // Fetch the webhook to get its URL and secret
        const { data: webhook, error: fetchError } = await supabase
            .from('webhooks')
            .select('url, secret')
            .eq('id', webhookId)
            .single();

        if (fetchError || !webhook) {
            return { success: false, message: 'Webhook not found' };
        }

        const testPayload = {
            event: 'test.ping',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook from CxTrack CRM',
                webhook_id: webhookId,
            },
        };

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CxTrack-Signature': webhook.secret || '',
                    'X-CxTrack-Event': 'test.ping',
                },
                body: JSON.stringify(testPayload),
            });

            if (response.ok) {
                return { success: true, message: `Test delivered successfully (${response.status})` };
            }
            return { success: false, message: `Endpoint returned ${response.status}: ${response.statusText}` };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Network error';
            return { success: false, message: `Failed to reach endpoint: ${message}` };
        }
    }
};
