import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Building2, Users, Mail, Phone, Globe, MapPin,
  Brain, PhoneCall, FileText, UserCheck, Activity, Layers,
  MessageSquare, Send, Bell, Clock, Shield, Crown, Loader2, X,
  AlertCircle, Calendar, Zap, ArrowUpDown, Trash2, ShieldOff,
  CheckCircle2, AlertTriangle, PlayCircle, ArrowDownLeft, ArrowUpRight,
  ChevronLeft, ChevronRight, Search, Eye
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

/* ─── Auth + RPC Helpers ─── */

const getAuthToken = (): string | null => {
  try {
    const ref = (supabaseUrl || '').split('//')[1]?.split('.')[0];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch { return null; }
};

const callAdminRpc = async (fnName: string, params: Record<string, any> = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`RPC ${fnName} failed (${res.status})`);
  return res.json();
};

const INDUSTRY_LABELS: Record<string, string> = {
  tax_accounting: 'Tax & Accounting',
  distribution_logistics: 'Distribution & Logistics',
  gyms_fitness: 'Gyms & Fitness',
  contractors_home_services: 'Contractors & Home Services',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  legal_services: 'Legal Services',
  general_business: 'General Business',
  agency: 'Agency',
  mortgage_broker: 'Mortgage Broker',
  construction: 'Construction',
};

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  elite: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  enterprise: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  manager: UserCheck,
  member: Users,
  viewer: Users,
};

type CommMode = 'notification' | 'email' | 'sms' | null;

const formatDate = (d: string | null | undefined) => {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (d: string | null | undefined) => {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const daysAgo = (d: string | null | undefined) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
};

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatCurrency = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
};

const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const sentimentColor = (s: string | null | undefined) => {
  if (!s) return 'text-gray-400';
  const l = s.toLowerCase();
  if (l === 'positive') return 'text-green-500';
  if (l === 'negative') return 'text-red-500';
  return 'text-yellow-500';
};

const smsStatusBadge = (status: string | null | undefined) => {
  if (!status) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  const s = status.toLowerCase();
  if (s === 'delivered') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (s === 'sent') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (s === 'failed' || s === 'undelivered') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (s === 'queued') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
};

export const OrgDetailView = () => {
  const {
    selectedOrgId, selectedOrgContext, setSelectedOrg, setActiveTab,
    orgDetail, loading, errors, fetchOrgDetail,
    sendAdminNotification, sendAdminEmail, sendAdminSms,
    deactivateOrganization
  } = useAdminStore();

  const [commMode, setCommMode] = useState<CommMode>(null);
  const [commSubject, setCommSubject] = useState('');
  const [commBody, setCommBody] = useState('');
  const [commSending, setCommSending] = useState(false);
  const [commResult, setCommResult] = useState<{ success: boolean; message: string } | null>(null);

  // Deactivation modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateStep, setDeactivateStep] = useState<1 | 2>(1);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateOptions, setDeactivateOptions] = useState({
    cancelSubscription: true,
    releasePhoneNumbers: true,
    sendNotificationEmail: true,
    refundLastInvoice: false,
  });
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [confirmOrgName, setConfirmOrgName] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateResult, setDeactivateResult] = useState<{ success: boolean; message: string; actions?: any } | null>(null);

  // Call History state
  const [orgCalls, setOrgCalls] = useState<any[]>([]);
  const [orgCallsTotal, setOrgCallsTotal] = useState(0);
  const [orgCallsPage, setOrgCallsPage] = useState(0);
  const [orgCallsLoading, setOrgCallsLoading] = useState(false);
  const [selectedOrgCall, setSelectedOrgCall] = useState<any>(null);
  const [orgCallDetailLoading, setOrgCallDetailLoading] = useState(false);
  const CALLS_PER_PAGE = 10;

  // SMS History state
  const [orgSms, setOrgSms] = useState<any[]>([]);
  const [orgSmsTotal, setOrgSmsTotal] = useState(0);
  const [orgSmsPage, setOrgSmsPage] = useState(0);
  const [orgSmsLoading, setOrgSmsLoading] = useState(false);
  const [selectedSms, setSelectedSms] = useState<any>(null);
  const SMS_PER_PAGE = 10;

  const fetchOrgCalls = useCallback(async (page = 0) => {
    if (!selectedOrgId) return;
    setOrgCallsLoading(true);
    try {
      const data = await callAdminRpc('admin_get_calls_list', {
        p_limit: CALLS_PER_PAGE,
        p_offset: page * CALLS_PER_PAGE,
        p_org_id: selectedOrgId,
        p_days: 365,
      });
      setOrgCalls(data?.calls || data?.items || []);
      setOrgCallsTotal(data?.total_count || data?.total || 0);
      setOrgCallsPage(page);
    } catch (e) {
      console.error('Failed to fetch org calls:', e);
    } finally {
      setOrgCallsLoading(false);
    }
  }, [selectedOrgId]);

  const fetchOrgCallDetail = useCallback(async (callId: string) => {
    setOrgCallDetailLoading(true);
    try {
      const data = await callAdminRpc('admin_get_call_detail', { p_call_id: callId });
      setSelectedOrgCall(data);
    } catch (e) {
      console.error('Failed to fetch call detail:', e);
    } finally {
      setOrgCallDetailLoading(false);
    }
  }, []);

  const fetchOrgSms = useCallback(async (page = 0) => {
    if (!selectedOrgId) return;
    setOrgSmsLoading(true);
    try {
      const data = await callAdminRpc('admin_get_org_sms_list', {
        p_org_id: selectedOrgId,
        p_limit: SMS_PER_PAGE,
        p_offset: page * SMS_PER_PAGE,
        p_days: 365,
      });
      setOrgSms(data?.items || []);
      setOrgSmsTotal(data?.total || 0);
      setOrgSmsPage(page);
    } catch (e) {
      console.error('Failed to fetch org SMS:', e);
    } finally {
      setOrgSmsLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchOrgDetail(selectedOrgId);
      fetchOrgCalls(0);
      fetchOrgSms(0);
    }
  }, [selectedOrgId]);

  if (!selectedOrgId) return null;

  const org = orgDetail?.organization;
  const owner = orgDetail?.owner;
  const members = orgDetail?.members || [];
  const stats = orgDetail?.stats;
  const subscription = orgDetail?.subscription;
  const recentActivity = orgDetail?.recent_activity || [];
  const commsHistory = orgDetail?.comms_history || [];
  const isLoading = loading.orgDetail;

  const ownerEmail = owner?.email || org?.business_email || '';
  const ownerPhone = org?.business_phone || '';
  const ownerName = owner?.full_name || 'Unknown';

  const handleSendComm = async () => {
    if (!commBody.trim()) return;
    setCommSending(true);
    setCommResult(null);

    try {
      if (commMode === 'notification' && owner?.user_id) {
        await sendAdminNotification(
          [owner.user_id],
          commSubject || 'Message from CxTrack Admin',
          commBody
        );
        setCommResult({ success: true, message: 'In-app notification sent successfully.' });
      } else if (commMode === 'email' && ownerEmail) {
        const htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">${commSubject || 'Message from CxTrack'}</h2>
          <p style="color: #4B5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${commBody}</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="color: #9CA3AF; font-size: 11px;">Powered by CxTrack | Ontario, Canada</p>
        </div>`;
        await sendAdminEmail(
          ownerEmail,
          commSubject || 'Message from CxTrack',
          htmlBody,
          commBody,
          selectedOrgId || undefined,
          owner?.user_id || undefined
        );
        setCommResult({ success: true, message: `Email sent to ${ownerEmail}.` });
      } else if (commMode === 'sms' && ownerPhone) {
        await sendAdminSms(
          ownerPhone,
          commBody,
          selectedOrgId || undefined,
          owner?.user_id || undefined
        );
        setCommResult({ success: true, message: `SMS sent to ${ownerPhone}.` });
      }
    } catch (e: any) {
      setCommResult({ success: false, message: e.message || 'Failed to send.' });
    } finally {
      setCommSending(false);
    }
  };

  const closeCommModal = () => {
    setCommMode(null);
    setCommSubject('');
    setCommBody('');
    setCommResult(null);
  };

  const isDeactivated = !!org?.deactivated_at;

  const openDeactivateModal = () => {
    setShowDeactivateModal(true);
    setDeactivateStep(1);
    setDeactivateReason('');
    setConfirmOrgName('');
    setDeactivating(false);
    setDeactivateResult(null);
    setDeactivateOptions({
      cancelSubscription: true,
      releasePhoneNumbers: true,
      sendNotificationEmail: true,
      refundLastInvoice: false,
    });
    setRefundType('full');
    setRefundAmount('');
  };

  const handleDeactivate = async () => {
    if (!selectedOrgId) return;
    setDeactivating(true);
    try {
      const result = await deactivateOrganization({
        organizationId: selectedOrgId,
        reason: deactivateReason.trim(),
        cancelSubscription: deactivateOptions.cancelSubscription,
        refundLastInvoice: deactivateOptions.refundLastInvoice,
        refundAmountCents: deactivateOptions.refundLastInvoice && refundType === 'partial' && refundAmount
          ? Math.round(parseFloat(refundAmount) * 100)
          : null,
        releasePhoneNumbers: deactivateOptions.releasePhoneNumbers,
        sendNotificationEmail: deactivateOptions.sendNotificationEmail,
      });
      if (result.success) {
        setDeactivateResult({
          success: true,
          message: result.message || 'Organization deactivated successfully.',
          actions: result.actions,
        });
      } else {
        setDeactivateResult({
          success: false,
          message: result.error || 'Failed to deactivate organization.',
        });
      }
    } catch (e: any) {
      setDeactivateResult({
        success: false,
        message: e.message || 'An unexpected error occurred.',
      });
    } finally {
      setDeactivating(false);
    }
  };

  // Loading state
  if (isLoading && !orgDetail) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedOrg(null)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </button>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  // Error state
  if (errors.orgDetail) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedOrg(null)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </button>
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 dark:text-red-400">{errors.orgDetail}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button + Alert Context */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedOrg(null)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </button>
        {selectedOrgContext && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium">
            {selectedOrgContext.alertType.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Deactivation Banner */}
      {isDeactivated && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldOff className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                This organization was deactivated on {formatDate(org.deactivated_at)}
              </p>
              {org.deactivation_reason && (
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                  <span className="font-medium">Reason:</span> {org.deactivation_reason}
                </p>
              )}
              {orgDetail?.deactivation_log?.[0] && (
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  {orgDetail.deactivation_log[0].stripe_subscription_canceled && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">Subscription canceled</span>
                  )}
                  {orgDetail.deactivation_log[0].phone_numbers_released > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">{orgDetail.deactivation_log[0].phone_numbers_released} phone(s) released</span>
                  )}
                  {orgDetail.deactivation_log[0].stripe_refund_amount_cents > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">${(orgDetail.deactivation_log[0].stripe_refund_amount_cents / 100).toFixed(2)} refunded</span>
                  )}
                  {orgDetail.deactivation_log[0].notification_sent && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">Owner notified</span>
                  )}
                  {orgDetail.deactivation_log[0].admin_name && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">by {orgDetail.deactivation_log[0].admin_name}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Org Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {org?.name?.charAt(0)?.toUpperCase() || 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{org?.name || 'Unknown'}</h2>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${TIER_COLORS[org?.subscription_tier] || TIER_COLORS.free}`}>
                {(org?.subscription_tier || 'free').toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                {INDUSTRY_LABELS[org?.industry_template] || org?.industry_template || 'General'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              {org?.business_email && (
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{org.business_email}</span>
              )}
              {org?.business_phone && (
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{org.business_phone}</span>
              )}
              {org?.business_website && (
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{org.business_website}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Created {formatDate(org?.created_at)}</span>
            </div>
            {(org?.business_address || org?.business_city) && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[org.business_address, org.business_city, org.business_state, org.business_postal_code].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Engagement & Adoption */}
          {(() => {
            const lastLogin = stats?.last_any_login;
            const daysSinceLogin = lastLogin ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null;
            const loginStatus = daysSinceLogin === null ? 'Never' : daysSinceLogin === 0 ? 'Today' : `${daysSinceLogin}d ago`;
            const loginAlert = daysSinceLogin === null || daysSinceLogin > 14;
            const accountAge = stats?.account_age_days || 0;
            const accountAgeLabel = accountAge < 7 ? `${accountAge}d (new)` : accountAge < 30 ? `${accountAge}d` : `${Math.floor(accountAge / 30)}mo`;

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MiniStat icon={Activity} label="Last Login" valueStr={loginStatus} alert={loginAlert} subValue={accountAge < 14 && loginAlert ? 'New account - no login yet' : undefined} />
                <MiniStat icon={Clock} label="Account Age" valueStr={accountAgeLabel} subValue={`Created ${formatDate(org?.created_at)}`} />
                <MiniStat icon={Layers} label="Modules" value={stats?.modules_enabled || 0} subValue={`of ${org?.max_users || '?'} max users`} />
                <MiniStat icon={Users} label="Customers" value={stats?.customers_created || 0} subValue={`${stats?.invoices_created || 0} invoices, ${stats?.quotes_created || 0} quotes`} />
                <MiniStat icon={Zap} label="AI Tokens" value={stats?.ai_tokens_used || 0} subValue={stats?.ai_tokens_allocated ? `/ ${formatNumber(stats.ai_tokens_allocated)} allocated` : undefined} />
                <MiniStat icon={PhoneCall} label="Voice" value={org?.voice_minutes_used || 0} subValue={`${stats?.active_phones || 0} numbers, ${stats?.calls_made || 0} calls`} />
              </div>
            );
          })()}

          {/* Members Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Team Members ({members.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Member</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-400">No members found</td></tr>
                  ) : members.map((m: any) => {
                    const RoleIcon = ROLE_ICONS[m.role] || Users;
                    const loginAge = daysAgo(m.last_sign_in_at);
                    return (
                      <tr key={m.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                              m.role === 'owner' ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gray-400 dark:bg-gray-600'
                            }`}>
                              {m.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 truncate">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                            m.role === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            m.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            <RoleIcon className="w-3 h-3" />
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{formatDateTime(m.last_sign_in_at)}</p>
                            {loginAge && (
                              <p className={`text-[10px] ${
                                m.last_sign_in_at && (Date.now() - new Date(m.last_sign_in_at).getTime()) > 14 * 24 * 60 * 60 * 1000
                                  ? 'text-red-500' : 'text-gray-400'
                              }`}>{loginAge}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-purple-500" />
              Recent Login Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{a.full_name || 'Unknown'}</span>
                    </div>
                    <span className={`text-xs ${
                      a.days_ago != null && a.days_ago > 14 ? 'text-red-500 font-medium' : 'text-gray-400'
                    }`}>
                      {a.last_sign_in_at ? formatDateTime(a.last_sign_in_at) : 'Never logged in'}
                      {a.days_ago != null && a.days_ago > 0 && ` (${a.days_ago}d ago)`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Communication History */}
          {commsHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                Communication History
              </h3>
              <div className="space-y-2">
                {commsHistory.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      c.channel === 'email' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                      c.channel === 'sms' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                      'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                    }`}>
                      {c.channel === 'email' ? <Mail className="w-3 h-3" /> :
                       c.channel === 'sms' ? <Phone className="w-3 h-3" /> :
                       <Bell className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white text-xs">
                          {c.subject || c.channel.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.body}</p>
                      {c.admin_name && <p className="text-[10px] text-gray-400 mt-0.5">by {c.admin_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Call History ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-purple-500" />
                Call History
                {orgCallsTotal > 0 && (
                  <span className="text-xs font-normal text-gray-400">({orgCallsTotal})</span>
                )}
              </h3>
              {orgCallsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            </div>

            {/* Call Detail Expanded View */}
            {selectedOrgCall && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-200 dark:border-purple-800/30">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedOrgCall(null)}
                      className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to list
                    </button>
                    <span className="text-[10px] text-gray-400">
                      {formatDateTime(selectedOrgCall.started_at || selectedOrgCall.created_at)}
                    </span>
                  </div>
                </div>

                {orgCallDetailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {/* Call Meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Direction</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                          {selectedOrgCall.direction === 'inbound' ? <ArrowDownLeft className="w-3 h-3 text-blue-500" /> : <ArrowUpRight className="w-3 h-3 text-green-500" />}
                          {selectedOrgCall.direction || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Duration</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {formatDuration(selectedOrgCall.duration_seconds || Math.round((selectedOrgCall.duration_ms || 0) / 1000))}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Agent</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{selectedOrgCall.agent_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Sentiment</p>
                        <p className={`text-sm font-medium mt-0.5 capitalize ${sentimentColor(selectedOrgCall.sentiment || selectedOrgCall.summary_sentiment)}`}>
                          {selectedOrgCall.sentiment || selectedOrgCall.summary_sentiment || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">From</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{selectedOrgCall.phone_number || selectedOrgCall.customer_phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Customer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                          {selectedOrgCall.customer_name || selectedOrgCall.customer_phone || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Recording */}
                    {(selectedOrgCall.recording_url || selectedOrgCall.summary_recording_url) && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Recording</p>
                        <audio
                          controls
                          src={selectedOrgCall.recording_url || selectedOrgCall.summary_recording_url}
                          className="w-full h-8"
                          preload="none"
                        />
                      </div>
                    )}

                    {/* AI Summary */}
                    {(selectedOrgCall.call_summary || selectedOrgCall.summary || selectedOrgCall.summary_text) && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">AI Summary</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          {selectedOrgCall.summary_text || selectedOrgCall.call_summary || selectedOrgCall.summary}
                        </p>
                      </div>
                    )}

                    {/* Key Topics */}
                    {selectedOrgCall.key_topics && (() => {
                      try {
                        const topics = typeof selectedOrgCall.key_topics === 'string'
                          ? JSON.parse(selectedOrgCall.key_topics)
                          : selectedOrgCall.key_topics;
                        if (Array.isArray(topics) && topics.length > 0) {
                          return (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Key Topics</p>
                              <div className="flex flex-wrap gap-1.5">
                                {topics.map((t: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}

                    {/* Action Items */}
                    {(selectedOrgCall.action_items || selectedOrgCall.summary_action_items) && (() => {
                      try {
                        const raw = selectedOrgCall.summary_action_items || selectedOrgCall.action_items;
                        const items = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        if (Array.isArray(items) && items.length > 0) {
                          return (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Action Items</p>
                              <ul className="space-y-1">
                                {items.map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}

                    {/* Transcript */}
                    {selectedOrgCall.transcript && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Transcript</p>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 max-h-48 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {selectedOrgCall.transcript}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Calls Table */}
            {!selectedOrgCall && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Direction</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Agent</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Duration</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Sentiment</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {orgCalls.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">
                            {orgCallsLoading ? 'Loading...' : 'No call history found'}
                          </td>
                        </tr>
                      ) : orgCalls.map((call: any) => (
                        <tr
                          key={call.id}
                          onClick={() => fetchOrgCallDetail(call.id)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <p className="text-xs font-medium text-gray-900 dark:text-white">{formatDateTime(call.started_at || call.created_at)}</p>
                            <p className="text-[10px] text-gray-400">{call.customer_phone || call.phone_number || '—'}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              call.direction === 'inbound' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {call.direction === 'inbound' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {call.direction || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{call.agent_name || '—'}</p>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDuration(call.duration_seconds || Math.round((call.duration_ms || 0) / 1000))}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 hidden lg:table-cell">
                            <span className={`text-xs capitalize ${sentimentColor(call.sentiment || call.summary_sentiment)}`}>
                              {call.sentiment || call.summary_sentiment || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 inline-block" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calls Pagination */}
                {orgCallsTotal > CALLS_PER_PAGE && (
                  <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {orgCallsPage * CALLS_PER_PAGE + 1}-{Math.min((orgCallsPage + 1) * CALLS_PER_PAGE, orgCallsTotal)} of {orgCallsTotal}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => fetchOrgCalls(orgCallsPage - 1)}
                        disabled={orgCallsPage === 0}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => fetchOrgCalls(orgCallsPage + 1)}
                        disabled={(orgCallsPage + 1) * CALLS_PER_PAGE >= orgCallsTotal}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── SMS History ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                SMS History
                {orgSmsTotal > 0 && (
                  <span className="text-xs font-normal text-gray-400">({orgSmsTotal})</span>
                )}
              </h3>
              {orgSmsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Recipient</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Message</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {orgSms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                        {orgSmsLoading ? 'Loading...' : 'No SMS history found'}
                      </td>
                    </tr>
                  ) : orgSms.map((sms: any) => (
                    <tr
                      key={sms.id}
                      onClick={() => setSelectedSms(sms)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{formatDateTime(sms.sent_at || sms.created_at)}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-xs text-gray-700 dark:text-gray-300">{sms.recipient_phone || '—'}</p>
                        {(sms.customer_first_name || sms.customer_last_name) && (
                          <p className="text-[10px] text-gray-400 truncate">{[sms.customer_first_name, sms.customer_last_name].filter(Boolean).join(' ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{sms.message_body || '—'}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${smsStatusBadge(sms.status)}`}>
                          {sms.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Eye className="w-3.5 h-3.5 text-gray-400 inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SMS Pagination */}
            {orgSmsTotal > SMS_PER_PAGE && (
              <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {orgSmsPage * SMS_PER_PAGE + 1}-{Math.min((orgSmsPage + 1) * SMS_PER_PAGE, orgSmsTotal)} of {orgSmsTotal}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchOrgSms(orgSmsPage - 1)}
                    disabled={orgSmsPage === 0}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => fetchOrgSms(orgSmsPage + 1)}
                    disabled={(orgSmsPage + 1) * SMS_PER_PAGE >= orgSmsTotal}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-4">
          {/* Owner Card */}
          {owner && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-yellow-500" />
                Organization Owner
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{ownerName}</p>
                  <p className="text-xs text-gray-500 truncate">{ownerEmail}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Last login</span>
                  <span className={`font-medium ${
                    owner.last_sign_in_at && (Date.now() - new Date(owner.last_sign_in_at).getTime()) > 14 * 24 * 60 * 60 * 1000
                      ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                  }`}>{daysAgo(owner.last_sign_in_at) || 'Never'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Joined</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatDate(owner.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Onboarding</span>
                  <span className={owner.onboarding_completed ? 'text-green-600' : 'text-yellow-600'}>
                    {owner.onboarding_completed ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-purple-500" />
              Subscription
            </h3>
            {subscription ? (
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    subscription.status === 'trialing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {subscription.status?.toUpperCase()}
                  </span>
                </div>
                {subscription.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span>Period ends</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDate(subscription.current_period_end)}</span>
                  </div>
                )}
                {subscription.trial_end && (
                  <div className="flex items-center justify-between">
                    <span>Trial ends</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDate(subscription.trial_end)}</span>
                  </div>
                )}
                {subscription.canceled_at && (
                  <div className="flex items-center justify-between">
                    <span>Canceled</span>
                    <span className="text-red-500 font-medium">{formatDate(subscription.canceled_at)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Since</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatDate(subscription.created_at)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No subscription data</p>
            )}
            <button
              onClick={() => setActiveTab('billing')}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Change Plan
            </button>
          </div>

          {/* Stripe Status */}
          {org?.stripe_connect_status && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Stripe Connect</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                org.stripe_connect_status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {org.stripe_connect_status}
              </span>
            </div>
          )}

          {/* Communication Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-purple-500" />
              Reach Out
            </h3>
            {!owner?.user_id && !ownerEmail && !ownerPhone ? (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  No contact info available
                </p>
                <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-1 ml-5">
                  This organization has no owner, members, or contact details on file.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setCommMode('notification')}
                  disabled={!owner?.user_id}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left rounded-lg border transition-colors ${
                    owner?.user_id
                      ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800/30 cursor-pointer'
                      : 'bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <div className="min-w-0">
                    <span>Send In-App Notification</span>
                    {!owner?.user_id && <p className="text-[10px] opacity-70">No owner found</p>}
                  </div>
                </button>
                <button
                  onClick={() => setCommMode('email')}
                  disabled={!ownerEmail}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left rounded-lg border transition-colors ${
                    ownerEmail
                      ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 cursor-pointer'
                      : 'bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <div className="min-w-0">
                    <span>Send Email</span>
                    {ownerEmail ? (
                      <p className="text-[10px] opacity-70 truncate">{ownerEmail}</p>
                    ) : (
                      <p className="text-[10px] opacity-70">No email on file</p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setCommMode('sms')}
                  disabled={!ownerPhone}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left rounded-lg border transition-colors ${
                    ownerPhone
                      ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800/30 cursor-pointer'
                      : 'bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <div className="min-w-0">
                    <span>Send SMS</span>
                    {ownerPhone ? (
                      <p className="text-[10px] opacity-70">{ownerPhone}</p>
                    ) : (
                      <p className="text-[10px] opacity-70">No phone on file</p>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab('users')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5" />
                View in Users & Orgs
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" />
                View Billing History
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                View Support Tickets
              </button>
              {/* Deactivate / Reactivate */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                {isDeactivated ? (
                  <div className="w-full text-left px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 rounded-lg flex items-center gap-2 cursor-not-allowed">
                    <ShieldOff className="w-3.5 h-3.5" />
                    <div>
                      <span>Reactivate Organization</span>
                      <p className="text-[10px] opacity-70">Coming soon</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={openDeactivateModal}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-red-200 dark:hover:border-red-800/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deactivate Organization
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivation Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => !deactivating && setShowDeactivateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Deactivate Organization
              </h3>
              {!deactivating && (
                <button onClick={() => setShowDeactivateModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Success Result */}
            {deactivateResult?.success ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{deactivateResult.message}</p>
                {deactivateResult.actions && (
                  <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {deactivateResult.actions.subscriptionCanceled && (
                      <p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Subscription canceled</p>
                    )}
                    {deactivateResult.actions.phonesReleased > 0 && (
                      <p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {deactivateResult.actions.phonesReleased} phone number(s) released</p>
                    )}
                    {deactivateResult.actions.refundAmountCents > 0 && (
                      <p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> ${(deactivateResult.actions.refundAmountCents / 100).toFixed(2)} refunded</p>
                    )}
                    {deactivateResult.actions.emailSent && (
                      <p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Owner notified via email</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="mt-6 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : deactivateStep === 1 ? (
              /* Step 1: Options */
              <div>
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    You are about to deactivate <strong>{org?.name}</strong>.
                    {members.length > 0 && ` This will affect ${members.length} member(s).`}
                  </p>
                  <p className="text-[10px] text-red-600 dark:text-red-400/70 mt-1">
                    All data will be preserved but users will be blocked from accessing the CRM.
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deactivateOptions.cancelSubscription}
                      onChange={(e) => setDeactivateOptions(prev => ({ ...prev, cancelSubscription: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Cancel Stripe subscription</p>
                      <p className="text-xs text-gray-500">Stop billing immediately</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deactivateOptions.releasePhoneNumbers}
                      onChange={(e) => setDeactivateOptions(prev => ({ ...prev, releasePhoneNumbers: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Release all phone numbers</p>
                      <p className="text-xs text-gray-500">{stats?.active_phones || 0} active number(s) will be removed from Twilio</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deactivateOptions.sendNotificationEmail}
                      onChange={(e) => setDeactivateOptions(prev => ({ ...prev, sendNotificationEmail: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Send notification email to owner</p>
                      <p className="text-xs text-gray-500">{ownerEmail || 'No email on file'}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deactivateOptions.refundLastInvoice}
                      onChange={(e) => setDeactivateOptions(prev => ({ ...prev, refundLastInvoice: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Refund last invoice</p>
                      <p className="text-xs text-gray-500">Issue a refund for the most recent paid invoice</p>
                    </div>
                  </label>
                  {deactivateOptions.refundLastInvoice && (
                    <div className="ml-8 pl-3 border-l-2 border-red-200 dark:border-red-800/30 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="refundType"
                          checked={refundType === 'full'}
                          onChange={() => setRefundType('full')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Full refund</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="refundType"
                          checked={refundType === 'partial'}
                          onChange={() => setRefundType('partial')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Partial refund</span>
                      </label>
                      {refundType === 'partial' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-32 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none focus:border-red-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for deactivation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="Explain why this organization is being deactivated (min 10 characters)..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-red-500 resize-none"
                  />
                  {deactivateReason.length > 0 && deactivateReason.length < 10 && (
                    <p className="text-[10px] text-red-500 mt-1">{10 - deactivateReason.length} more characters needed</p>
                  )}
                </div>

                {/* Error */}
                {deactivateResult && !deactivateResult.success && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 text-sm">
                    {deactivateResult.message}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeactivateModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeactivateStep(2)}
                    disabled={deactivateReason.trim().length < 10}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Type to confirm */
              <div>
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Type <strong className="font-mono">{org?.name}</strong> below to confirm deactivation.
                  </p>
                </div>

                {/* Summary of what will happen */}
                <div className="mb-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">Actions to be taken:</p>
                  {deactivateOptions.cancelSubscription && (
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Cancel Stripe subscription</p>
                  )}
                  {deactivateOptions.releasePhoneNumbers && (
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Release {stats?.active_phones || 0} phone number(s)</p>
                  )}
                  {deactivateOptions.refundLastInvoice && (
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Refund last invoice {refundType === 'partial' && refundAmount ? `($${refundAmount})` : '(full)'}</p>
                  )}
                  {deactivateOptions.sendNotificationEmail && (
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Notify owner via email</p>
                  )}
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Block all members from CRM access</p>
                  <p className="mt-2 text-[10px] text-gray-400">Reason: {deactivateReason}</p>
                </div>

                <input
                  type="text"
                  value={confirmOrgName}
                  onChange={(e) => setConfirmOrgName(e.target.value)}
                  placeholder={`Type "${org?.name}" to confirm`}
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-red-500 mb-4"
                  autoFocus
                />

                {/* Error */}
                {deactivateResult && !deactivateResult.success && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 text-sm">
                    {deactivateResult.message}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setDeactivateStep(1); setConfirmOrgName(''); }}
                    disabled={deactivating}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating || confirmOrgName.toLowerCase() !== (org?.name || '').toLowerCase()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deactivating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Deactivate Organization
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Communication Modal */}
      {commMode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={closeCommModal}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {commMode === 'notification' && <><Bell className="w-5 h-5 text-purple-500" /> Send Notification</>}
                {commMode === 'email' && <><Mail className="w-5 h-5 text-blue-500" /> Send Email</>}
                {commMode === 'sms' && <><Phone className="w-5 h-5 text-green-500" /> Send SMS</>}
              </h3>
              <button onClick={closeCommModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Recipient Info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sending to</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{ownerName} - {org?.name}</p>
              <p className="text-xs text-gray-500">
                {commMode === 'email' ? ownerEmail : commMode === 'sms' ? ownerPhone : 'In-app notification'}
              </p>
            </div>

            {/* Subject (email & notification) */}
            {commMode !== 'sms' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  placeholder={commMode === 'email' ? 'Email subject line...' : 'Notification title...'}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-purple-500 dark:focus:border-purple-400"
                />
              </div>
            )}

            {/* Body */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
                {commMode === 'sms' && (
                  <span className={`ml-2 ${commBody.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {commBody.length}/160
                  </span>
                )}
              </label>
              <textarea
                value={commBody}
                onChange={(e) => setCommBody(e.target.value)}
                placeholder="Type your message..."
                rows={commMode === 'sms' ? 3 : 5}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-purple-500 dark:focus:border-purple-400 resize-none"
              />
            </div>

            {/* Result */}
            {commResult && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                commResult.success
                  ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                  : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'
              }`}>
                {commResult.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeCommModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendComm}
                disabled={commSending || !commBody.trim() || (commResult?.success === true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50 ${
                  commMode === 'notification' ? 'bg-purple-600 hover:bg-purple-700' :
                  commMode === 'email' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-green-600 hover:bg-green-700'
                }`}
              >
                {commSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {commResult?.success ? 'Sent' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS Detail Modal ── */}
      {selectedSms && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setSelectedSms(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                SMS Detail
              </h3>
              <button onClick={() => setSelectedSms(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full uppercase ${smsStatusBadge(selectedSms.status)}`}>
                {selectedSms.status || 'Unknown'}
              </span>
              {selectedSms.template_key && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {selectedSms.template_key}
                </span>
              )}
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Recipient</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSms.recipient_phone || '—'}</p>
                {(selectedSms.customer_first_name || selectedSms.customer_last_name) && (
                  <p className="text-xs text-gray-500">
                    {[selectedSms.customer_first_name, selectedSms.customer_last_name].filter(Boolean).join(' ')}
                  </p>
                )}
                {selectedSms.customer_email && (
                  <p className="text-[10px] text-gray-400">{selectedSms.customer_email}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Sent</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(selectedSms.sent_at || selectedSms.created_at)}</p>
              </div>
              {selectedSms.sender_name && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Sent By</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{selectedSms.sender_name}</p>
                </div>
              )}
              {selectedSms.document_type && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Related To</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 capitalize">{selectedSms.document_type}</p>
                </div>
              )}
              {selectedSms.message_sid && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Message SID</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono break-all">{selectedSms.message_sid}</p>
                </div>
              )}
            </div>

            {/* Full Message Body */}
            <div className="mb-4">
              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Full Message</p>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {selectedSms.message_body || 'No message content'}
                </p>
              </div>
              {selectedSms.message_body && (
                <p className="text-[10px] text-gray-400 mt-1 text-right">{selectedSms.message_body.length} characters</p>
              )}
            </div>

            {/* Error Info */}
            {selectedSms.error_message && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                <p className="text-[10px] text-red-500 uppercase font-medium mb-1">Error</p>
                <p className="text-xs text-red-700 dark:text-red-400">{selectedSms.error_message}</p>
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => setSelectedSms(null)}
              className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

const MiniStat = ({ icon: Icon, label, value, valueStr, subValue, alert }: {
  icon: any; label: string; value?: number; valueStr?: string; subValue?: string; alert?: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-3.5 h-3.5 ${alert ? 'text-red-500' : 'text-gray-400'}`} />
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">{label}</span>
    </div>
    <p className={`text-lg font-bold ${alert ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
      {valueStr ?? formatNumber(value ?? 0)}
    </p>
    {subValue && <p className={`text-[10px] mt-0.5 ${alert ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{subValue}</p>}
  </div>
);
