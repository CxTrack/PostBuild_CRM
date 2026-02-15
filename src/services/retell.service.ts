import { supabase } from '../lib/supabase';

export interface ProvisionVoiceAgentParams {
  organizationId: string;
  agentName: string;
  businessName: string;
  greetingScript?: string;
  areaCode?: number;
  countryCode?: string;
  brokerPhone: string;
  brokerName: string;
  agentInstructions?: string;
}

export interface ProvisionResult {
  success: boolean;
  phoneNumber?: string;
  phoneNumberPretty?: string;
  agentId?: string;
  agentName?: string;
  error?: string;
}

export interface UpdateAgentParams {
  organizationId: string;
  agentName?: string;
  businessName?: string;
  brokerPhone?: string;
  brokerName?: string;
  isActive?: boolean;
}

export const retellService = {
  async provisionVoiceAgent(params: ProvisionVoiceAgentParams): Promise<ProvisionResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await supabase.functions.invoke('provision-voice-agent', {
        body: params,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return response.data as ProvisionResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { success: false, error: message };
    }
  },

  async updateAgent(params: UpdateAgentParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await supabase.functions.invoke('update-retell-agent', {
        body: params,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return response.data as { success: boolean; error?: string };
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
