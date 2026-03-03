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

export interface ApiErrorDetail {
  id: string;
  service_name: string;
  endpoint: string;
  method: string;
  status_code: number;
  error_message: string | null;
  response_time_ms: number;
  organization_id: string | null;
  organization_name: string | null;
  user_id: string | null;
  user_email: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
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

// Code Quality Report Types
export interface CodeQualityTestFile {
  file: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
}

export interface CodeQualityTests {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration_ms: number;
  success: boolean;
  files: CodeQualityTestFile[];
}

export interface CodeQualityTSDetail {
  file: string;
  line: number;
  code: string;
  message: string;
}

export interface CodeQualityTS {
  errors: number;
  files_with_errors: number;
  details: CodeQualityTSDetail[];
}

export interface CodeQualityLintDetail {
  file: string;
  errors: number;
  warnings: number;
  fixable: number;
}

export interface CodeQualityLint {
  errors: number;
  warnings: number;
  fixable: number;
  files_with_issues: number;
  details: CodeQualityLintDetail[];
}

export interface CodeQualityReport {
  generated_at: string;
  git_sha: string;
  git_branch: string;
  tests: CodeQualityTests;
  typescript: CodeQualityTS;
  lint: CodeQualityLint;
}

export interface NetlifyDeploy {
  id: string;
  state: 'ready' | 'building' | 'error' | 'enqueued';
  error_message: string | null;
  branch: string;
  commit_ref: string | null;
  commit_message: string;
  committer: string | null;
  deploy_time: number | null;
  created_at: string;
  published_at: string | null;
  deploy_url: string | null;
  context: string;
  review_id: string | null;
}

export interface NetlifyDeploySummary {
  total_deploys: number;
  successful: number;
  failed: number;
  success_rate: number;
  avg_build_time_seconds: number;
  deploys_last_30d: number;
  last_deploy: NetlifyDeploy | null;
}

export interface CodeQualityData {
  report: CodeQualityReport | null;
  deploys: NetlifyDeploy[];
  deploySummary: NetlifyDeploySummary | null;
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

// ─── Technology Evaluation Center Types ─────────────────────────────
export interface PerformanceTrend {
  bucket: string;
  service_name: string;
  total_calls: number;
  error_count: number;
  error_rate: number;
  avg_response_ms: number;
  p50_response_ms: number;
  p95_response_ms: number;
  p99_response_ms: number;
  total_cost_cents: number;
  total_tokens: number;
}

export interface CostForecast {
  by_service: Array<{
    service_name: string;
    actual_cost_cents: number;
    actual_calls: number;
    daily_cost_rate_cents: number;
    projected_30d_cents: number;
    daily_call_rate: number;
  }>;
  totals: {
    total_actual_cents: number;
    projected_30d_cents: number;
    total_calls: number;
    daily_call_rate: number;
  };
  period_days: number;
}

export interface CostPerTransaction {
  action_name: string;
  service_name: string;
  transaction_count: number;
  total_cost_cents: number;
  avg_cost_per_transaction_cents: number;
  avg_response_ms: number;
}

export interface FeatureFlag {
  id: string;
  flag_key: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_org_ids: string[];
  target_industry_templates: string[];
  target_subscription_tiers: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  metadata: Record<string, any>;
  is_expired: boolean;
  audit_count: number;
}

export interface FlagAuditEntry {
  id: string;
  action: string;
  changed_by: string | null;
  changed_by_email: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  created_at: string;
}

export interface SlaStatus {
  service_name: string;
  display_name: string;
  total_calls: number;
  error_count: number;
  actual_error_rate: number;
  actual_p95_ms: number;
  actual_cost_cents: number;
  sla_max_error_rate: number;
  sla_max_p95_ms: number;
  sla_max_monthly_cost: number | null;
  error_rate_ok: boolean;
  p95_ok: boolean;
  cost_ok: boolean;
  overall_ok: boolean;
  alert_on_violation: boolean;
}

export interface HealthCheckResult {
  service_name: string;
  status: 'up' | 'degraded' | 'down' | 'unknown';
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
  checks_last_24h: number;
  avg_response_24h: number | null;
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

// Reseller Partner types
export interface ResellerPartner {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  stripe_connected_account_id: string | null;
  stripe_onboarding_complete: boolean;
  default_commission_rate: number;
  status: 'pending' | 'active' | 'paused' | 'terminated';
  notes: string | null;
  created_at: string;
  updated_at: string;
  terminated_at: string | null;
  // Aggregated stats from RPC
  sourced_orgs_count?: number;
  total_earned_cents?: number;
  total_pending_cents?: number;
  total_paid_count?: number;
}

export interface ResellerSourcedOrg {
  id: string;
  reseller_id: string;
  organization_id: string;
  commission_rate: number;
  commission_type: 'one_time' | 'recurring' | 'hybrid';
  recurring_months_cap: number;
  recurring_months_paid: number;
  one_time_amount_cents: number | null;
  one_time_paid: boolean;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  notes: string | null;
  sourced_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  org_name?: string;
  org_status?: string;
  subscription_tier?: string;
  total_commission_paid_cents?: number;
  total_commission_pending_cents?: number;
}

export interface ResellerCommission {
  id: string;
  reseller_id: string;
  sourced_org_id: string;
  organization_id: string;
  commission_type: 'one_time_setup' | 'recurring_monthly';
  gross_amount_cents: number;
  commission_rate: number;
  commission_amount_cents: number;
  currency: string;
  stripe_transfer_id: string | null;
  stripe_invoice_id: string | null;
  period_start: string | null;
  period_end: string | null;
  recurring_month_number: number | null;
  status: 'pending' | 'approved' | 'paid' | 'failed' | 'cancelled';
  paid_at: string | null;
  failed_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  reseller_name?: string;
  reseller_company?: string;
  org_name?: string;
}

export interface ResellerSummary {
  total_partners: number;
  active_partners: number;
  total_commissions_paid_cents: number;
  total_commissions_pending_cents: number;
  total_sourced_orgs: number;
  commissions_this_month_cents: number;
}

interface AdminState {
  // Data
  kpis: PlatformKPIs | null;
  userGrowth: UserGrowthPoint[];
  orgBreakdown: OrgBreakdown[];
  moduleUsage: ModuleUsage[];
  apiUsage: ApiUsageSummary[];
  apiErrorDetails: ApiErrorDetail[];
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
  codeQuality: CodeQualityData;

  // Reseller Program
  resellerSummary: ResellerSummary | null;
  resellerPartners: ResellerPartner[];
  resellerSourcedOrgs: ResellerSourcedOrg[];
  resellerCommissions: ResellerCommission[];

  // Technology Evaluation Center
  performanceTrends: PerformanceTrend[];
  costForecast: CostForecast | null;
  costPerTransaction: CostPerTransaction[];
  featureFlags: FeatureFlag[];
  flagAudit: FlagAuditEntry[];
  slaStatus: SlaStatus[];
  healthChecks: HealthCheckResult[];

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
  fetchApiErrorDetails: (serviceName?: string, days?: number) => Promise<void>;
  fetchPriorityAlerts: () => Promise<void>;
  fetchAIAnalytics: (days?: number) => Promise<void>;
  fetchVoiceAnalytics: (days?: number) => Promise<void>;
  fetchFinancialSummary: (days?: number) => Promise<void>;
  fetchActivityLog: (limit?: number, offset?: number, entityType?: string, action?: string) => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  setAdminStatus: (userId: string, isAdmin: boolean, accessLevel?: string) => Promise<{ success: boolean; error?: string }>;
  searchUsersForAdmin: (search: string) => Promise<Array<{ user_id: string; email: string; full_name: string; is_admin: boolean; admin_access_level: string }>>;
  fetchAllTickets: () => Promise<void>;
  fetchTicketDetail: (ticketId: string) => Promise<void>;
  updateTicket: (ticketId: string, updates: { status?: string; priority?: string; category?: string; assigned_to?: string | null }, comment?: string) => Promise<void>;
  replyToTicket: (ticketId: string, message: string, isInternal?: boolean) => Promise<void>;
  updateOrgStatus: (orgId: string, status: string, reason: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateOrgIndustryTemplate: (orgId: string, templateId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
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
  fetchCodeQualityDeploys: () => Promise<void>;
  fetchCodeQualityReport: () => Promise<void>;
  // Technology Evaluation Center actions
  fetchPerformanceTrends: (days?: number, bucket?: string) => Promise<void>;
  fetchCostForecast: (days?: number) => Promise<void>;
  fetchCostPerTransaction: (days?: number) => Promise<void>;
  fetchFeatureFlags: () => Promise<void>;
  upsertFeatureFlag: (params: {
    flagKey: string; description?: string; isEnabled?: boolean;
    rolloutPercentage?: number; targetOrgIds?: string[];
    targetIndustryTemplates?: string[]; targetSubscriptionTiers?: string[];
    expiresAt?: string | null; metadata?: Record<string, any>;
  }) => Promise<{ success: boolean; error?: string }>;
  toggleFeatureFlag: (flagKey: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  fetchFlagAudit: (flagKey: string) => Promise<void>;
  fetchSlaStatus: (days?: number) => Promise<void>;
  runHealthCheck: () => Promise<void>;
  fetchHealthCheckStatus: () => Promise<void>;
  // Reseller Program actions
  fetchResellerSummary: () => Promise<void>;
  fetchResellerPartners: () => Promise<void>;
  fetchResellerSourcedOrgs: (resellerId: string) => Promise<void>;
  fetchResellerCommissions: (resellerId?: string) => Promise<void>;
  createResellerPartner: (partner: {
    name: string; email: string; company_name?: string; phone?: string;
    default_commission_rate?: number; notes?: string;
    stripe_connected_account_id?: string;
  }) => Promise<{ success: boolean; error?: string; data?: ResellerPartner }>;
  updateResellerPartner: (id: string, updates: Partial<ResellerPartner>) => Promise<{ success: boolean; error?: string }>;
  addSourcedOrg: (params: {
    reseller_id: string; organization_id: string; commission_rate?: number;
    commission_type?: string; recurring_months_cap?: number;
    one_time_amount_cents?: number; notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  createCommissionRecord: (params: {
    reseller_id: string; sourced_org_id: string; organization_id: string;
    commission_type: string; gross_amount_cents: number; commission_rate: number;
    commission_amount_cents: number; currency?: string; stripe_invoice_id?: string;
    period_start?: string; period_end?: string; recurring_month_number?: number;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateCommissionStatus: (commissionId: string, status: string, stripeTransferId?: string) => Promise<{ success: boolean; error?: string }>;
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
  apiErrorDetails: [],
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
  codeQuality: { report: null, deploys: [], deploySummary: null },
  resellerSummary: null,
  resellerPartners: [],
  resellerSourcedOrgs: [],
  resellerCommissions: [],
  performanceTrends: [],
  costForecast: null,
  costPerTransaction: [],
  featureFlags: [],
  flagAudit: [],
  slaStatus: [],
  healthChecks: [],

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

  fetchApiErrorDetails: async (serviceName?: string, days?: number) => {
    set((s) => ({ loading: { ...s.loading, apiErrorDetails: true }, errors: { ...s.errors, apiErrorDetails: null } }));
    try {
      const params: Record<string, any> = { p_days: days || get().dateRangeDays, p_limit: 50 };
      if (serviceName) params.p_service_name = serviceName;
      const data = await supabaseRpc<ApiErrorDetail[]>('admin_get_api_error_details', params);
      set((s) => ({ apiErrorDetails: data, loading: { ...s.loading, apiErrorDetails: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, apiErrorDetails: false }, errors: { ...s.errors, apiErrorDetails: e.message } }));
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

  setAdminStatus: async (userId: string, isAdmin: boolean, accessLevel = 'full') => {
    try {
      const data = await supabaseRpc<{ success: boolean }>('admin_set_admin_status', {
        p_user_id: userId,
        p_is_admin: isAdmin,
        p_access_level: accessLevel,
      });
      // Refresh admin list
      await get().fetchAdminUsers();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  searchUsersForAdmin: async (search: string) => {
    try {
      const data = await supabaseRpc<Array<{ user_id: string; email: string; full_name: string; is_admin: boolean; admin_access_level: string }>>('admin_search_users', { p_search: search });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
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

  updateTicket: async (ticketId: string, updates: { status?: string; priority?: string; category?: string; assigned_to?: string | null }, comment?: string) => {
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
      if (comment) params.p_comment = comment;

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

  updateOrgStatus: async (orgId: string, status: string, reason: string) => {
    try {
      const data = await supabaseRpc<{ success: boolean; message?: string }>('admin_update_org_status', {
        p_org_id: orgId,
        p_status: status,
        p_reason: reason,
      });
      // Refresh org detail to reflect new status
      await get().fetchOrgDetail(orgId);
      // Refresh priority alerts since merged/suspended orgs should disappear
      await get().fetchPriorityAlerts();
      return { success: true, message: data?.message || `Status changed to ${status}` };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  updateOrgIndustryTemplate: async (orgId: string, templateId: string) => {
    try {
      const data = await supabaseRpc<{ success: boolean; message?: string }>('admin_update_org_industry_template', {
        p_org_id: orgId,
        p_template: templateId,
      });
      await get().fetchOrgDetail(orgId);
      return { success: true, message: data?.message || `Template changed to ${templateId}` };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  fetchCodeQualityDeploys: async () => {
    set((s) => ({ loading: { ...s.loading, codeQualityDeploys: true }, errors: { ...s.errors, codeQualityDeploys: null } }));
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-code-quality`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      set((s) => ({
        codeQuality: {
          ...s.codeQuality,
          deploys: data.deploys || [],
          deploySummary: data.summary || null,
        },
        loading: { ...s.loading, codeQualityDeploys: false },
      }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, codeQualityDeploys: false },
        errors: { ...s.errors, codeQualityDeploys: e.message },
      }));
    }
  },

  fetchCodeQualityReport: async () => {
    set((s) => ({ loading: { ...s.loading, codeQualityReport: true }, errors: { ...s.errors, codeQualityReport: null } }));
    try {
      const res = await fetch('/code-quality-report.json');
      if (!res.ok) throw new Error(`Report not available (${res.status})`);
      const data = await res.json();
      set((s) => ({
        codeQuality: { ...s.codeQuality, report: data },
        loading: { ...s.loading, codeQualityReport: false },
      }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, codeQualityReport: false },
        errors: { ...s.errors, codeQualityReport: e.message },
      }));
    }
  },

  // ─── Technology Evaluation Center Actions ──────────────────────────

  fetchPerformanceTrends: async (days?: number, bucket = 'day') => {
    set((s) => ({ loading: { ...s.loading, performanceTrends: true }, errors: { ...s.errors, performanceTrends: null } }));
    try {
      const data = await supabaseRpc<PerformanceTrend[]>('admin_get_api_performance_trends', {
        p_days: days || get().dateRangeDays,
        p_bucket: bucket,
      });
      set((s) => ({ performanceTrends: data || [], loading: { ...s.loading, performanceTrends: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, performanceTrends: false }, errors: { ...s.errors, performanceTrends: e.message } }));
    }
  },

  fetchCostForecast: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, costForecast: true }, errors: { ...s.errors, costForecast: null } }));
    try {
      const data = await supabaseRpc<CostForecast>('admin_get_cost_forecast', {
        p_days: days || get().dateRangeDays,
      });
      set((s) => ({ costForecast: data || null, loading: { ...s.loading, costForecast: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, costForecast: false }, errors: { ...s.errors, costForecast: e.message } }));
    }
  },

  fetchCostPerTransaction: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, costPerTransaction: true }, errors: { ...s.errors, costPerTransaction: null } }));
    try {
      const data = await supabaseRpc<CostPerTransaction[]>('admin_get_cost_per_transaction', {
        p_days: days || get().dateRangeDays,
      });
      set((s) => ({ costPerTransaction: data || [], loading: { ...s.loading, costPerTransaction: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, costPerTransaction: false }, errors: { ...s.errors, costPerTransaction: e.message } }));
    }
  },

  fetchFeatureFlags: async () => {
    set((s) => ({ loading: { ...s.loading, featureFlags: true }, errors: { ...s.errors, featureFlags: null } }));
    try {
      const data = await supabaseRpc<FeatureFlag[]>('admin_list_feature_flags');
      set((s) => ({ featureFlags: data || [], loading: { ...s.loading, featureFlags: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, featureFlags: false }, errors: { ...s.errors, featureFlags: e.message } }));
    }
  },

  upsertFeatureFlag: async (params) => {
    try {
      await supabaseRpc('admin_upsert_feature_flag', {
        p_flag_key: params.flagKey,
        p_description: params.description ?? null,
        p_is_enabled: params.isEnabled ?? false,
        p_rollout_percentage: params.rolloutPercentage ?? 100,
        p_target_org_ids: params.targetOrgIds ?? [],
        p_target_industry_templates: params.targetIndustryTemplates ?? [],
        p_target_subscription_tiers: params.targetSubscriptionTiers ?? [],
        p_expires_at: params.expiresAt ?? null,
        p_metadata: params.metadata ?? {},
      });
      await get().fetchFeatureFlags();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  toggleFeatureFlag: async (flagKey, enabled) => {
    try {
      await supabaseRpc('admin_toggle_feature_flag', {
        p_flag_key: flagKey,
        p_enabled: enabled,
      });
      // Optimistic update
      set((s) => ({
        featureFlags: s.featureFlags.map((f) =>
          f.flag_key === flagKey ? { ...f, is_enabled: enabled, updated_at: new Date().toISOString() } : f
        ),
      }));
      return { success: true };
    } catch (e: any) {
      // Revert optimistic update
      await get().fetchFeatureFlags();
      return { success: false, error: e.message };
    }
  },

  fetchFlagAudit: async (flagKey) => {
    set((s) => ({ loading: { ...s.loading, flagAudit: true }, errors: { ...s.errors, flagAudit: null } }));
    try {
      const data = await supabaseRpc<FlagAuditEntry[]>('admin_get_flag_audit', {
        p_flag_key: flagKey,
        p_limit: 50,
      });
      set((s) => ({ flagAudit: data || [], loading: { ...s.loading, flagAudit: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, flagAudit: false }, errors: { ...s.errors, flagAudit: e.message } }));
    }
  },

  fetchSlaStatus: async (days?: number) => {
    set((s) => ({ loading: { ...s.loading, slaStatus: true }, errors: { ...s.errors, slaStatus: null } }));
    try {
      const data = await supabaseRpc<SlaStatus[]>('admin_get_sla_status', {
        p_days: days || get().dateRangeDays,
      });
      set((s) => ({ slaStatus: data || [], loading: { ...s.loading, slaStatus: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, slaStatus: false }, errors: { ...s.errors, slaStatus: e.message } }));
    }
  },

  runHealthCheck: async () => {
    set((s) => ({ loading: { ...s.loading, healthChecks: true }, errors: { ...s.errors, healthChecks: null } }));
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-health-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Health check failed (${res.status})`);
      }
      const data = await res.json();
      set((s) => ({
        healthChecks: data.results || [],
        loading: { ...s.loading, healthChecks: false },
      }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, healthChecks: false }, errors: { ...s.errors, healthChecks: e.message } }));
    }
  },

  fetchHealthCheckStatus: async () => {
    set((s) => ({ loading: { ...s.loading, healthChecks: true }, errors: { ...s.errors, healthChecks: null } }));
    try {
      const data = await supabaseRpc<HealthCheckResult[]>('admin_get_health_check_status');
      set((s) => ({ healthChecks: data || [], loading: { ...s.loading, healthChecks: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, healthChecks: false }, errors: { ...s.errors, healthChecks: e.message } }));
    }
  },

  // ── Reseller Program ──────────────────────────────────────────

  fetchResellerSummary: async () => {
    set((s) => ({ loading: { ...s.loading, resellerSummary: true }, errors: { ...s.errors, resellerSummary: null } }));
    try {
      const data = await supabaseRpc<ResellerSummary>('admin_get_reseller_summary');
      set((s) => ({ resellerSummary: data, loading: { ...s.loading, resellerSummary: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, resellerSummary: false }, errors: { ...s.errors, resellerSummary: e.message } }));
    }
  },

  fetchResellerPartners: async () => {
    set((s) => ({ loading: { ...s.loading, resellerPartners: true }, errors: { ...s.errors, resellerPartners: null } }));
    try {
      const data = await supabaseRpc<ResellerPartner[]>('admin_get_reseller_partners');
      set((s) => ({ resellerPartners: data || [], loading: { ...s.loading, resellerPartners: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, resellerPartners: false }, errors: { ...s.errors, resellerPartners: e.message } }));
    }
  },

  fetchResellerSourcedOrgs: async (resellerId: string) => {
    set((s) => ({ loading: { ...s.loading, resellerSourcedOrgs: true }, errors: { ...s.errors, resellerSourcedOrgs: null } }));
    try {
      const data = await supabaseRpc<ResellerSourcedOrg[]>('admin_get_reseller_sourced_orgs', { p_reseller_id: resellerId });
      set((s) => ({ resellerSourcedOrgs: data || [], loading: { ...s.loading, resellerSourcedOrgs: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, resellerSourcedOrgs: false }, errors: { ...s.errors, resellerSourcedOrgs: e.message } }));
    }
  },

  fetchResellerCommissions: async (resellerId?: string) => {
    set((s) => ({ loading: { ...s.loading, resellerCommissions: true }, errors: { ...s.errors, resellerCommissions: null } }));
    try {
      const params: Record<string, any> = { p_limit: 100 };
      if (resellerId) params.p_reseller_id = resellerId;
      const data = await supabaseRpc<ResellerCommission[]>('admin_get_reseller_commissions', params);
      set((s) => ({ resellerCommissions: data || [], loading: { ...s.loading, resellerCommissions: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, resellerCommissions: false }, errors: { ...s.errors, resellerCommissions: e.message } }));
    }
  },

  createResellerPartner: async (partner) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/reseller_partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(partner),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      const [data] = await res.json();
      await get().fetchResellerPartners();
      await get().fetchResellerSummary();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  updateResellerPartner: async (id, updates) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/reseller_partners?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      await get().fetchResellerPartners();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  addSourcedOrg: async (params) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/reseller_sourced_orgs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      await get().fetchResellerPartners();
      await get().fetchResellerSummary();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  createCommissionRecord: async (params) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/reseller_commissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      await get().fetchResellerCommissions();
      await get().fetchResellerSummary();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  updateCommissionStatus: async (commissionId, status, stripeTransferId?) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const body: Record<string, any> = { status };
      if (stripeTransferId) body.stripe_transfer_id = stripeTransferId;
      if (status === 'paid') body.paid_at = new Date().toISOString();

      const res = await fetch(`${supabaseUrl}/rest/v1/reseller_commissions?id=eq.${commissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      await get().fetchResellerCommissions();
      await get().fetchResellerSummary();
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
