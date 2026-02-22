import { useEffect, useState } from 'react';
import {
  ArrowLeft, Building2, Users, Mail, Phone, Globe, MapPin,
  Brain, PhoneCall, FileText, UserCheck, Activity, Layers,
  MessageSquare, Send, Bell, Clock, Shield, Crown, Loader2, X,
  AlertCircle, Calendar, Zap
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

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

export const OrgDetailView = () => {
  const {
    selectedOrgId, selectedOrgContext, setSelectedOrg, setActiveTab,
    orgDetail, loading, errors, fetchOrgDetail,
    sendAdminNotification, sendAdminEmail, sendAdminSms
  } = useAdminStore();

  const [commMode, setCommMode] = useState<CommMode>(null);
  const [commSubject, setCommSubject] = useState('');
  const [commBody, setCommBody] = useState('');
  const [commSending, setCommSending] = useState(false);
  const [commResult, setCommResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (selectedOrgId) {
      fetchOrgDetail(selectedOrgId);
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
            </div>
          </div>
        </div>
      </div>

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
