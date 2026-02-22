import React from 'react';
import { Users, UserPlus, Calendar as CalendarIcon, TrendingUp, CheckCircle, FileText, DollarSign, Phone, Package, LayoutGrid, Building2, Link, Copy, Zap, Code, Key, MoreVertical, Loader2, X, Settings as SettingsIcon, Info } from 'lucide-react';
import { Webhook } from '@/services/webhook.service';
import { ApiKey } from '@/services/apiKey.service';
import { INDUSTRY_TEMPLATES, INDUSTRY_LABELS, AVAILABLE_MODULES } from '@/config/modules.config';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url?: string;
  color?: string;
}

interface Organization {
  id: string;
  name: string;
  industry_template?: string;
  slug?: string;
  metadata?: any;
}

interface TeamIntegrationsTabProps {
  currentOrganization: Organization;
  teamMembers: TeamMember[];
  handleRoleChange: (memberId: string, newRole: string) => void;
  updateOrganization: (data: any) => Promise<void>;
  webhooks: Webhook[];
  apiKeys: ApiKey[];
  loadingWebhooks: boolean;
  loadingApiKeys: boolean;
  onShowInviteModal: () => void;
  onShowWebhookModal: (webhook?: Webhook) => void;
  onShowApiKeyModal: () => void;
  onShowZapierModal: () => void;
  onDeleteWebhook: (id: string) => void;
  onDeleteApiKey: (id: string) => void;
  bookingUrl: string;
}

export default function TeamIntegrationsTab({
  currentOrganization,
  teamMembers,
  handleRoleChange,
  updateOrganization,
  webhooks,
  apiKeys,
  loadingWebhooks,
  loadingApiKeys,
  onShowInviteModal,
  onShowWebhookModal,
  onShowApiKeyModal,
  onShowZapierModal,
  onDeleteWebhook,
  onDeleteApiKey,
  bookingUrl,
}: TeamIntegrationsTabProps) {
  const industry = currentOrganization?.industry_template || 'general_business';
  const industryModules = INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES.general_business;
  const shareableModules = industryModules.filter((m: string) => m !== 'dashboard');

  const moduleIcons: Record<string, React.ReactNode> = {
    crm: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    calendar: <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />,
    pipeline: <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    tasks: <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
    quotes: <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    invoices: <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    calls: <Phone className="w-6 h-6 text-red-600 dark:text-red-400" />,
    products: <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    inventory: <LayoutGrid className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
    suppliers: <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />,
    financials: <DollarSign className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
  };

  const moduleDescriptions: Record<string, string> = {
    crm: 'Share customer/contact database with team',
    calendar: 'Collaborative calendar and scheduling',
    pipeline: 'Collaborative deal tracking and revenue visibility',
    tasks: 'Assign and track tasks across the team',
    quotes: 'Share quote/proposal access with team',
    invoices: 'Share invoice management with team',
    calls: 'Share call logs and recordings',
    products: 'Share product catalog with team',
    inventory: 'Share inventory tracking with team',
    suppliers: 'Share supplier information with team',
    financials: 'Share financial data and reports',
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage who has access to your CRM data</p>
          </div>
          <button
            onClick={onShowInviteModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        <div className="p-6 space-y-4">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div key={member.id} className={`flex items-center justify-between p-4 border-2 ${member.role === 'owner' ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} rounded-xl transition-all`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden" style={{ backgroundColor: member.color || '#6366f1' }}>
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      (member.full_name || member.email).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{member.full_name || 'Unnamed User'}</p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${member.role === 'owner' ? 'bg-blue-600 text-white' :
                        member.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                {member.role !== 'owner' ? (
                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="user">User</option>
                    </select>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Full Access</div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-20" />
              <p className="text-gray-500">No team members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Shared Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shared Resources</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Control what team members can access</p>
        </div>

        <div className="p-6 space-y-4">
          {shareableModules.map((moduleId: string) => {
            const label = INDUSTRY_LABELS[industry]?.[moduleId]?.name || AVAILABLE_MODULES[moduleId]?.name || moduleId;
            const description = moduleDescriptions[moduleId] || `Share ${label} with team`;
            const icon = moduleIcons[moduleId] || <LayoutGrid className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
            const isShared = currentOrganization?.metadata?.sharing?.[moduleId] ?? true;

            return (
              <div key={moduleId} className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">{icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={async (e) => {
                      const currentSharing = currentOrganization?.metadata?.sharing || {};
                      const newMetadata = {
                        ...currentOrganization?.metadata,
                        sharing: { ...currentSharing, [moduleId]: e.target.checked }
                      };
                      await updateOrganization({ metadata: newMetadata });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* External Sharing & Integrations */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">External Sharing</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Share data with external tools and platforms</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Public Booking Link */}
          <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Public Booking Link</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Share this link for customers to book appointments</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const currentSharing = currentOrganization?.metadata?.sharing || {};
                    await updateOrganization({
                      metadata: {
                        ...currentOrganization?.metadata,
                        sharing: { ...currentSharing, booking_link_enabled: true }
                      }
                    });
                    toast.success('Booking link activated!');
                  } catch {
                    toast.error('Failed to activate booking link');
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {currentOrganization?.metadata?.sharing?.booking_link_enabled ? 'Active' : 'Generate Link'}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <input type="text" value={bookingUrl} readOnly className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none" />
              <button
                onClick={() => {
                  if (bookingUrl) {
                    navigator.clipboard.writeText(bookingUrl);
                    toast.success('Link copied to clipboard');
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Zapier Integration */}
          <div className="p-4 border-2 border-orange-200 dark:border-orange-900/30 rounded-xl bg-orange-50/30 dark:bg-orange-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Zapier Integration</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connect to 6,000+ apps</p>
                </div>
              </div>
              <button
                onClick={onShowZapierModal}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-sm transition-colors shadow-sm shadow-orange-200 dark:shadow-none"
              >
                Connect
              </button>
            </div>
          </div>

          {/* Webhooks */}
          <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Webhooks</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive real-time CRM events</p>
                </div>
              </div>
              <button
                onClick={() => onShowWebhookModal(undefined)}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                Add Webhook
              </button>
            </div>

            {loadingWebhooks ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
            ) : webhooks.length > 0 ? (
              <div className="space-y-2">
                {webhooks.map(webhook => (
                  <div key={webhook.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{webhook.url}</p>
                      <p className="text-[10px] text-gray-500">{webhook.events.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onShowWebhookModal(webhook)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500">
                        <SettingsIcon size={14} />
                      </button>
                      <button onClick={() => onDeleteWebhook(webhook.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-2 italic">No webhooks configured</p>
            )}
          </div>

          {/* API Keys */}
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/30 dark:bg-gray-900/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">API Keys</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage access keys for custom integrations</p>
                </div>
              </div>
              <button
                onClick={onShowApiKeyModal}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm transition-colors"
              >
                New Key
              </button>
            </div>

            {loadingApiKeys ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>
            ) : apiKeys.length > 0 ? (
              <div className="space-y-2">
                {apiKeys.map(apiKey => (
                  <div key={apiKey.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{apiKey.name}</p>
                      <p className="text-[10px] font-mono text-gray-500">Prefix: {apiKey.key_prefix}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-gray-400 italic">
                        Used: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}
                      </span>
                      <button onClick={() => onDeleteApiKey(apiKey.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-2 italic">No active API keys</p>
            )}
          </div>
        </div>
      </div>

      {/* Permission Levels Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">Permission Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Owner:</strong> Full control including billing and team management</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Admin:</strong> Manage all CRM data and settings except billing</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Full Access:</strong> Create, edit, and delete all records</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Can Edit:</strong> View and edit existing records</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Can View:</strong> Read-only access to CRM data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
