import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export interface ProvisionVoiceAgentParams {
  organizationId: string;
  agentName: string;
  businessName: string;
  industry?: string;
  greetingScript?: string;
  areaCode?: number;
  countryCode?: string;
  ownerPhone: string;
  ownerName: string;
  agentInstructions?: string;
  // Legacy aliases (edge function accepts both)
  brokerPhone?: string;
  brokerName?: string;
}

export interface ProvisionResult {
  success: boolean;
  phoneNumber?: string;
  phoneNumberPretty?: string;
  agentId?: string;
  agentName?: string;
  error?: string;
  notConfigured?: boolean;
}

export interface UpdateAgentParams {
  organizationId: string;
  mode?: 'update' | 'fetch';
  // Agent-level settings (synced to Retell Agent API)
  agentName?: string;
  businessName?: string;
  voiceId?: string;
  voiceSpeed?: number;
  voiceTemperature?: number;
  responsiveness?: number;
  interruptionSensitivity?: number;
  enableBackchannel?: boolean;
  ambientSound?: string | null;
  language?: string;
  maxCallDurationMs?: number;
  endCallAfterSilenceMs?: number;
  enableVoicemailDetection?: boolean;
  voicemailMessage?: string;
  // LLM-level settings (synced to Retell LLM API)
  generalPrompt?: string;
  beginMessage?: string;
  model?: string;
  modelTemperature?: number;
  knowledgeBaseIds?: string[];
  // DB-only settings
  brokerPhone?: string;
  brokerName?: string;
  isActive?: boolean;
  agentTone?: string;
  greetingScript?: string;
  handlingPreference?: string;
  fallbackBehavior?: string;
  commonCallReasons?: string[];
  businessDescription?: string;
}

// Knowledge Base types
export type KBAction = 'create' | 'add_text' | 'add_url' | 'list' | 'delete' | 'attach_to_agent';

export interface KnowledgeBase {
  knowledge_base_id: string;
  knowledge_base_name: string;
  status: 'in_progress' | 'complete' | 'error' | 'refreshing_in_progress';
  knowledge_base_sources?: Array<{
    type: 'document' | 'text' | 'url';
    source_id?: string;
    title?: string;
    url?: string;
    status?: string;
  }>;
  enable_auto_refresh?: boolean;
  last_refreshed_timestamp?: number;
}

// Voice types
export interface RetellVoice {
  voice_id: string;
  voice_name: string;
  provider: 'elevenlabs' | 'openai' | 'deepgram' | 'cartesia' | 'minimax';
  gender: 'male' | 'female';
  accent?: string;
  age?: string;
  preview_audio_url?: string;
}

export interface ManageKBParams {
  organizationId: string;
  action: KBAction;
  knowledgeBaseName?: string;
  texts?: Array<{ title: string; text: string }>;
  urls?: string[];
  enableAutoRefresh?: boolean;
  knowledgeBaseId?: string;
  title?: string;
  text?: string;
  url?: string;
  knowledgeBaseIds?: string[];
}

/**
 * Get the auth token directly from localStorage to avoid
 * the Supabase JS AbortController issue that kills in-flight
 * requests during auth state transitions.
 */
function getAuthToken(): string | null {
  try {
    const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Invoke a Supabase Edge Function using direct fetch() to bypass
 * the Supabase JS client's AbortController that kills requests.
 */
async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: unknown
): Promise<{ data: T | null; error: string | null }> {
  const token = getAuthToken();
  if (!token) {
    return { data: null, error: 'Not authenticated' };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey || '',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: `Edge function error (${res.status}): ${text}` };
    }

    const data = await res.json();
    return { data: data as T, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

export const retellService = {
  async provisionVoiceAgent(params: ProvisionVoiceAgentParams): Promise<ProvisionResult> {
    try {
      const { data, error } = await invokeEdgeFunction<ProvisionResult>('provision-voice-agent', params);

      if (error) {
        return { success: false, error };
      }

      return data || { success: false, error: 'No response from edge function' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { success: false, error: message };
    }
  },

  async updateAgent(params: UpdateAgentParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await invokeEdgeFunction<{ success: boolean; error?: string }>('update-retell-agent', params);

      if (error) {
        return { success: false, error };
      }

      return data || { success: false, error: 'No response from edge function' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { success: false, error: message };
    }
  },

  async manageKnowledgeBase(params: ManageKBParams): Promise<{
    success: boolean;
    knowledgeBaseId?: string;
    knowledgeBaseName?: string;
    knowledgeBases?: KnowledgeBase[];
    status?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await invokeEdgeFunction<{
        success: boolean;
        knowledgeBaseId?: string;
        knowledgeBaseName?: string;
        knowledgeBases?: KnowledgeBase[];
        status?: string;
        error?: string;
      }>('manage-knowledge-base', params);

      if (error) {
        return { success: false, error };
      }

      return data || { success: false, error: 'No response from edge function' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { success: false, error: message };
    }
  },

  async listVoices(organizationId?: string): Promise<{
    success: boolean;
    voices?: RetellVoice[];
    currentVoiceId?: string | null;
    total?: number;
    notConfigured?: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await invokeEdgeFunction<{
        success: boolean;
        voices?: RetellVoice[];
        currentVoiceId?: string | null;
        total?: number;
        notConfigured?: boolean;
        error?: string;
      }>('list-voices', { organizationId });

      if (error) {
        return { success: false, error };
      }

      return data || { success: false, error: 'No response from edge function' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { success: false, error: message };
    }
  },

  async fetchAgentPrompt(organizationId: string): Promise<{
    success: boolean;
    general_prompt?: string;
    begin_message?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await invokeEdgeFunction<{
        success: boolean;
        general_prompt?: string;
        begin_message?: string;
        error?: string;
      }>('update-retell-agent', { organizationId, mode: 'fetch' });

      if (error) {
        return { success: false, error };
      }

      return data || { success: false, error: 'No response from edge function' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { success: false, error: message };
    }
  },

  async getProvisioningStatus(organizationId: string): Promise<{
    status: string;
    phoneNumber?: string;
    agentId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('provisioning_status, retell_agent_id, retell_phone_number, provisioning_error')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { status: 'not_started' };
      }

      return {
        status: data.provisioning_status || 'not_started',
        phoneNumber: data.retell_phone_number || undefined,
        agentId: data.retell_agent_id || undefined,
        error: data.provisioning_error || undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { status: 'error', error: message };
    }
  },

  async getPhoneNumber(organizationId: string): Promise<{
    phoneNumber?: string;
    phoneNumberPretty?: string;
    status?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('phone_number, phone_number_pretty, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },
};
