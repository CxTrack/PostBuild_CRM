import { supabase } from '../lib/supabase';

export interface ApiKey {
    id: string;
    organization_id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    last_used_at: string | null;
}

export const apiKeyService = {
    async getApiKeys(organizationId: string): Promise<ApiKey[]> {
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createApiKey(organizationId: string, name: string): Promise<{ key: string; apiKey: ApiKey }> {
        const prefix = 'ct_';
        const secretPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        const fullKey = `${prefix}${secretPart}`;

        // In a real app, you'd store a hash of the key, not the key itself
        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                organization_id: organizationId,
                name,
                key_prefix: prefix + secretPart.substring(0, 4) + '...',
                // key_hash: hash(fullKey), 
            })
            .select()
            .single();

        if (error) throw error;

        return { key: fullKey, apiKey: data };
    },

    async deleteApiKey(keyId: string): Promise<void> {
        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', keyId);

        if (error) throw error;
    }
};
