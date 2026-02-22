/**
 * EmailConnectionSettings
 * Settings tab for connecting Gmail / Outlook via OAuth OR custom SMTP.
 * Users can connect their email to send emails directly from CoPilot Quarterback mode.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Link2, Unlink, Loader2, CheckCircle, AlertCircle, Server, Eye, EyeOff, Zap, Trash2 } from 'lucide-react';
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

interface SmtpSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  sender_email: string;
  sender_name: string | null;
  is_verified: boolean;
  last_used_at: string | null;
  created_at: string;
}

const SMTP_PRESETS: Record<string, { host: string; port: number; secure: boolean; label: string }> = {
  namecheap: { host: 'mail.privateemail.com', port: 465, secure: true, label: 'Namecheap / PrivateEmail' },
  godaddy: { host: 'smtpout.secureserver.net', port: 465, secure: true, label: 'GoDaddy' },
  zoho: { host: 'smtp.zoho.com', port: 465, secure: true, label: 'Zoho Mail' },
  yahoo: { host: 'smtp.mail.yahoo.com', port: 465, secure: true, label: 'Yahoo Mail' },
  icloud: { host: 'smtp.mail.me.com', port: 587, secure: false, label: 'iCloud Mail' },
  fastmail: { host: 'smtp.fastmail.com', port: 465, secure: true, label: 'Fastmail' },
  custom: { host: '', port: 465, secure: true, label: 'Custom SMTP' },
};

const EmailConnectionSettings: React.FC = () => {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // SMTP form state
  const [showSmtpForm, setShowSmtpForm] = useState(false);
  const [smtpPreset, setSmtpPreset] = useState('custom');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [removingSmtp, setRemovingSmtp] = useState(false);

  const { currentOrganization } = useOrganizationStore();
  const orgId = currentOrganization?.id;

  // Check for OAuth callback status in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      const provider = params.get('provider');
      toast.success(`${provider === 'google' ? 'Gmail' : 'Outlook'} connected successfully!`);
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

  // Fetch existing connections + SMTP settings
  const fetchConnections = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const [oauthRes, smtpRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/email_oauth_connections?organization_id=eq.${orgId}&select=id,provider,email_address,display_name,status,last_used_at,created_at&order=created_at.desc`,
          { headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY } }
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/user_email_smtp_settings?organization_id=eq.${orgId}&select=id,smtp_host,smtp_port,smtp_secure,smtp_username,sender_email,sender_name,is_verified,last_used_at,created_at&order=created_at.desc&limit=1`,
          { headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY } }
        ),
      ]);

      if (oauthRes.ok) {
        const data = await oauthRes.json();
        setConnections(data || []);
      }

      if (smtpRes.ok) {
        const data = await smtpRes.json();
        if (data && data.length > 0) {
          setSmtpSettings(data[0]);
        } else {
          setSmtpSettings(null);
        }
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
        window.location.href = data.authorization_url;
      }
    } catch {
      toast.error('Failed to start connection. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  // Disconnect an OAuth email account
  const handleDisconnect = async (connection: EmailConnection) => {
    setDisconnecting(connection.id);
    try {
      const token = await getAuthToken();
      if (!token) return;

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

  // Apply SMTP preset
  const handlePresetChange = (preset: string) => {
    setSmtpPreset(preset);
    const p = SMTP_PRESETS[preset];
    if (p) {
      setSmtpHost(p.host);
      setSmtpPort(p.port);
      setSmtpSecure(p.secure);
    }
  };

  // Save SMTP settings
  const handleSaveSmtp = async () => {
    if (!orgId) return;
    if (!smtpHost.trim() || !smtpUsername.trim() || !senderEmail.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!smtpPassword.trim() && !smtpSettings) {
      toast.error('Please enter your SMTP password.');
      return;
    }

    setSavingSmtp(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in again.');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-smtp-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: orgId,
          smtp_host: smtpHost.trim(),
          smtp_port: smtpPort,
          smtp_secure: smtpSecure,
          smtp_username: smtpUsername.trim(),
          smtp_password: smtpPassword.trim() || undefined,
          sender_email: senderEmail.trim(),
          sender_name: senderName.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to save SMTP settings.');
        return;
      }

      toast.success('SMTP settings saved successfully!');
      setSmtpPassword('');
      setShowSmtpForm(false);
      await fetchConnections();
    } catch {
      toast.error('Failed to save SMTP settings.');
    } finally {
      setSavingSmtp(false);
    }
  };

  // Test SMTP connection
  const handleTestSmtp = async () => {
    if (!orgId) return;

    setTestingSmtp(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in again.');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/test-smtp-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization_id: orgId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.error || 'SMTP connection test failed.');
        return;
      }

      toast.success('SMTP connection verified! A test email was sent.');
      await fetchConnections();
    } catch {
      toast.error('Failed to test SMTP connection.');
    } finally {
      setTestingSmtp(false);
    }
  };

  // Remove SMTP settings
  const handleRemoveSmtp = async () => {
    if (!smtpSettings) return;

    setRemovingSmtp(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-smtp-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: orgId,
          action: 'delete',
        }),
      });

      if (response.ok) {
        toast.success('SMTP settings removed.');
        setSmtpSettings(null);
        setShowSmtpForm(false);
        resetSmtpForm();
        await fetchConnections();
      } else {
        toast.error('Failed to remove SMTP settings.');
      }
    } catch {
      toast.error('Failed to remove SMTP settings.');
    } finally {
      setRemovingSmtp(false);
    }
  };

  const resetSmtpForm = () => {
    setSmtpPreset('custom');
    setSmtpHost('');
    setSmtpPort(465);
    setSmtpSecure(true);
    setSmtpUsername('');
    setSmtpPassword('');
    setSenderEmail('');
    setSenderName('');
  };

  // Populate form from existing settings for editing
  const handleEditSmtp = () => {
    if (smtpSettings) {
      setSmtpHost(smtpSettings.smtp_host);
      setSmtpPort(smtpSettings.smtp_port);
      setSmtpSecure(smtpSettings.smtp_secure);
      setSmtpUsername(smtpSettings.smtp_username);
      setSenderEmail(smtpSettings.sender_email);
      setSenderName(smtpSettings.sender_name || '');
      // Match preset
      const match = Object.entries(SMTP_PRESETS).find(
        ([, p]) => p.host === smtpSettings.smtp_host && p.port === smtpSettings.smtp_port
      );
      setSmtpPreset(match ? match[0] : 'custom');
    }
    setShowSmtpForm(true);
  };

  const googleConnection = connections.find(c => c.provider === 'google' && c.status === 'active');
  const microsoftConnection = connections.find(c => c.provider === 'microsoft' && c.status === 'active');

  const hasAnyConnection = !!(googleConnection || microsoftConnection || smtpSettings);

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
              Connect your email to send messages directly from the CRM
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
          <p>Connect your email so messages are sent <strong className="text-gray-900 dark:text-white">from your own address</strong>. Choose one of three options:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-gray-900 dark:text-white">Gmail or Outlook</strong> - one-click OAuth connection (recommended)</li>
            <li><strong className="text-gray-900 dark:text-white">Custom SMTP</strong> - works with any email provider (Namecheap, GoDaddy, Zoho, etc.)</li>
          </ul>
          <p className="text-xs text-gray-400 dark:text-gray-500">Your credentials are encrypted and stored securely. You can disconnect at any time.</p>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </Card>
      ) : (
        <>
          {/* Status banner if connected */}
          {hasAnyConnection && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                Email sending is active
                {smtpSettings && !googleConnection && !microsoftConnection && ` via SMTP (${smtpSettings.sender_email})`}
                {googleConnection && ` via Gmail (${googleConnection.email_address})`}
                {microsoftConnection && !googleConnection && ` via Outlook (${microsoftConnection.email_address})`}
              </span>
            </div>
          )}

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

          {/* Custom SMTP Card - full width */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Server className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Custom SMTP</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Namecheap, GoDaddy, Zoho, or any SMTP provider
                  </p>
                </div>
              </div>

              {smtpSettings && !showSmtpForm && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    {testingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Test
                  </button>
                  <button
                    onClick={handleEditSmtp}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleRemoveSmtp}
                    disabled={removingSmtp}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    {removingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Connected SMTP display */}
            {smtpSettings && !showSmtpForm && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {smtpSettings.is_verified ? 'Connected & Verified' : 'Connected (not yet verified)'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sender</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {smtpSettings.sender_name ? `${smtpSettings.sender_name} <${smtpSettings.sender_email}>` : smtpSettings.sender_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">SMTP Server</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{smtpSettings.smtp_host}:{smtpSettings.smtp_port}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Username</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{smtpSettings.smtp_username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Encryption</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{smtpSettings.smtp_secure ? 'SSL/TLS' : 'STARTTLS'}</p>
                  </div>
                  {smtpSettings.last_used_at && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Last Used</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(smtpSettings.last_used_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SMTP Form */}
            {!smtpSettings && !showSmtpForm && (
              <button
                onClick={() => setShowSmtpForm(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Server className="w-4 h-4" />
                Configure SMTP
              </button>
            )}

            {showSmtpForm && (
              <div className="space-y-4 mt-2">
                {/* Provider preset */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email Provider
                  </label>
                  <select
                    value={smtpPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    {Object.entries(SMTP_PRESETS).map(([key, p]) => (
                      <option key={key} value={key}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SMTP Host */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="mail.privateemail.com"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Port + Security */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Port *
                      </label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Encryption
                      </label>
                      <select
                        value={smtpSecure ? 'ssl' : 'starttls'}
                        onChange={(e) => setSmtpSecure(e.target.value === 'ssl')}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="ssl">SSL/TLS (465)</option>
                        <option value="starttls">STARTTLS (587)</option>
                      </select>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      SMTP Username *
                    </label>
                    <input
                      type="text"
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      placeholder="you@yourdomain.com"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      SMTP Password {smtpSettings ? '(leave blank to keep current)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder={smtpSettings ? '********' : 'Your email password'}
                        className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sender Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Sender Email *
                    </label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="you@yourdomain.com"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Sender Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Sender Name (optional)
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Name or Company"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowSmtpForm(false);
                      if (!smtpSettings) resetSmtpForm();
                    }}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSmtp}
                    disabled={savingSmtp}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSmtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4" />
                        Save SMTP Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Privacy note */}
      <Card>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong className="text-gray-700 dark:text-gray-300">Privacy:</strong> We only request the minimum permissions needed to send emails on your behalf. We never read your inbox or access your contacts.</p>
            <p>OAuth tokens and SMTP passwords are stored encrypted using Supabase Vault. You can revoke access at any time by disconnecting above.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailConnectionSettings;
