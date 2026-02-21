import { useState, useEffect, useRef } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore, Theme } from '@/stores/themeStore';
import { settingsService, BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, CreditCard, Calendar as CalendarIcon, Share2, Check, Loader2, Upload, Save, Palette, Sun, Moon, Zap, Users, UserPlus, TrendingUp, CheckCircle, Link, Copy, Code, Key, Info, MoreVertical, X, Settings as SettingsIcon, Smartphone, Package, DollarSign, Phone, CheckSquare, LayoutGrid, HelpCircle, Mic, MessageSquare, LogOut, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Card } from '@/components/theme/ThemeComponents';
import CalendarSettings from './CalendarSettings';
import { InviteMemberModal } from '@/components/settings/InviteMemberModal';

import { usePreferencesStore } from '@/stores/preferencesStore';
import ProfileTab from '@/components/settings/ProfileTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import SecurityTab from '@/components/settings/SecurityTab';
import HelpCenterTab from '@/components/settings/HelpCenterTab';
import VoiceAgentSetup from './VoiceAgentSetup';
import SMSSettingsTab from '@/components/settings/SMSSettingsTab';
import StripeConnectSettings from '@/components/settings/StripeConnectSettings';
import EmailConnectionSettings from '@/components/settings/EmailConnectionSettings';
import toast from 'react-hot-toast';
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import { usePageLabels } from '@/hooks/usePageLabels';
import { useVisibleModules } from '@/hooks/useVisibleModules';
import { INDUSTRY_TEMPLATES, INDUSTRY_LABELS, AVAILABLE_MODULES } from '@/config/modules.config';
import { PAYMENT_TERMS_OPTIONS } from '@/config/paymentTerms';
import { webhookService, Webhook } from '@/services/webhook.service';
import { apiKeyService } from '@/services/apiKey.service';
import { WebhookConfigModal } from '@/components/settings/WebhookConfigModal';
import { ApiKeyModal } from '@/components/settings/ApiKeyModal';
import { ZapierIntegrationModal } from '@/components/settings/ZapierIntegrationModal';

export default function Settings() {
  const { currentOrganization, teamMembers, updateMember, updateOrganization, fetchUserOrganizations, _hasHydrated } = useOrganizationStore();
  const { theme, setTheme } = useThemeStore();
  const { preferences, saveMobileNavItems } = usePreferencesStore();
  const { logout, user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'mobile' | 'business' | 'billing' | 'templates' | 'payment' | 'twilio' | 'calendar' | 'sharing' | 'notifications' | 'security' | 'help' | 'voiceagent' | 'email'>(() => {
    // Check URL params for tab= (used by OAuth callback redirect)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'email') return 'email';
    return 'profile';
  });
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [quoteTemplates, setQuoteTemplates] = useState<DocumentTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<DocumentTemplate[]>([]);
  const [devOrgId] = useState<string | null>(null);
  const [devOrgName] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | undefined>();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const bookingUrl = currentOrganization?.slug
    ? `https://crm.easyaicrm.com/book/${currentOrganization.slug}`
    : '';
  const navigate = useNavigate();

  // Industry-specific labels
  const crmLabels = usePageLabels('crm');
  const calendarLabels = usePageLabels('calendar');
  const quotesLabels = usePageLabels('quotes');
  const invoicesLabels = usePageLabels('invoices');
  const pipelineLabels = usePageLabels('pipeline');
  const tasksLabels = usePageLabels('tasks');

  // Get visible modules for this industry to filter options
  const { visibleModules } = useVisibleModules();
  const enabledModuleIds = visibleModules.map(m => m.id);

  // All possible mobile nav options with their module IDs
  const ALL_MOBILE_NAV_OPTIONS = [
    { path: '/customers', label: crmLabels.entityPlural, icon: Users, moduleId: 'crm' },
    { path: '/calendar', label: calendarLabels.title, icon: CalendarIcon, moduleId: 'calendar' },
    { path: '/products', label: 'Products', icon: Package, moduleId: 'products' },
    { path: '/quotes', label: quotesLabels.entityPlural, icon: FileText, moduleId: 'quotes' },
    { path: '/invoices', label: invoicesLabels.entityPlural, icon: DollarSign, moduleId: 'invoices' },
    { path: '/calls', label: 'Calls', icon: Phone, moduleId: 'calls' },
    { path: '/pipeline', label: pipelineLabels.title, icon: TrendingUp, moduleId: 'pipeline' },
    { path: '/tasks', label: tasksLabels.entityPlural, icon: CheckSquare, moduleId: 'tasks' },
  ];

  // Filter to only show modules enabled for this industry
  const MOBILE_NAV_OPTIONS = ALL_MOBILE_NAV_OPTIONS.filter(opt => enabledModuleIds.includes(opt.moduleId));

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrganization) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const stored = localStorage.getItem(storageKey);
      const token = stored ? JSON.parse(stored)?.access_token : null;
      if (!token) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${currentOrganization.id}/logo.${ext}`;

      // Upload to Supabase Storage (upsert)
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/logos/${filePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'x-upsert': 'true',
          },
          body: file,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      // Get public URL
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/logos/${filePath}`;

      // Save to organization settings
      await settingsService.updateBusinessSettings(currentOrganization.id, { logo_url: logoUrl });
      setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
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

      // Extract file path from URL
      const pathMatch = settings.logo_url.match(/\/logos\/(.+)$/);
      if (pathMatch) {
        await fetch(
          `${supabaseUrl}/storage/v1/object/logos/${pathMatch[1]}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );
      }

      await settingsService.updateBusinessSettings(currentOrganization.id, { logo_url: null });
      setSettings(prev => prev ? { ...prev, logo_url: null } : null);
      toast.success('Logo removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateMember(memberId, { role: newRole as any });
      toast.success('Member role updated');
    } catch (error) {
      toast.error('Failed to update member role');
    }
  };

  const testWebhook = async (_webhookId: string): Promise<{ success: boolean; message: string }> => {
    // In a real app, this would trigger a test event from the backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Test event sent successfully' };
  };

  useEffect(() => {
    const initSettings = async () => {
      if (currentOrganization) {
        loadSettings();
        loadWebhooks();
        loadApiKeys();
      } else {
        // No currentOrganization - wait for it to load or show empty state
        setLoading(false);
      }
    };
    initSettings();
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [settingsData, quoteTemps, invoiceTemps] = await Promise.all([
        settingsService.getBusinessSettings(currentOrganization.id).catch(() => null),
        settingsService.getTemplates(currentOrganization.id, 'quote').catch(() => []),
        settingsService.getTemplates(currentOrganization.id, 'invoice').catch(() => []),
      ]);

      // Always set settings - use empty defaults if no data
      setSettings(settingsData || {
        business_email: null,
        business_phone: null,
        business_address: null,
        business_city: null,
        business_state: null,
        business_postal_code: null,
        business_country: null,
        business_website: null,
        logo_url: null,
        primary_color: '#3b82f6',
        quote_prefix: 'Q-',
        invoice_prefix: 'INV-',
        default_payment_terms: 'Net 30',
        default_quote_template_id: null,
        default_invoice_template_id: null,
        business_tax_id: null,
        default_tax_rate: 0,
        tax_label: 'Tax',
      });

      if (quoteTemps.length === 0 && invoiceTemps.length === 0) {
        try {
          await settingsService.initializeDefaultTemplates(currentOrganization.id);
          const [newQuoteTemps, newInvoiceTemps] = await Promise.all([
            settingsService.getTemplates(currentOrganization.id, 'quote'),
            settingsService.getTemplates(currentOrganization.id, 'invoice'),
          ]);
          setQuoteTemplates(newQuoteTemps);
          setInvoiceTemplates(newInvoiceTemps);
        } catch (initError) {
          setQuoteTemplates([]);
          setInvoiceTemplates([]);
        }
      } else {
        setQuoteTemplates(quoteTemps);
        setInvoiceTemplates(invoiceTemps);
      }
    } catch (error) {
      toast.error('Failed to load settings');
      // Still show page with default/empty state if possible
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const orgId = currentOrganization?.id || devOrgId;
    if (!orgId || !settings) return;

    try {
      setSaving(true);
      await settingsService.updateBusinessSettings(orgId, settings);

      localStorage.removeItem('organization-storage');
      if (user?.id) {
        await fetchUserOrganizations(user.id);
      }

      setSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('[Settings] Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = async (templateId: string, type: 'quote' | 'invoice') => {
    const orgId = currentOrganization?.id || devOrgId;
    if (!orgId) return;

    try {
      const fieldName = type === 'quote' ? 'default_quote_template_id' : 'default_invoice_template_id';
      await settingsService.updateBusinessSettings(orgId, {
        [fieldName]: templateId,
      });

      setSettings(prev => prev ? { ...prev, [fieldName]: templateId } : null);
      toast.success(`Default ${type} template updated`);
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const loadWebhooks = async () => {
    if (!currentOrganization) return;
    try {
      setLoadingWebhooks(true);
      const data = await webhookService.getWebhooks(currentOrganization.id);
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const loadApiKeys = async () => {
    if (!currentOrganization) return;
    try {
      setLoadingApiKeys(true);
      const data = await apiKeyService.getApiKeys(currentOrganization.id);
      setApiKeys(data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await webhookService.deleteWebhook(id);
      toast.success('Webhook deleted');
      loadWebhooks();
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;
    try {
      await apiKeyService.deleteApiKey(id);
      toast.success('API key deleted');
      loadApiKeys();
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const getTemplateThumbnail = (name: string) => {
    const templates: Record<string, JSX.Element> = {
      'Professional Green': (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-emerald-600 dark:bg-emerald-500 w-1/3 rounded"></div>
            <div className="h-2 bg-emerald-400 dark:bg-emerald-600 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-full rounded"></div>
            <div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-3/4 rounded"></div>
            <div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-5/6 rounded"></div>
          </div>
        </div>
      ),
      'Minimal White': (
        <div className="w-full h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 dark:bg-gray-300 w-1/3 rounded"></div>
            <div className="h-2 bg-gray-400 dark:bg-gray-500 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-600 w-full rounded"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 w-3/4 rounded"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 w-5/6 rounded"></div>
          </div>
        </div>
      ),
      'Classic Professional': (
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-blue-700 dark:bg-blue-500 w-1/3 rounded"></div>
            <div className="h-2 bg-blue-500 dark:bg-blue-600 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-blue-300 dark:bg-blue-700 w-full rounded"></div>
            <div className="h-2 bg-blue-300 dark:bg-blue-700 w-3/4 rounded"></div>
            <div className="h-2 bg-blue-300 dark:bg-blue-700 w-5/6 rounded"></div>
          </div>
        </div>
      ),
      'Modern Blue': (
        <div className="w-full h-full bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-2 border-sky-200 dark:border-sky-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-sky-600 dark:bg-sky-500 w-1/3 rounded"></div>
            <div className="h-2 bg-sky-400 dark:bg-sky-600 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-sky-300 dark:bg-sky-700 w-full rounded"></div>
            <div className="h-2 bg-sky-300 dark:bg-sky-700 w-3/4 rounded"></div>
            <div className="h-2 bg-sky-300 dark:bg-sky-700 w-5/6 rounded"></div>
          </div>
        </div>
      ),
    };
    return templates[name] || templates['Modern Blue'];
  };

  // Show loading while hydration is in progress or settings are loading
  if (!_hasHydrated || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No organization loaded - show logout option
  if (!currentOrganization || !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Organization Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account is not linked to an organization yet.
          </p>
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure your business information and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving || saved}>
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'profile', label: 'Profile', icon: Building2 },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'mobile', label: 'Mobile Nav', icon: Smartphone, mobileOnly: true },
              { id: 'business', label: 'Business Info', icon: Building2 },
              { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'payment', label: 'Payment', icon: Zap },
              { id: 'twilio', label: 'Communications', icon: MessageSquare },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'sharing', label: 'Sharing', icon: Share2 },
              { id: 'voiceagent', label: 'Voice Agent', icon: Sparkles, premium: true },
              { id: 'notifications', label: 'Notifications', icon: Users },
              { id: 'security', label: 'Security', icon: Key },
              { id: 'help', label: 'Help', icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  (tab as any).premium
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

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'appearance' && (
          <div className="max-w-4xl space-y-6">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose the theme that fits your style
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    value: 'light',
                    label: 'Light',
                    description: 'Clean and bright',
                    icon: Sun,
                    previewBg: 'bg-white',
                    previewBorder: 'border-gray-200',
                  },
                  {
                    value: 'dark',
                    label: 'Dark',
                    description: 'Easy on the eyes',
                    icon: Moon,
                    previewBg: 'bg-gray-900',
                    previewBorder: 'border-gray-700',
                  },
                  {
                    value: 'soft-modern',
                    label: 'Soft Modern',
                    description: 'Warm and tactile',
                    icon: Palette,
                    previewBg: 'bg-soft-cream',
                    previewBorder: 'border-soft-cream-dark',
                  },
                  {
                    value: 'midnight',
                    label: 'Midnight',
                    description: 'Premium dark experience',
                    icon: Sparkles,
                    previewBg: 'bg-black',
                    previewBorder: 'border-yellow-500/30',
                  },
                ].map((themeOption) => {
                  const IconComponent = themeOption.icon;
                  const isSelected = theme === themeOption.value;

                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as Theme)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${isSelected
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                        }`}
                    >
                      <div className={`w-full h-32 rounded-xl mb-4 ${themeOption.previewBg} flex items-center justify-center border-2 ${themeOption.previewBorder}`}>
                        <IconComponent size={40} className={
                          isSelected ? 'text-primary-600' : 'text-gray-400'
                        } />
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
                            {themeOption.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {themeOption.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
        {activeTab === 'mobile' && (
          <div className="max-w-4xl space-y-6">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mobile Quick Access</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
                Customize your mobile bottom navigation. Select your top 3 most used features for quick access. (Home and More are always included).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOBILE_NAV_OPTIONS.map((option) => {
                  const selectedItems = preferences.mobileNavItems || [];
                  const isSelected = selectedItems.includes(option.path);
                  const isMaxReached = selectedItems.length >= 3 && !isSelected;

                  return (
                    <button
                      key={option.path}
                      disabled={isMaxReached}
                      onClick={() => {
                        if (isSelected) {
                          saveMobileNavItems(selectedItems.filter(p => p !== option.path));
                        } else if (selectedItems.length < 3) {
                          saveMobileNavItems([...selectedItems, option.path]);
                        }
                      }}
                      className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : isMaxReached
                          ? 'opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 active:scale-95'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600'
                        }`}>
                        <option.icon size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{option.label}</p>
                        {isSelected ? (
                          <div className="flex items-center text-[10px] text-blue-600 mt-0.5 font-bold uppercase tracking-wider">
                            <Check size={10} className="mr-1" />
                            Selected
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Available</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Smartphone size={16} className="mr-2 text-blue-600" />
                  Bottom Bar Preview
                </p>
                <div className="flex justify-around items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
                  <div className="flex flex-col items-center opacity-40"><LayoutGrid size={18} /><span className="text-[8px] mt-1 font-bold">Home</span></div>
                  {(preferences.mobileNavItems || []).map(path => {
                    const item = MOBILE_NAV_OPTIONS.find(o => o.path === path);
                    if (!item) return null;
                    return (
                      <div key={path} className="flex flex-col items-center text-blue-600">
                        <item.icon size={18} />
                        <span className="text-[8px] mt-1 font-bold">{item.label}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col items-center opacity-40"><MoreVertical size={18} /><span className="text-[8px] mt-1 font-bold">More</span></div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Brand Identity</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 inline mr-2" />
                        )}
                        {settings.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </button>
                      {settings.logo_url && (
                        <button
                          onClick={handleRemoveLogo}
                          disabled={uploadingLogo}
                          className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary_color || '#6366f1'}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={settings.primary_color || '#6366f1'}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Name
                  </label>
                  <Input
                    type="text"
                    value={currentOrganization?.name || devOrgName || ''}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Email
                  </label>
                  <Input
                    type="email"
                    value={settings.business_email || ''}
                    onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Phone
                  </label>
                  <PhoneInput
                    value={settings.business_phone || ''}
                    onChange={(e) => {
                      setSettings({ ...settings, business_phone: e.target.value });
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={settings.business_website || ''}
                    onChange={(e) => setSettings({ ...settings, business_website: e.target.value })}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Address</h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <AddressAutocomplete
                    label="Street Address"
                    value={settings.business_address || ''}
                    onChange={(value) => setSettings({ ...settings, business_address: value })}
                    onAddressSelect={(components: AddressComponents) => {
                      setSettings({
                        ...settings,
                        business_address: components.address,
                        business_city: components.city,
                        business_state: components.state,
                        business_postal_code: components.postal_code,
                        business_country: components.country,
                      });
                    }}
                    placeholder="Start typing an address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <Input
                      type="text"
                      value={settings.business_city || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, business_city: e.target.value });
                      }}
                      placeholder="Toronto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State/Province
                    </label>
                    <Input
                      type="text"
                      value={settings.business_state || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, business_state: e.target.value });
                      }}
                      placeholder="ON"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <Input
                      type="text"
                      value={settings.business_postal_code || ''}
                      onChange={(e) => setSettings({ ...settings, business_postal_code: e.target.value })}
                      placeholder="M5H 2N2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={settings.business_country || 'Canada'}
                      onChange={(e) => setSettings({ ...settings, business_country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Canada">Canada</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Spain">Spain</option>
                      <option value="Italy">Italy</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Japan">Japan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Singapore">Singapore</option>
                      <option value="India">India</option>
                      <option value="Ireland">Ireland</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="max-w-4xl space-y-6">

            {/* Current Plan */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Free Plan
                    </h3>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    All features included during your 30-day trial
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      $0
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      / month
                    </span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Payment Methods</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add a payment method when you upgrade your plan.</p>
            </div>

            {/* Billing History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Billing History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your billing invoices will appear here once you subscribe to a plan.</p>
            </div>

            {/* Usage Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usage This Month</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usage statistics will be available once billing is activated.</p>
            </div>

          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Document Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quote Prefix
                  </label>
                  <Input
                    type="text"
                    value={settings.quote_prefix}
                    onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
                    placeholder="QT"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: QT-0001</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Prefix
                  </label>
                  <Input
                    type="text"
                    value={settings.invoice_prefix}
                    onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                    placeholder="INV"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: INV-0001</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Payment Terms
                  </label>
                  <select
                    value={PAYMENT_TERMS_OPTIONS.find(o => o.key === settings.default_payment_terms) ? settings.default_payment_terms : (settings.default_payment_terms ? 'custom' : '')}
                    onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select default terms...</option>
                    {PAYMENT_TERMS_OPTIONS.map(option => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applied to new invoices and quotes by default</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quote Templates</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select a default template for your quotes
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quoteTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${settings.default_quote_template_id === template.id
                      ? 'ring-2 ring-blue-600 shadow-lg'
                      : 'hover:shadow-lg hover:scale-105'
                      }`}
                    onClick={() => handleSelectTemplate(template.id, 'quote')}
                  >
                    <div className="h-48">
                      {getTemplateThumbnail(template.name)}
                    </div>
                    {settings.default_quote_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{template.layout_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Templates</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select a default template for your invoices
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {invoiceTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${settings.default_invoice_template_id === template.id
                      ? 'ring-2 ring-blue-600 shadow-lg'
                      : 'hover:shadow-lg hover:scale-105'
                      }`}
                    onClick={() => handleSelectTemplate(template.id, 'invoice')}
                  >
                    <div className="h-48">
                      {getTemplateThumbnail(template.name)}
                    </div>
                    {settings.default_invoice_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{template.layout_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="max-w-4xl space-y-6">
            <StripeConnectSettings organizationId={currentOrganization?.id} />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payment Methods</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which payment methods you accept
              </p>

              <div className="space-y-3">
                {['Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'Cash', 'PayPal'].map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-white">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'twilio' && (
          <SMSSettingsTab organizationId={currentOrganization.id} industry={currentOrganization.industry || 'general_business'} />
        )}

        {activeTab === 'calendar' && (
          <div className="max-w-4xl">
            <CalendarSettings />
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="space-y-6">

            {/* Team Members with Access */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Members
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage who has access to your CRM data
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
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
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {member.full_name || 'Unnamed User'}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${member.role === 'owner' ? 'bg-blue-600 text-white' :
                              member.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              }`}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </p>
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
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Full Access
                        </div>
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

            {/* Shared Resources — Dynamic per industry */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Shared Resources
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Control what team members can access
                </p>
              </div>

              <div className="p-6 space-y-4">
                {(() => {
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

                  return shareableModules.map((moduleId: string) => {
                    const label = INDUSTRY_LABELS[industry]?.[moduleId]?.name || AVAILABLE_MODULES[moduleId]?.name || moduleId;
                    const description = moduleDescriptions[moduleId] || `Share ${label} with team`;
                    const icon = moduleIcons[moduleId] || <LayoutGrid className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
                    const isShared = currentOrganization?.metadata?.sharing?.[moduleId] ?? true;

                    return (
                      <div key={moduleId} className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            {icon}
                          </div>
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
                  });
                })()}
              </div>
            </div>

            {/* External Sharing & Integrations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  External Sharing
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Share data with external tools and platforms
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Public Link Sharing */}
                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          Public Booking Link
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Share this link for customers to book appointments
                        </p>
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
                        } catch (err) {
                          toast.error('Failed to activate booking link');
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      {currentOrganization?.metadata?.sharing?.booking_link_enabled ? 'Active' : 'Generate Link'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      value={bookingUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                    />
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
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          Zapier Integration
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Connect to 6,000+ apps
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowZapierModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-sm transition-colors shadow-sm shadow-orange-200 dark:shadow-none"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                {/* Webhook URL */}
                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          Webhooks
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive real-time CRM events
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWebhook(undefined);
                        setShowWebhookModal(true);
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-medium transition-colors"
                    >
                      Add Webhook
                    </button>
                  </div>

                  {loadingWebhooks ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  ) : webhooks.length > 0 ? (
                    <div className="space-y-2">
                      {webhooks.map(webhook => (
                        <div key={webhook.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{webhook.url}</p>
                            <p className="text-[10px] text-gray-500">{webhook.events.join(', ')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedWebhook(webhook);
                                setShowWebhookModal(true);
                              }}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500"
                            >
                              <SettingsIcon size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500"
                            >
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

                {/* API Access */}
                <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/30 dark:bg-gray-900/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                        <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          API Keys
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Manage access keys for custom integrations
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm transition-colors"
                    >
                      New Key
                    </button>
                  </div>

                  {loadingApiKeys ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                    </div>
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
                            <button
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500"
                            >
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
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">
                    Permission Levels
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Owner:</strong> Full control including billing and team management
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Admin:</strong> Manage all CRM data and settings except billing
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Full Access:</strong> Create, edit, and delete all records
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Can Edit:</strong> View and edit existing records
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Can View:</strong> Read-only access to CRM data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'voiceagent' && <VoiceAgentSetup />}
        {activeTab === 'help' && <HelpCenterTab />}
        {activeTab === 'email' && <EmailConnectionSettings />}

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
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
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
