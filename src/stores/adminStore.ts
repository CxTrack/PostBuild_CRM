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

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar?: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  message: string | null;
  created_at: string;
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
  currentTicketMessages: TicketMessage[];
  currentTicketActivities: TicketActivity[];
  deletionRequests: DeletionRequest[];
  phoneLifecycle: PhoneOrphanData | null;
  phoneAssignmentHistory: PhoneAssignmentEvent[];
  phoneCostSummary: PhoneCostSummary | null;
  smsConsentList: any[];
  smsAuditLog: any[];
  smsUsageData: any;
  adminNotifications: any[];
  marketingSubscriptions: any[];
  orgDetail: any | null;
  usageOverview: any | null;
  allOrgsSummary: any[];

  // UI State
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  lastRefreshed: Date | null;
  dateRangeDays: number;
  activeTab: string;
  selectedOrgId: string | null;
  selectedOrgContext: { title: string; alertType: string } | null;

  // Actions
  setActiveTab: (tab: string) => void;
  setSelectedOrg: (orgId: string | null, context?: { title: string; alertType: string }) => void;
  fetchOrgDetail: (orgId: string) => Promise<void>;
  sendAdminNotification: (userIds: string[], title: string, message: string) => Promise<void>;
  sendAdminEmail: (toEmail: string, subject: string, bodyHtml: string, bodyText: string, orgId?: string, userId?: string) => Promise<any>;
  sendAdminSms: (toPhone: string, body: string, orgId?: string, userId?: string) => Promise<any>;
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
  fetchTicketDetail: (ticketId: string) => Promise<void>;
  updateTicket: (ticketId: string, updates: { status?: string; priority?: string; category?: string; assigned_to?: string | null }) => Promise<void>;
  replyToTicket: (ticketId: string, message: string, isInternal?: boolean) => Promise<void>;
  fetchDeletionRequests: () => Promise<void>;
  updateDeletionRequest: (requestId: string, status: string, notes?: string) => Promise<void>;
  fetchPhoneLifecycle: () => Promise<void>;
  fetchPhoneAssignmentHistory: (phoneNumberId?: string) => Promise<void>;
  fetchPhoneCostSummary: () => Promise<void>;
  flagNumberForRelease: (phoneNumberId: string, reason: string, graceDays?: number) => Promise<void>;
  releaseNumber: (phoneNumberId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  poolNumber: (phoneNumberId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  reassignNumber: (phoneNumberId: string, targetOrgId: string) => Promise<{ success: boolean; error?: string }>;
  fetchSmsUsageData: () => Promise<void>;
  fetchSmsConsentList: () => Promise<void>;
  fetchSmsAuditLog: (consentId: string) => Promise<void>;
  adminReenableSms: (consentId: string) => Promise<void>;
  adminDenySmsReopt: (consentId: string) => Promise<void>;
  fetchAdminNotifications: (type?: string) => Promise<void>;
  markAdminNotificationRead: (id: string) => Promise<void>;
  fetchUsageOverview: (days?: number) => Promise<void>;
  fetchMarketingSubscriptions: () => Promise<void>;
  deactivateOrganization: (params: {
    organizationId: string;
    reason: string;
    cancelSubscription: boolean;
    refundLastInvoice: boolean;
    refundAmountCents?: number | null;
    releasePhoneNumbers: boolean;
    sendNotificationEmail: boolean;
  }) => Promise<{ success: boolean; actions?: any; errors?: string[]; error?: string }>;
  fetchAllOrgsSummary: () => Promise<void>;
  moveUserToOrg: (userId: string, fromOrgId: string, toOrgId: string, newRole?: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteEmptyOrg: (orgId: string) => Promise<{ success: boolean; error?: string }>;
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
  currentTicketMessages: [],
  currentTicketActivities: [],
  deletionRequests: [],
  phoneLifecycle: null,
  phoneAssignmentHistory: [],
  phoneCostSummary: null,
  smsConsentList: [],
  smsAuditLog: [],
  smsUsageData: null,
  adminNotifications: [],
  marketingSubscriptions: [],
  orgDetail: null,
  usageOverview: null,
  allOrgsSummary: [],

  loading: {},
  errors: {},
  lastRefreshed: null,
  dateRangeDays: 30,
  activeTab: 'command-center',
  selectedOrgId: null,
  selectedOrgContext: null,

  setActiveTab: (tab) => set({ activeTab: tab, selectedOrgId: null, selectedOrgContext: null }),
  setSelectedOrg: (orgId, context) => set({ selectedOrgId: orgId, selectedOrgContext: context || null }),

  fetchOrgDetail: async (orgId: string) => {
    set((s) => ({ loading: { ...s.loading, orgDetail: true }, errors: { ...s.errors, orgDetail: null } }));
    try {
      const data = await supabaseRpc('admin_get_org_detail', { p_org_id: orgId });
      set((s) => ({ orgDetail: data, loading: { ...s.loading, orgDetail: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, orgDetail: false }, errors: { ...s.errors, orgDetail: e.message } }));
    }
  },

  sendAdminNotification: async (userIds: string[], title: string, message: string) => {
    await supabaseRpc('admin_send_notification', {
      p_user_ids: userIds,
      p_title: title,
      p_message: message,
      p_type: 'admin_notification',
    });
  },

  sendAdminEmail: async (toEmail: string, subject: string, bodyHtml: string, bodyText: string, orgId?: string, userId?: string) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ to_email: toEmail, subject, body_html: bodyHtml, body_text: bodyText, organization_id: orgId, target_user_id: userId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to send email');
    return data;
  },

  sendAdminSms: async (toPhone: string, body: string, orgId?: string, userId?: string) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ to_phone: toPhone, body, organization_id: orgId, target_user_id: userId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to send SMS');
    return data;
  },

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
      const data = await supabaseRpc('admin_get_admin_users');
      set((s) => ({ adminUsers: Array.isArray(data) ? data : [], loading: { ...s.loading, adminUsers: false } }));
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

  fetchTicketDetail: async (ticketId: string) => {
    set((s) => ({ loading: { ...s.loading, ticketDetail: true }, errors: { ...s.errors, ticketDetail: null } }));
    try {
      const data = await supabaseRpc<{ ticket: AdminTicket; messages: TicketMessage[]; activities: TicketActivity[] }>('admin_get_ticket_detail', { p_ticket_id: ticketId });
      set((s) => ({
        currentTicketMessages: data.messages || [],
        currentTicketActivities: data.activities || [],
        loading: { ...s.loading, ticketDetail: false },
      }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, ticketDetail: false }, errors: { ...s.errors, ticketDetail: e.message } }));
    }
  },

  updateTicket: async (ticketId: string, updates: { status?: string; priority?: string; category?: string; assigned_to?: string | null }) => {
    try {
      const params: Record<string, any> = { p_ticket_id: ticketId };
      if (updates.status) params.p_status = updates.status;
      if (updates.priority) params.p_priority = updates.priority;
      if (updates.category) params.p_category = updates.category;
      if (updates.assigned_to === null) {
        params.p_clear_assigned = true;
      } else if (updates.assigned_to) {
        params.p_assigned_to = updates.assigned_to;
      }

      const updatedTicket = await supabaseRpc<AdminTicket>('admin_update_ticket', params);

      // Update the ticket in allTickets list
      set((s) => ({
        allTickets: s.allTickets.map((t) => (t.id === ticketId ? { ...t, ...updatedTicket } : t)),
      }));

      // Refresh activities
      await get().fetchTicketDetail(ticketId);
    } catch (e: any) {
      throw e;
    }
  },

  replyToTicket: async (ticketId: string, message: string, isInternal: boolean = false) => {
    try {
      const newMsg = await supabaseRpc<TicketMessage>('admin_reply_ticket', {
        p_ticket_id: ticketId,
        p_message: message,
        p_is_internal: isInternal,
      });

      // Append new message to current list
      set((s) => ({
        currentTicketMessages: [...s.currentTicketMessages, newMsg],
      }));

      // Refresh activities (auto-status change may have happened) and ticket list
      await get().fetchTicketDetail(ticketId);
      await get().fetchAllTickets();
    } catch (e: any) {
      throw e;
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

  fetchSmsUsageData: async () => {
    set((s) => ({ loading: { ...s.loading, smsUsage: true }, errors: { ...s.errors, smsUsage: null } }));
    try {
      const data = await supabaseRpc('admin_get_sms_usage');
      set((s) => ({ smsUsageData: data, loading: { ...s.loading, smsUsage: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, smsUsage: false }, errors: { ...s.errors, smsUsage: e.message } }));
    }
  },

  fetchSmsConsentList: async () => {
    const token = getAuthToken();
    if (!token) return;
    set((s) => ({ loading: { ...s.loading, smsConsent: true }, errors: { ...s.errors, smsConsent: null } }));
    try {
      // Join sms_consent with customer and org names via RPC or direct query
      const res = await fetch(
        `${supabaseUrl}/rest/v1/sms_consent?select=*,customers(first_name,last_name,email),organizations(name)&status=neq.opted_in&order=updated_at.desc&limit=200`,
        { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } }
      );
      const raw = res.ok ? await res.json() : [];
      const mapped = raw.map((r: any) => ({
        ...r,
        customer_name: [r.customers?.first_name, r.customers?.last_name].filter(Boolean).join(' ') || 'Unknown',
        customer_email: r.customers?.email || '',
        organization_name: r.organizations?.name || 'Unknown',
      }));
      set((s) => ({ smsConsentList: mapped, loading: { ...s.loading, smsConsent: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, smsConsent: false }, errors: { ...s.errors, smsConsent: e.message } }));
    }
  },

  fetchSmsAuditLog: async (consentId: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/sms_consent_audit_log?sms_consent_id=eq.${consentId}&order=created_at.desc`,
        { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } }
      );
      const data = res.ok ? await res.json() : [];
      set((s) => ({ smsAuditLog: data }));
    } catch { /* ignore */ }
  },

  adminReenableSms: async (consentId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    // Get current user
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    });
    const userData = userRes.ok ? await userRes.json() : {};

    const res = await fetch(`${supabaseUrl}/rest/v1/sms_consent?id=eq.${consentId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status: 'opted_in',
        admin_reenabled_by: userData.id || null,
        admin_reenabled_at: now,
        reopt_token: null,
        updated_at: now,
      }),
    });

    if (!res.ok) throw new Error('Failed to re-enable SMS');

    // Audit log
    await fetch(`${supabaseUrl}/rest/v1/sms_consent_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sms_consent_id: consentId,
        action: 'admin_reenabled',
        performed_by: userData.id || 'admin',
        metadata: { admin_email: userData.email },
      }),
    });

    await get().fetchSmsConsentList();
  },

  adminDenySmsReopt: async (consentId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    });
    const userData = userRes.ok ? await userRes.json() : {};

    const res = await fetch(`${supabaseUrl}/rest/v1/sms_consent?id=eq.${consentId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status: 'opted_out',
        reopt_token: null,
        reopt_completed_at: null,
        updated_at: now,
      }),
    });

    if (!res.ok) throw new Error('Failed to deny re-opt-in');

    // Audit log
    await fetch(`${supabaseUrl}/rest/v1/sms_consent_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sms_consent_id: consentId,
        action: 'admin_denied',
        performed_by: userData.id || 'admin',
        metadata: { admin_email: userData.email },
      }),
    });

    await get().fetchSmsConsentList();
  },

  fetchAdminNotifications: async (type?: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      let url = `${supabaseUrl}/rest/v1/admin_notifications?order=created_at.desc&limit=100`;
      if (type) url += `&type=eq.${type}`;
      const res = await fetch(url, {
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      set((s) => ({ adminNotifications: data }));
    } catch { /* ignore */ }
  },

  markAdminNotificationRead: async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    await fetch(`${supabaseUrl}/rest/v1/admin_notifications?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ is_read: true }),
    });
    set((s) => ({
      adminNotifications: s.adminNotifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
    }));
  },

  fetchUsageOverview: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, usageOverview: true }, errors: { ...s.errors, usageOverview: null } }));
    try {
      const data = await supabaseRpc('admin_get_usage_overview', { p_days: days || get().dateRangeDays });
      set((s) => ({ usageOverview: data, loading: { ...s.loading, usageOverview: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, usageOverview: false }, errors: { ...s.errors, usageOverview: e.message } }));
    }
  },

  fetchMarketingSubscriptions: async () => {
    const token = getAuthToken();
    if (!token) return;
    set((s) => ({ loading: { ...s.loading, marketingSubs: true } }));
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/marketing_email_subscriptions?order=created_at.desc&limit=500`,
        { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } }
      );
      const data = res.ok ? await res.json() : [];
      set((s) => ({ marketingSubscriptions: data, loading: { ...s.loading, marketingSubs: false } }));
    } catch {
      set((s) => ({ loading: { ...s.loading, marketingSubs: false } }));
    }
  },

  deactivateOrganization: async (params) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-deactivate-org`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh org detail to reflect deactivated state
        await get().fetchOrgDetail(params.organizationId);
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  fetchAllOrgsSummary: async () => {
    set((s) => ({ loading: { ...s.loading, allOrgs: true } }));
    try {
      const data = await supabaseRpc('admin_list_orgs_summary');
      set((s) => ({ allOrgsSummary: Array.isArray(data) ? data : [], loading: { ...s.loading, allOrgs: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, allOrgs: false }, errors: { ...s.errors, allOrgs: e.message } }));
    }
  },

  moveUserToOrg: async (userId: string, fromOrgId: string, toOrgId: string, newRole = 'member') => {
    try {
      const data = await supabaseRpc('admin_move_user_to_org', {
        p_user_id: userId,
        p_from_org_id: fromOrgId,
        p_to_org_id: toOrgId,
        p_new_role: newRole,
      });
      // Refresh org detail after move
      await get().fetchOrgDetail(fromOrgId);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  deleteEmptyOrg: async (orgId: string) => {
    try {
      await supabaseRpc('admin_delete_empty_org', { p_org_id: orgId });
      return { success: true };
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
