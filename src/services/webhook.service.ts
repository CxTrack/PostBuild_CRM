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

    async testWebhook(_webhookId: string): Promise<{ success: boolean; message: string }> {
        // In a real app, this would trigger a test event from the backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Test event sent successfully' };
    }
};
