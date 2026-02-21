/**
 * EmailConnectionSettings
 * Settings tab for connecting Gmail / Outlook via OAuth.
 * Users can connect their email to send emails directly from CoPilot Quarterback mode.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Link2, Unlink, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';
import { useOrganizationStore } from '@/stores/organizationStore';
import { getAuthToken } from '@/utils/auth.utils';
import toast from 'react-hot-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface EmailConnection {
  id: string;
  provider: 'google' | 'microsoft';
  email_address: string;
  display_name: string | null;
  status: 'active' | 'revoked' | 'expired';
  last_used_at: string | null;
  created_at: string;
}

const EmailConnectionSettings: React.FC = () => {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const { currentOrganization } = useOrganizationStore();
  const orgId = currentOrganization?.id;

  // Check for OAuth callback status in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      const provider = params.get('provider');
      toast.success(`${provider === 'google' ? 'Gmail' : 'Outlook'} connected successfully!`);
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      const error = params.get('error');
      const errorMessages: Record<string, string> = {
        access_denied: 'You cancelled the authorization. No changes were made.',
        token_exchange_failed: 'Failed to complete authorization. Please try again.',
        invalid_state: 'Authorization session expired. Please try again.',
        no_email_found: 'Could not determine your email address from the provider.',
        internal_error: 'Something went wrong. Please try again later.',
      };
      toast.error(errorMessages[error || ''] || `OAuth error: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch existing connections
  const fetchConnections = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/email_oauth_connections?organization_id=eq.${orgId}&select=id,provider,email_address,display_name,status,last_used_at,created_at&order=created_at.desc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnections(data || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Initiate OAuth connection
  const handleConnect = async (provider: 'google' | 'microsoft') => {
    if (!orgId) {
      toast.error('Organization not loaded. Please refresh the page.');
      return;
    }

    setConnecting(provider);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in again.');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth-initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, organization_id: orgId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to start connection. Please try again.');
        return;
      }

      if (data.authorization_url) {
        // Redirect to OAuth provider
        window.location.href = data.authorization_url;
      }
    } catch {
      toast.error('Failed to start connection. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  // Disconnect an email account
  const handleDisconnect = async (connection: EmailConnection) => {
    setDisconnecting(connection.id);
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Update status to revoked
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/email_oauth_connections?id=eq.${connection.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'revoked',
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        toast.success(`${connection.provider === 'google' ? 'Gmail' : 'Outlook'} disconnected.`);
        await fetchConnections();
      } else {
        toast.error('Failed to disconnect. Please try again.');
      }
    } catch {
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  };

  const googleConnection = connections.find(c => c.provider === 'google' && c.status === 'active');
  const microsoftConnection = connections.find(c => c.provider === 'microsoft' && c.status === 'active');

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Connection</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect your email to send messages directly from CoPilot
            </p>
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          How it works
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>When AI Quarterback identifies an opportunity, CoPilot can draft an email for you. Connect your Gmail or Outlook account so emails are sent <strong className="text-gray-900 dark:text-white">from your own address</strong>, not a generic system email.</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Your credentials are encrypted and stored securely</li>
            <li>We only request permission to send emails on your behalf</li>
            <li>You can disconnect at any time</li>
          </ul>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gmail Card */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M22 6L12 13L2 6V4L12 11L22 4V6Z" fill="#EA4335" />
                  <path d="M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6L12 13L22 6Z" fill="#FBBC05" opacity="0.3" />
                  <path d="M2 6L12 13L22 6" stroke="#EA4335" strokeWidth="0.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Gmail</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Google Workspace or personal Gmail</p>
              </div>
            </div>

            {googleConnection ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Connected</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{googleConnection.email_address}</p>
                  {googleConnection.display_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{googleConnection.display_name}</p>
                  )}
                  {googleConnection.last_used_at && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Last used: {new Date(googleConnection.last_used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDisconnect(googleConnection)}
                  disabled={disconnecting === googleConnection.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full"
                >
                  {disconnecting === googleConnection.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disconnect Gmail
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect('google')}
                disabled={connecting === 'google'}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
              >
                {connecting === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Connect Gmail
              </button>
            )}
          </Card>

          {/* Outlook Card */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" fill="#0078D4" opacity="0.2" />
                  <path d="M3 7L12 13L21 7" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" />
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0078D4" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Outlook</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Microsoft 365 or personal Outlook</p>
              </div>
            </div>

            {microsoftConnection ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Connected</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{microsoftConnection.email_address}</p>
                  {microsoftConnection.display_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{microsoftConnection.display_name}</p>
                  )}
                  {microsoftConnection.last_used_at && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Last used: {new Date(microsoftConnection.last_used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDisconnect(microsoftConnection)}
                  disabled={disconnecting === microsoftConnection.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full"
                >
                  {disconnecting === microsoftConnection.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disconnect Outlook
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect('microsoft')}
                disabled={connecting === 'microsoft'}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
              >
                {connecting === 'microsoft' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Connect Outlook
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Privacy note */}
      <Card>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong className="text-gray-700 dark:text-gray-300">Privacy:</strong> We only request the minimum permissions needed to send emails on your behalf. We never read your inbox or access your contacts.</p>
            <p>Tokens are stored encrypted using Supabase Vault. You can revoke access at any time by disconnecting above or revoking from your Google/Microsoft account settings.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailConnectionSettings;
