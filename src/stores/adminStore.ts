import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

// Helper to get auth token from localStorage (AbortController workaround)
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* ignore */ }
    }
  }
  return null;
};

// Direct fetch to Supabase REST API (bypasses AbortController issue)
async function supabaseRpc<T = any>(fnName: string, params: Record<string, any> = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RPC ${fnName} failed: ${err}`);
  }

  return res.json();
}

export interface PlatformKPIs {
  total_users: number;
  total_orgs: number;
  active_orgs_30d: number;
  total_pipeline_value: number;
  deals_won_30d: number;
  deals_won_value_30d: number;
  total_invoiced_30d: number;
  total_paid_30d: number;
  ai_tokens_used_30d: number;
  ai_tokens_allocated_30d: number;
  voice_minutes_30d: number;
  total_calls: number;
  total_customers: number;
  total_invoices: number;
  total_quotes: number;
  total_expenses: number;
  total_tasks: number;
  open_support_tickets: number;
  urgent_support_tickets: number;
  active_phone_numbers: number;
  new_users_7d: number;
  new_users_30d: number;
}

export interface UserGrowthPoint {
  period: string;
  new_users: number;
  cumulative_users: number;
}

export interface OrgBreakdown {
  industry_template: string;
  subscription_tier: string;
  org_count: number;
  total_members: number;
}

export interface ModuleUsage {
  module_name: string;
  record_count: number;
  active_orgs: number;
  avg_per_org: number;
}

export interface ApiUsageSummary {
  service_name: string;
  total_calls: number;
  error_count: number;
  avg_response_ms: number;
  total_cost_cents: number;
  error_rate: number;
  total_tokens: number;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any> | null;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  is_admin: boolean;
  admin_access_level: string;
  created_at: string;
}

export interface PriorityAlerts {
  high_priority: Array<{
    alert_type: string;
    entity_id: string;
    title: string;
    description: string;
    created_at: string;
  }>;
  medium_priority: Array<{
    alert_type: string;
    entity_id: string;
    title: string;
    description: string;
    created_at: string;
  }>;
}

export interface AdminTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  organization_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  source?: string;
  labels?: string[];
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id?: string;
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  organization_id?: string;
  user_email: string;
  user_name?: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  request_type?: 'account_deletion' | 'customer_data_deletion' | 'dsar_access';
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
}

// Phone Number Lifecycle Types
export interface PhoneOrphanEntry {
  phone_number_id: string;
  phone_number: string;
  phone_number_pretty: string;
  twilio_sid: string;
  retell_agent_id?: string;
  organization_id: string;
  monthly_cost_cents: number;
  provisioned_at: string;
  last_call_at: string | null;
  org_name: string;
  subscription_tier?: string;
  subscription_status?: string;
  canceled_at?: string;
  days_since_canceled?: number;
  last_login?: string;
  days_since_login?: number;
  agent_active?: boolean;
  agent_last_updated?: string;
  days_since_agent_update?: number;
  grace_period_ends_at?: string;
  days_remaining?: number;
  release_reason?: string;
}

export interface PhoneOrphanData {
  canceled_subscription: PhoneOrphanEntry[];
  inactive_org: PhoneOrphanEntry[];
  deactivated_agent: PhoneOrphanEntry[];
  grace_period: PhoneOrphanEntry[];
  summary: {
    total_active: number;
    total_pooled: number;
    total_released: number;
    total_grace_period: number;
    monthly_cost_active_cents: number;
    monthly_cost_pooled_cents: number;
  };
}

export interface PhoneAssignmentEvent {
  id: string;
  phone_number_id: string;
  phone_number: string;
  organization_id: string | null;
  org_name: string | null;
  event_type: string;
  reason: string | null;
  metadata: Record<string, any>;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface PhoneCostSummary {
  total_numbers: number;
  active_numbers: number;
  pooled_numbers: number;
  grace_period_numbers: number;
  released_numbers: number;
  monthly_cost_active_cents: number;
  monthly_cost_pooled_cents: number;
  monthly_cost_grace_cents: number;
  total_monthly_cost_cents: number;
  potential_savings_cents: number;
  cost_by_org: Array<{
    org_name: string;
    subscription_tier: string;
    number_count: number;
    monthly_cost_cents: number;
    last_call_at: string | null;
  }>;
}

interface AdminState {
  // Data
  kpis: PlatformKPIs | null;
  userGrowth: UserGrowthPoint[];
  orgBreakdown: OrgBreakdown[];
  moduleUsage: ModuleUsage[];
  apiUsage: ApiUsageSummary[];
  priorityAlerts: PriorityAlerts | null;
  aiAnalytics: any;
  voiceAnalytics: any;
  financialSummary: any;
  activityLog: ActivityLogEntry[];
  adminUsers: AdminUser[];
  allTickets: AdminTicket[];
  deletionRequests: DeletionRequest[];
  phoneLifecycle: PhoneOrphanData | null;
  phoneAssignmentHistory: PhoneAssignmentEvent[];
  phoneCostSummary: PhoneCostSummary | null;

  // UI State
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  lastRefreshed: Date | null;
  dateRangeDays: number;

  // Actions
  setDateRange: (days: number) => void;
  fetchKPIs: () => Promise<void>;
  fetchUserGrowth: (months?: number) => Promise<void>;
  fetchOrgBreakdown: () => Promise<void>;
  fetchModuleUsage: () => Promise<void>;
  fetchApiUsage: (days?: number) => Promise<void>;
  fetchPriorityAlerts: () => Promise<void>;
  fetchAIAnalytics: (days?: number) => Promise<void>;
  fetchVoiceAnalytics: (days?: number) => Promise<void>;
  fetchFinancialSummary: (days?: number) => Promise<void>;
  fetchActivityLog: (limit?: number, offset?: number, entityType?: string, action?: string) => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  fetchAllTickets: () => Promise<void>;
  fetchDeletionRequests: () => Promise<void>;
  updateDeletionRequest: (requestId: string, status: string, notes?: string) => Promise<void>;
  fetchPhoneLifecycle: () => Promise<void>;
  fetchPhoneAssignmentHistory: (phoneNumberId?: string) => Promise<void>;
  fetchPhoneCostSummary: () => Promise<void>;
  flagNumberForRelease: (phoneNumberId: string, reason: string, graceDays?: number) => Promise<void>;
  releaseNumber: (phoneNumberId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  poolNumber: (phoneNumberId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  reassignNumber: (phoneNumberId: string, targetOrgId: string) => Promise<{ success: boolean; error?: string }>;
  fetchAll: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  // Initial state
  kpis: null,
  userGrowth: [],
  orgBreakdown: [],
  moduleUsage: [],
  apiUsage: [],
  priorityAlerts: null,
  aiAnalytics: null,
  voiceAnalytics: null,
  financialSummary: null,
  activityLog: [],
  adminUsers: [],
  allTickets: [],
  deletionRequests: [],
  phoneLifecycle: null,
  phoneAssignmentHistory: [],
  phoneCostSummary: null,

  loading: {},
  errors: {},
  lastRefreshed: null,
  dateRangeDays: 30,

  setDateRange: (days) => set({ dateRangeDays: days }),

  fetchKPIs: async () => {
    set((s) => ({ loading: { ...s.loading, kpis: true }, errors: { ...s.errors, kpis: null } }));
    try {
      const data = await supabaseRpc<PlatformKPIs>('admin_get_platform_kpis');
      set((s) => ({ kpis: data, loading: { ...s.loading, kpis: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, kpis: false }, errors: { ...s.errors, kpis: e.message } }));
    }
  },

  fetchUserGrowth: async (months = 12) => {
    set((s) => ({ loading: { ...s.loading, userGrowth: true }, errors: { ...s.errors, userGrowth: null } }));
    try {
      const data = await supabaseRpc<UserGrowthPoint[]>('admin_get_user_growth', { p_months: months });
      set((s) => ({ userGrowth: data, loading: { ...s.loading, userGrowth: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, userGrowth: false }, errors: { ...s.errors, userGrowth: e.message } }));
    }
  },

  fetchOrgBreakdown: async () => {
    set((s) => ({ loading: { ...s.loading, orgBreakdown: true }, errors: { ...s.errors, orgBreakdown: null } }));
    try {
      const data = await supabaseRpc<OrgBreakdown[]>('admin_get_org_breakdown');
      set((s) => ({ orgBreakdown: data, loading: { ...s.loading, orgBreakdown: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, orgBreakdown: false }, errors: { ...s.errors, orgBreakdown: e.message } }));
    }
  },

  fetchModuleUsage: async () => {
    set((s) => ({ loading: { ...s.loading, moduleUsage: true }, errors: { ...s.errors, moduleUsage: null } }));
    try {
      const data = await supabaseRpc<ModuleUsage[]>('admin_get_module_usage');
      set((s) => ({ moduleUsage: data, loading: { ...s.loading, moduleUsage: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, moduleUsage: false }, errors: { ...s.errors, moduleUsage: e.message } }));
    }
  },

  fetchApiUsage: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, apiUsage: true }, errors: { ...s.errors, apiUsage: null } }));
    try {
      const data = await supabaseRpc<ApiUsageSummary[]>('admin_get_api_usage_summary', { p_days: days || get().dateRangeDays });
      set((s) => ({ apiUsage: data, loading: { ...s.loading, apiUsage: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, apiUsage: false }, errors: { ...s.errors, apiUsage: e.message } }));
    }
  },

  fetchPriorityAlerts: async () => {
    set((s) => ({ loading: { ...s.loading, alerts: true }, errors: { ...s.errors, alerts: null } }));
    try {
      const data = await supabaseRpc<PriorityAlerts>('admin_get_priority_alerts');
      set((s) => ({ priorityAlerts: data, loading: { ...s.loading, alerts: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, alerts: false }, errors: { ...s.errors, alerts: e.message } }));
    }
  },

  fetchAIAnalytics: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, ai: true }, errors: { ...s.errors, ai: null } }));
    try {
      const data = await supabaseRpc('admin_get_ai_analytics', { p_days: days || get().dateRangeDays });
      set((s) => ({ aiAnalytics: data, loading: { ...s.loading, ai: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, ai: false }, errors: { ...s.errors, ai: e.message } }));
    }
  },

  fetchVoiceAnalytics: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, voice: true }, errors: { ...s.errors, voice: null } }));
    try {
      const data = await supabaseRpc('admin_get_voice_analytics', { p_days: days || get().dateRangeDays });
      set((s) => ({ voiceAnalytics: data, loading: { ...s.loading, voice: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, voice: false }, errors: { ...s.errors, voice: e.message } }));
    }
  },

  fetchFinancialSummary: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, financial: true }, errors: { ...s.errors, financial: null } }));
    try {
      const data = await supabaseRpc('admin_get_financial_summary', { p_days: days || get().dateRangeDays });
      set((s) => ({ financialSummary: data, loading: { ...s.loading, financial: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, financial: false }, errors: { ...s.errors, financial: e.message } }));
    }
  },

  fetchActivityLog: async (limit = 50, offset = 0, entityType?: string, action?: string) => {
    set((s) => ({ loading: { ...s.loading, activityLog: true }, errors: { ...s.errors, activityLog: null } }));
    try {
      const params: Record<string, any> = { p_limit: limit, p_offset: offset };
      if (entityType) params.p_entity_type = entityType;
      if (action) params.p_action = action;
      const data = await supabaseRpc<ActivityLogEntry[]>('admin_get_activity_log', params);
      set((s) => ({ activityLog: data || [], loading: { ...s.loading, activityLog: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, activityLog: false }, errors: { ...s.errors, activityLog: e.message } }));
    }
  },

  fetchAdminUsers: async () => {
    set((s) => ({ loading: { ...s.loading, adminUsers: true }, errors: { ...s.errors, adminUsers: null } }));
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      // Direct query: join admin_settings + auth.users via admin_user_view or direct query
      const res = await fetch(`${supabaseUrl}/rest/v1/admin_settings?is_admin=eq.true&select=user_id,is_admin,admin_access_level,created_at`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch admin users');
      const adminSettings = await res.json();

      // Get user emails from users table
      const userIds = adminSettings.map((a: any) => a.user_id);
      if (userIds.length > 0) {
        const usersRes = await fetch(`${supabaseUrl}/rest/v1/users?id=in.(${userIds.join(',')})&select=id,email`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        });
        const usersData = usersRes.ok ? await usersRes.json() : [];
        const emailMap = Object.fromEntries(usersData.map((u: any) => [u.id, u.email]));

        const merged = adminSettings.map((a: any) => ({
          ...a,
          email: emailMap[a.user_id] || 'Unknown',
        }));
        set((s) => ({ adminUsers: merged, loading: { ...s.loading, adminUsers: false } }));
      } else {
        set((s) => ({ adminUsers: [], loading: { ...s.loading, adminUsers: false } }));
      }
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, adminUsers: false }, errors: { ...s.errors, adminUsers: e.message } }));
    }
  },

  fetchAllTickets: async () => {
    set((s) => ({ loading: { ...s.loading, tickets: true }, errors: { ...s.errors, tickets: null } }));
    try {
      const data = await supabaseRpc<AdminTicket[]>('admin_get_all_support_tickets');
      set((s) => ({ allTickets: data || [], loading: { ...s.loading, tickets: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, tickets: false }, errors: { ...s.errors, tickets: e.message } }));
    }
  },

  fetchDeletionRequests: async () => {
    set((s) => ({ loading: { ...s.loading, deletionRequests: true }, errors: { ...s.errors, deletionRequests: null } }));
    try {
      const data = await supabaseRpc<DeletionRequest[]>('admin_get_deletion_requests');
      set((s) => ({ deletionRequests: data || [], loading: { ...s.loading, deletionRequests: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, deletionRequests: false }, errors: { ...s.errors, deletionRequests: e.message } }));
    }
  },

  updateDeletionRequest: async (requestId: string, status: string, notes?: string) => {
    try {
      await supabaseRpc('admin_update_deletion_request', {
        p_request_id: requestId,
        p_status: status,
        p_notes: notes || null,
      });
      // Refresh the list
      await get().fetchDeletionRequests();
    } catch (e: any) {
      throw new Error(e.message || 'Failed to update deletion request');
    }
  },

  fetchPhoneLifecycle: async () => {
    set((s) => ({ loading: { ...s.loading, phoneLifecycle: true }, errors: { ...s.errors, phoneLifecycle: null } }));
    try {
      const data = await supabaseRpc<PhoneOrphanData>('admin_get_orphaned_phone_numbers');
      set((s) => ({ phoneLifecycle: data, loading: { ...s.loading, phoneLifecycle: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, phoneLifecycle: false }, errors: { ...s.errors, phoneLifecycle: e.message } }));
    }
  },

  fetchPhoneAssignmentHistory: async (phoneNumberId?: string) => {
    set((s) => ({ loading: { ...s.loading, phoneHistory: true }, errors: { ...s.errors, phoneHistory: null } }));
    try {
      const params: Record<string, any> = { p_limit: 100, p_offset: 0 };
      if (phoneNumberId) params.p_phone_number_id = phoneNumberId;
      const data = await supabaseRpc<PhoneAssignmentEvent[]>('admin_get_phone_assignment_history', params);
      set((s) => ({ phoneAssignmentHistory: data || [], loading: { ...s.loading, phoneHistory: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, phoneHistory: false }, errors: { ...s.errors, phoneHistory: e.message } }));
    }
  },

  fetchPhoneCostSummary: async () => {
    set((s) => ({ loading: { ...s.loading, phoneCost: true }, errors: { ...s.errors, phoneCost: null } }));
    try {
      const data = await supabaseRpc<PhoneCostSummary>('admin_get_phone_cost_summary');
      set((s) => ({ phoneCostSummary: data, loading: { ...s.loading, phoneCost: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, phoneCost: false }, errors: { ...s.errors, phoneCost: e.message } }));
    }
  },

  flagNumberForRelease: async (phoneNumberId: string, reason: string, graceDays?: number) => {
    try {
      await supabaseRpc('admin_flag_number_for_release', {
        p_phone_number_id: phoneNumberId,
        p_reason: reason,
        p_grace_days: graceDays || 30,
      });
      await get().fetchPhoneLifecycle();
      await get().fetchPhoneCostSummary();
    } catch (e: any) {
      throw new Error(e.message || 'Failed to flag number for release');
    }
  },

  releaseNumber: async (phoneNumberId: string, reason?: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-phone-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action: 'release_number', phoneNumberId, reason: reason || 'admin_manual' }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchPhoneLifecycle();
        await get().fetchPhoneCostSummary();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  poolNumber: async (phoneNumberId: string, reason?: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-phone-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action: 'pool_number', phoneNumberId, reason: reason || 'admin_manual' }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchPhoneLifecycle();
        await get().fetchPhoneCostSummary();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  reassignNumber: async (phoneNumberId: string, targetOrgId: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-phone-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action: 'reassign_number', phoneNumberId, targetOrganizationId: targetOrgId }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchPhoneLifecycle();
        await get().fetchPhoneCostSummary();
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  fetchAll: async () => {
    const state = get();
    await Promise.allSettled([
      state.fetchKPIs(),
      state.fetchUserGrowth(),
      state.fetchOrgBreakdown(),
      state.fetchModuleUsage(),
      state.fetchPriorityAlerts(),
    ]);
    set({ lastRefreshed: new Date() });
  },

  refreshAll: async () => {
    await get().fetchAll();
  },
}));
