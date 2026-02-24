import { useState, useEffect, useRef } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { settingsService, BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Calendar as CalendarIcon, Share2, Check, Loader2, Save, Palette, Sparkles, MessageSquare, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CalendarSettings from './CalendarSettings';
import { InviteMemberModal } from '@/components/settings/InviteMemberModal';
import ProfileTab from '@/components/settings/ProfileTab';
import AIAgentsTab from './AIAgentsTab';
import BusinessTab from '@/components/settings/BusinessTab';
import BillingTab from '@/components/settings/BillingTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import CommunicationsTab from '@/components/settings/CommunicationsTab';
import SupportTab from '@/components/settings/SupportTab';
import TeamIntegrationsTab from '@/components/settings/TeamIntegrationsTab';
import toast from 'react-hot-toast';
import { webhookService, Webhook } from '@/services/webhook.service';
import { apiKeyService, ApiKey } from '@/services/apiKey.service';
import { WebhookConfigModal } from '@/components/settings/WebhookConfigModal';
import { ApiKeyModal } from '@/components/settings/ApiKeyModal';
import { ZapierIntegrationModal } from '@/components/settings/ZapierIntegrationModal';

// --- Tab definitions ---
type SettingsTabId = 'profile' | 'business' | 'billing' | 'preferences' | 'communications' | 'calendar' | 'team' | 'aiagents' | 'support';

const SETTINGS_TABS: { id: SettingsTabId; label: string; icon: any; premium?: boolean }[] = [
  { id: 'profile', label: 'Profile', icon: Building2 },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'team', label: 'Team & Integrations', icon: Share2 },
  { id: 'aiagents', label: 'AI Agents', icon: Sparkles, premium: true },
  { id: 'support', label: 'Security & Support', icon: HelpCircle },
];

// Map old tab param values to new tab + optional sub-tab for backward compatibility
const TAB_PARAM_MAP: Record<string, { tab: SettingsTabId; subTab?: string }> = {
  profile: { tab: 'profile' },
  appearance: { tab: 'preferences', subTab: 'theme' },
  mobile: { tab: 'preferences', subTab: 'mobile' },
  business: { tab: 'business', subTab: 'info' },
  billing: { tab: 'billing', subTab: 'plan' },
  templates: { tab: 'business', subTab: 'templates' },
  payment: { tab: 'billing', subTab: 'payment' },
  twilio: { tab: 'communications', subTab: 'sms' },
  email: { tab: 'communications', subTab: 'email' },
  calendar: { tab: 'calendar' },
  sharing: { tab: 'team' },
  voiceagent: { tab: 'aiagents', subTab: 'voice' },
  aiagents: { tab: 'aiagents' },
  smsagent: { tab: 'aiagents', subTab: 'sms' },
  notifications: { tab: 'preferences', subTab: 'notifications' },
  security: { tab: 'support', subTab: 'security' },
  help: { tab: 'support', subTab: 'help' },
  invoices: { tab: 'billing', subTab: 'invoices' },
};

function resolveTabFromUrl(): { tab: SettingsTabId; subTab?: string } {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam && TAB_PARAM_MAP[tabParam]) {
    return TAB_PARAM_MAP[tabParam];
  }
  return { tab: 'profile' };
}

export default function Settings() {
  const { currentOrganization, teamMembers, updateMember, updateOrganization, fetchUserOrganizations, _hasHydrated } = useOrganizationStore();
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();

  // Resolve initial tab from URL params
  const initialResolved = resolveTabFromUrl();
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialResolved.tab);
  const [initialSubTab] = useState<string | undefined>(initialResolved.subTab);

  // Settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [quoteTemplates, setQuoteTemplates] = useState<DocumentTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<DocumentTemplate[]>([]);

  // Team/integration state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | undefined>();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);

  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const bookingUrl = currentOrganization?.slug
    ? `https://crm.cxtrack.com/book/${currentOrganization.slug}`
    : '';

  // --- Data loading ---
  useEffect(() => {
    if (currentOrganization) {
      loadSettings();
      loadWebhooks();
      loadApiKeys();
    } else {
      setLoading(false);
    }
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization) { setLoading(false); return; }
    try {
      setLoading(true);
      const [settingsData, quoteTemps, invoiceTemps] = await Promise.all([
        settingsService.getBusinessSettings(currentOrganization.id).catch(() => null),
        settingsService.getTemplates(currentOrganization.id, 'quote').catch(() => []),
        settingsService.getTemplates(currentOrganization.id, 'invoice').catch(() => []),
      ]);

      setSettings(settingsData || {
        business_email: null, business_phone: null, business_address: null,
        business_city: null, business_state: null, business_postal_code: null,
        business_country: null, business_website: null, logo_url: null,
        primary_color: '#3b82f6', quote_prefix: 'Q-', invoice_prefix: 'INV-',
        default_payment_terms: 'Net 30', default_quote_template_id: null,
        default_invoice_template_id: null, business_tax_id: null,
        default_tax_rate: 0, tax_label: 'Tax',
      });

      if (quoteTemps.length === 0 && invoiceTemps.length === 0) {
        try {
          await settingsService.initializeDefaultTemplates(currentOrganization.id);
          const [nq, ni] = await Promise.all([
            settingsService.getTemplates(currentOrganization.id, 'quote'),
            settingsService.getTemplates(currentOrganization.id, 'invoice'),
          ]);
          setQuoteTemplates(nq);
          setInvoiceTemplates(ni);
        } catch { setQuoteTemplates([]); setInvoiceTemplates([]); }
      } else {
        setQuoteTemplates(quoteTemps);
        setInvoiceTemplates(invoiceTemps);
      }
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const loadWebhooks = async () => {
    if (!currentOrganization) return;
    try { setLoadingWebhooks(true); setWebhooks(await webhookService.getWebhooks(currentOrganization.id)); }
    catch (e) { console.error('Failed to load webhooks:', e); }
    finally { setLoadingWebhooks(false); }
  };

  const loadApiKeys = async () => {
    if (!currentOrganization) return;
    try { setLoadingApiKeys(true); setApiKeys(await apiKeyService.getApiKeys(currentOrganization.id)); }
    catch (e) { console.error('Failed to load API keys:', e); }
    finally { setLoadingApiKeys(false); }
  };

  // --- Handlers ---
  const handleSave = async () => {
    if (!currentOrganization?.id || !settings) return;
    try {
      setSaving(true);
      await settingsService.updateBusinessSettings(currentOrganization.id, settings);
      localStorage.removeItem('organization-storage');
      if (user?.id) await fetchUserOrganizations(user.id);
      setSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrganization) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    try {
      setUploadingLogo(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const stored = localStorage.getItem(storageKey);
      const token = stored ? JSON.parse(stored)?.access_token : null;
      if (!token) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${currentOrganization.id}/logo.${ext}`;
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/logos/${filePath}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'x-upsert': 'true' },
        body: file,
      });
      if (!uploadRes.ok) { const err = await uploadRes.json().catch(() => ({})); throw new Error(err.message || 'Upload failed'); }
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/logos/${filePath}`;
      await settingsService.updateBusinessSettings(currentOrganization.id, { logo_url: logoUrl });
      setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      toast.success('Logo uploaded successfully');
    } catch (error: any) { toast.error(error.message || 'Failed to upload logo'); }
    finally { setUploadingLogo(false); if (logoInputRef.current) logoInputRef.current.value = ''; }
  };

  const handleRemoveLogo = async () => {
    if (!currentOrganization || !settings?.logo_url) return;
    try {
      setUploadingLogo(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const stored = localStorage.getItem(storageKey);
      const token = stored ? JSON.parse(stored)?.access_token : null;
      if (!token) throw new Error('Not authenticated');
      const pathMatch = settings.logo_url.match(/\/logos\/(.+)$/);
      if (pathMatch) {
        await fetch(`${supabaseUrl}/storage/v1/object/logos/${pathMatch[1]}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        });
      }
      await settingsService.updateBusinessSettings(currentOrganization.id, { logo_url: null });
      setSettings(prev => prev ? { ...prev, logo_url: null } : null);
      toast.success('Logo removed');
    } catch (error: any) { toast.error(error.message || 'Failed to remove logo'); }
    finally { setUploadingLogo(false); }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try { await updateMember(memberId, { role: newRole as any }); toast.success('Member role updated'); }
    catch { toast.error('Failed to update member role'); }
  };

  const handleSelectTemplate = async (templateId: string, type: 'quote' | 'invoice') => {
    if (!currentOrganization?.id) return;
    try {
      const fieldName = type === 'quote' ? 'default_quote_template_id' : 'default_invoice_template_id';
      await settingsService.updateBusinessSettings(currentOrganization.id, { [fieldName]: templateId });
      setSettings(prev => prev ? { ...prev, [fieldName]: templateId } : null);
      toast.success(`Default ${type} template updated`);
    } catch { toast.error('Failed to update template'); }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;
    try { await webhookService.deleteWebhook(id); toast.success('Webhook deleted'); loadWebhooks(); }
    catch { toast.error('Failed to delete webhook'); }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;
    try { await apiKeyService.deleteApiKey(id); toast.success('API key deleted'); loadApiKeys(); }
    catch { toast.error('Failed to delete API key'); }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const getTemplateThumbnail = (name: string) => {
    const templates: Record<string, JSX.Element> = {
      'Professional Green': (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2"><div className="h-3 bg-emerald-600 dark:bg-emerald-500 w-1/3 rounded"></div><div className="h-2 bg-emerald-400 dark:bg-emerald-600 w-1/2 rounded"></div></div>
          <div className="space-y-1"><div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-full rounded"></div><div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-3/4 rounded"></div><div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-5/6 rounded"></div></div>
        </div>
      ),
      'Minimal White': (
        <div className="w-full h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2"><div className="h-3 bg-gray-800 dark:bg-gray-300 w-1/3 rounded"></div><div className="h-2 bg-gray-400 dark:bg-gray-500 w-1/2 rounded"></div></div>
          <div className="space-y-1"><div className="h-2 bg-gray-200 dark:bg-gray-600 w-full rounded"></div><div className="h-2 bg-gray-200 dark:bg-gray-600 w-3/4 rounded"></div><div className="h-2 bg-gray-200 dark:bg-gray-600 w-5/6 rounded"></div></div>
        </div>
      ),
      'Classic Professional': (
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2"><div className="h-3 bg-blue-700 dark:bg-blue-500 w-1/3 rounded"></div><div className="h-2 bg-blue-500 dark:bg-blue-600 w-1/2 rounded"></div></div>
          <div className="space-y-1"><div className="h-2 bg-blue-300 dark:bg-blue-700 w-full rounded"></div><div className="h-2 bg-blue-300 dark:bg-blue-700 w-3/4 rounded"></div><div className="h-2 bg-blue-300 dark:bg-blue-700 w-5/6 rounded"></div></div>
        </div>
      ),
      'Modern Blue': (
        <div className="w-full h-full bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-2 border-sky-200 dark:border-sky-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2"><div className="h-3 bg-sky-600 dark:bg-sky-500 w-1/3 rounded"></div><div className="h-2 bg-sky-400 dark:bg-sky-600 w-1/2 rounded"></div></div>
          <div className="space-y-1"><div className="h-2 bg-sky-300 dark:bg-sky-700 w-full rounded"></div><div className="h-2 bg-sky-300 dark:bg-sky-700 w-3/4 rounded"></div><div className="h-2 bg-sky-300 dark:bg-sky-700 w-5/6 rounded"></div></div>
        </div>
      ),
    };
    return templates[name] || templates['Modern Blue'];
  };

  // --- Loading / empty states ---
  if (!_hasHydrated || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentOrganization || !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Organization Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your account is not linked to an organization yet.</p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your business information and preferences</p>
            </div>
            <Button onClick={handleSave} disabled={saving || saved}>
              {saved ? (
                <><Check className="w-4 h-4 mr-2 text-green-600" />Saved</>
              ) : saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>

          {/* Responsive 9-tab bar */}
          <div className="relative mt-6">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 lg:overflow-visible lg:flex-wrap">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    tab.premium
                      ? activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-500 shadow-lg shadow-purple-500/25'
                        : 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 hover:from-purple-500/20 hover:to-indigo-500/20 hover:shadow-md hover:shadow-purple-500/10'
                      : activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'profile' && <ProfileTab />}

        {activeTab === 'business' && (
          <BusinessTab
            settings={settings}
            setSettings={setSettings}
            organizationName={currentOrganization.name || ''}
            logoInputRef={logoInputRef}
            uploadingLogo={uploadingLogo}
            handleLogoUpload={handleLogoUpload}
            handleRemoveLogo={handleRemoveLogo}
            quoteTemplates={quoteTemplates}
            invoiceTemplates={invoiceTemplates}
            handleSelectTemplate={handleSelectTemplate}
            getTemplateThumbnail={getTemplateThumbnail}
            initialSubTab={activeTab === initialResolved.tab ? initialSubTab : undefined}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            organizationId={currentOrganization.id}
            subscriptionTier={currentOrganization.subscription_tier}
            initialSubTab={activeTab === initialResolved.tab ? initialSubTab : undefined}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesTab
            initialSubTab={activeTab === initialResolved.tab ? initialSubTab : undefined}
          />
        )}

        {activeTab === 'communications' && (
          <CommunicationsTab
            organizationId={currentOrganization.id}
            industry={currentOrganization.industry || 'general_business'}
            initialSubTab={activeTab === initialResolved.tab ? initialSubTab : undefined}
          />
        )}

        {activeTab === 'calendar' && (
          <div>
            <CalendarSettings />
          </div>
        )}

        {activeTab === 'team' && (
          <TeamIntegrationsTab
            currentOrganization={currentOrganization}
            teamMembers={teamMembers}
            handleRoleChange={handleRoleChange}
            updateOrganization={updateOrganization}
            webhooks={webhooks}
            apiKeys={apiKeys}
            loadingWebhooks={loadingWebhooks}
            loadingApiKeys={loadingApiKeys}
            onShowInviteModal={() => setShowInviteModal(true)}
            onShowWebhookModal={(webhook) => { setSelectedWebhook(webhook); setShowWebhookModal(true); }}
            onShowApiKeyModal={() => setShowApiKeyModal(true)}
            onShowZapierModal={() => setShowZapierModal(true)}
            onDeleteWebhook={handleDeleteWebhook}
            onDeleteApiKey={handleDeleteApiKey}
            bookingUrl={bookingUrl}
          />
        )}

        {activeTab === 'aiagents' && (
          <AIAgentsTab
            initialSubTab={activeTab === initialResolved.tab ? initialSubTab : undefined}
          />
        )}

        {activeTab === 'support' && (
          <SupportTab
            initialSubTab={activeTab === initialResolved.tab ? initialSubTab : undefined}
          />
        )}

        {/* Logout Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Modals */}
      <InviteMemberModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
      <WebhookConfigModal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        organizationId={currentOrganization.id}
        webhook={selectedWebhook}
        onSaved={loadWebhooks}
      />
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        organizationId={currentOrganization.id}
        onCreated={loadApiKeys}
      />
      <ZapierIntegrationModal
        isOpen={showZapierModal}
        onClose={() => setShowZapierModal(false)}
        organizationId={currentOrganization.id}
      />
    </div>
  );
}
