import { useEffect, useState } from 'react';
import {
  Shield, Users, Server, Key, Copy, Check,
  ExternalLink, RefreshCw, Zap
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const PROJECT_REF = 'zkpfzrbbupgiqkzqydji';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const EDGE_FUNCTIONS = [
  { name: 'copilot-chat', jwt: false, purpose: 'AI CoPilot proxy', api: 'OpenRouter' },
  { name: 'receipt-scan', jwt: false, purpose: 'Receipt OCR (vision)', api: 'OpenRouter' },
  { name: 'ocr-extract', jwt: false, purpose: 'Business card OCR', api: 'Google Vision' },
  { name: 'provision-voice-agent', jwt: false, purpose: 'Phone + agent provisioning', api: 'Retell + Twilio' },
  { name: 'list-voices', jwt: false, purpose: 'List available voices', api: 'Retell' },
  { name: 'update-retell-agent', jwt: false, purpose: 'Sync agent settings', api: 'Retell' },
  { name: 'manage-knowledge-base', jwt: false, purpose: 'KB CRUD', api: 'Retell' },
  { name: 'retell-webhook', jwt: false, purpose: 'Call events + SMS', api: 'Retell + Twilio' },
  { name: 'send-invitation', jwt: false, purpose: 'Team invitation emails', api: 'Resend' },
  { name: 'send-sms', jwt: true, purpose: 'SMS notifications', api: 'Twilio' },
];

const API_SECRETS = [
  { name: 'OPENROUTER_API_KEY', service: 'OpenRouter (AI)', usedBy: 'copilot-chat, receipt-scan' },
  { name: 'RETELL_API_KEY', service: 'Retell AI (Voice)', usedBy: 'provision-voice-agent, list-voices, update-retell-agent, manage-knowledge-base, retell-webhook' },
  { name: 'TWILIO_MASTER_ACCOUNT_SID', service: 'Twilio (Phone/SMS)', usedBy: 'provision-voice-agent, retell-webhook' },
  { name: 'TWILIO_MASTER_AUTH_TOKEN', service: 'Twilio (Phone/SMS)', usedBy: 'provision-voice-agent, retell-webhook' },
  { name: 'GOOGLE_CLOUD_VISION_API_KEY', service: 'Google Vision (OCR)', usedBy: 'ocr-extract' },
  { name: 'RESEND_API_KEY', service: 'Resend (Email)', usedBy: 'send-invitation' },
  { name: 'TWILIO_SIP_TRUNK_SID', service: 'Twilio SIP Trunk', usedBy: 'provision-voice-agent' },
];

const TOKEN_TIERS = [
  { tier: 'Free', monthly: '50,000', color: 'gray' },
  { tier: 'Business', monthly: '500,000', color: 'blue' },
  { tier: 'Elite', monthly: '1,000,000', color: 'purple' },
  { tier: 'Enterprise', monthly: '1,000,000', color: 'orange' },
];

export const SettingsTab = () => {
  const { adminUsers, loading, fetchAdminUsers } = useAdminStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Admin Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />
          Admin Users
        </h3>
        <div className="space-y-2">
          {loading.adminUsers ? (
            <div className="h-20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          ) : adminUsers.length > 0 ? (
            adminUsers.map((admin) => (
              <div key={admin.user_id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {(admin.email?.[0] || 'A').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Access: {admin.admin_access_level} | Since: {new Date(admin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Super Admin
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No admin users configured</p>
          )}
        </div>
      </div>

      {/* Project Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Project Configuration
        </h3>
        <div className="space-y-2">
          <ConfigRow
            label="Project Ref"
            value={PROJECT_REF}
            copied={copiedField === 'ref'}
            onCopy={() => copyToClipboard(PROJECT_REF, 'ref')}
          />
          <ConfigRow
            label="Supabase URL"
            value={SUPABASE_URL}
            copied={copiedField === 'url'}
            onCopy={() => copyToClipboard(SUPABASE_URL, 'url')}
          />
          <ConfigRow
            label="Dashboard"
            value={`https://supabase.com/dashboard/project/${PROJECT_REF}`}
            copied={copiedField === 'dashboard'}
            onCopy={() => copyToClipboard(`https://supabase.com/dashboard/project/${PROJECT_REF}`, 'dashboard')}
            isLink
          />
          <ConfigRow
            label="Edge Functions URL"
            value={`${SUPABASE_URL}/functions/v1`}
            copied={copiedField === 'fn-url'}
            onCopy={() => copyToClipboard(`${SUPABASE_URL}/functions/v1`, 'fn-url')}
          />
        </div>
      </div>

      {/* Edge Functions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-600" />
          Edge Functions ({EDGE_FUNCTIONS.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EDGE_FUNCTIONS.map((fn) => (
            <div key={fn.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">{fn.name}</span>
                <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  fn.jwt
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {fn.jwt ? 'JWT' : 'Internal'}
                </span>
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium shrink-0 ml-2">{fn.api}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Secrets Reference */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-orange-600" />
          API Secrets (Stored in Supabase Vault)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Secret Name</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Service</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Used By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {API_SECRETS.map((secret) => (
                <tr key={secret.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-3 py-2">
                    <span className="text-sm font-mono text-gray-900 dark:text-white">{secret.name}</span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{secret.service}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{secret.usedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Token Allocation by Tier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-green-600" />
          AI Token Allocation by Tier
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TOKEN_TIERS.map((t) => (
            <div key={t.tier} className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t.tier}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{t.monthly}</p>
              <p className="text-[10px] text-gray-400">tokens/month</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ConfigRow = ({ label, value, copied, onCopy, isLink }: {
  label: string; value: string; copied: boolean; onCopy: () => void; isLink?: boolean;
}) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{value}</p>
    </div>
    <div className="flex items-center gap-1 ml-2">
      {isLink && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      )}
      <button onClick={onCopy} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
      </button>
    </div>
  </div>
);
