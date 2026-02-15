import { supabase } from '../lib/supabase';

export interface ApiKey {
    id: string;
    organization_id: string;
    name: string;
    key_prefix: string;
    key_hash?: string;
    created_at: string;
    last_used_at: string | null;
}

async function hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
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
        const prefix = 'cxtrack_live_';
        const secretPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        const fullKey = `${prefix}${secretPart}`;

        // Hash the key before storing — full key is only shown once to the user
        const keyHash = await hashKey(fullKey);

        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                organization_id: organizationId,
                name,
                key_prefix: prefix + secretPart.substring(0, 4) + '...',
                key_hash: keyHash,
            })
            .select()
            .single();

        if (error) throw error;

        // Return the full key ONCE — it cannot be retrieved again after this
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
